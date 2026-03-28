// Renewal reminder job.
// Queries Certification records, determines which reminders are due,
// sends a real email via Resend, then writes an EmailLog row on success.
// Run manually: node renewal-job.js

import { fileURLToPath } from "url";
import "dotenv/config";
import { getEmailForUser } from "./clerk-helpers.js";
import { sendEmail } from "./email-service.js";
import pg from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL?.replace(/[?&]sslmode=require\b/, ""),
  ssl: { rejectUnauthorized: false },
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Reminder thresholds (in whole UTC days until expiration).
const REMINDER_TYPES = [
  { type: "30_day", days: 30 },
  { type: "14_day", days: 14 },
  { type: "3_day",  days: 3  },
];

// Subject line for each reminder type.
const SUBJECTS = {
  "30_day":  "Your certification expires in 30 days",
  "14_day":  "Reminder: certification expires in 14 days",
  "3_day":   "Final reminder: certification expires soon",
  "expired": "Your certification has expired",
};

const APP_URL = "https://workplace-compliance-institute-7038dd310f4d.herokuapp.com";
const LOGO_URL = `${APP_URL}/logo-icon.png`;

// Body copy for each reminder type.
const BODY_TEXT = {
  "30_day":  "Your Workplace Compliance Institute certification expires in 30 days. Renew now to keep your credentials current and avoid any lapse in compliance.",
  "14_day":  "Your certification expires in 14 days. Don't wait — renew today to stay compliant and keep your certificate active.",
  "3_day":   "Your certification expires in just 3 days. This is your final reminder to renew before your credentials lapse.",
  "expired": "Your Workplace Compliance Institute certification has expired. Renew now to restore your compliance status.",
};

// Build a production-quality HTML email with logo, CTA, and footer.
function buildEmailHtml(type) {
  const body = BODY_TEXT[type];
  return `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f5;">
<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#f4f4f5;">
  <tr>
    <td align="center" style="padding:32px 16px;">
      <table width="500" cellpadding="0" cellspacing="0" role="presentation" style="background:#ffffff;border-radius:8px;padding:32px;">

        <!-- Logo -->
        <tr>
          <td align="center" style="padding-bottom:24px;">
            <img src="${LOGO_URL}" width="120" alt="Workplace Compliance Institute" style="display:block;">
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="font-family:Arial,sans-serif;color:#333333;font-size:16px;line-height:1.6;">
            <p style="margin:0 0 16px;">${body}</p>
          </td>
        </tr>

        <!-- CTA -->
        <tr>
          <td align="center" style="padding-top:24px;">
            <a href="${APP_URL}"
               style="display:inline-block;background:#2563eb;color:#ffffff;padding:12px 24px;text-decoration:none;border-radius:6px;font-family:Arial,sans-serif;font-weight:bold;font-size:15px;">
              Renew Certification
            </a>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding-top:32px;font-family:Arial,sans-serif;font-size:12px;color:#777777;text-align:center;">
            Workplace Compliance Institute
          </td>
        </tr>

      </table>
    </td>
  </tr>
</table>
</body>
</html>`.trim();
}

// Calculate whole-day difference in UTC, avoiding local-timezone skew.
function utcDaysUntil(expiresAt) {
  const now = new Date();
  const todayUTC   = Date.UTC(now.getUTCFullYear(),       now.getUTCMonth(),       now.getUTCDate());
  const expiresUTC = Date.UTC(expiresAt.getUTCFullYear(), expiresAt.getUTCMonth(), expiresAt.getUTCDate());
  return Math.round((expiresUTC - todayUTC) / (24 * 60 * 60 * 1000));
}

// Determine which reminder type (if any) applies to this record today.
function reminderTypeFor(daysUntil) {
  if (daysUntil < 0) return "expired";
  const match = REMINDER_TYPES.find((r) => r.days === daysUntil);
  return match ? match.type : null;
}

export async function runRenewalJob() {
  console.log("[renewal-job] Starting");

  // Fetch all certifications with their existing email logs for in-memory dedup.
  const certifications = await prisma.certification.findMany({
    include: { emailLogs: { select: { type: true } } },
  });

  console.log(`[renewal-job] Found ${certifications.length} certification(s)`);

  let sent = 0;
  let skipped = 0;
  let failed = 0;

  for (const cert of certifications) {
    const daysUntil = utcDaysUntil(cert.expiresAt);
    const type = reminderTypeFor(daysUntil);

    // No reminder due today for this record.
    if (!type) {
      console.log(`[renewal-job] cert ${cert.id} (${cert.clerkUserId}): ${daysUntil}d — no reminder due`);
      continue;
    }

    // Dedup: skip if an EmailLog already exists for this certificationId + type.
    const alreadySent = cert.emailLogs.some((log) => log.type === type);
    if (alreadySent) {
      console.log(`[renewal-job] cert ${cert.id} (${cert.clerkUserId}): type=${type} — already sent, skipping`);
      skipped++;
      continue;
    }

    // Resolve recipient email via Clerk; skip entirely if not found.
    const email = await getEmailForUser(cert.clerkUserId);
    if (!email) {
      console.warn(`[renewal-job] WARN cert ${cert.id} (${cert.clerkUserId}): email not found in Clerk — skipping`);
      skipped++;
      continue;
    }

    // Send email. Only create EmailLog on success; log and move on if it fails.
    try {
      await sendEmail({
        to: email,
        subject: SUBJECTS[type],
        html: buildEmailHtml(type),
        text: BODY_TEXT[type],
      });

      await prisma.emailLog.create({
        data: { clerkUserId: cert.clerkUserId, certificationId: cert.id, type },
      });

      console.log(`[renewal-job] SENT cert ${cert.id} | email=${email} | type=${type} | daysUntil=${daysUntil}`);
      sent++;
    } catch (err) {
      console.error(`[renewal-job] FAILED cert ${cert.id} | email=${email} | type=${type} | error=${err.message}`);
      failed++;
    }
  }

  console.log(`[renewal-job] Done. sent=${sent} skipped=${skipped} failed=${failed}`);
}

// Only auto-run and disconnect when executed directly (node renewal-job.js),
// not when imported as a module.
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runRenewalJob()
    .catch((err) => {
      console.error("[renewal-job] Fatal error:", err);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}
