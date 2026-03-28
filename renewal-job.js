// Renewal reminder job.
// Queries Certification records, determines which reminders are due,
// sends a real email via Resend, then writes an EmailLog row on success.
// Run manually: node renewal-job.js

import { fileURLToPath } from "url";
import "dotenv/config";
import { getEmailForUser } from "./clerk-helpers.js";
import { sendEmail } from "./email-service.js";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
  datasources: { db: { url: process.env.DATABASE_URL } },
});

// Reminder thresholds (in whole UTC days until expiration).
const REMINDER_TYPES = [
  { type: "30_day", days: 30 },
  { type: "14_day", days: 14 },
  { type: "3_day",  days: 3  },
];

// Subject line for each reminder type.
const SUBJECTS = {
  "30_day": "Your certification expires in 30 days",
  "14_day": "Reminder: 14 days left to renew your certification",
  "3_day":  "Final reminder: your certification expires in 3 days",
  "expired": "Your certification has expired",
};

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
        html: `<p>${SUBJECTS[type]}</p>`,
        text: SUBJECTS[type],
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
