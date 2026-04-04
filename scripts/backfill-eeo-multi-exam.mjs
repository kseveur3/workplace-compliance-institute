/**
 * One-time backfill: EEO Investigator exam into multi-exam tables.
 *
 * PaidUser       → ExamAccess       (examId = exam_eeo_investigator)
 * Certification  → UserCertification (examId = exam_eeo_investigator)
 *
 * Idempotent: safe to re-run.
 * Does not modify legacy tables.
 * Does not change application reads.
 */

import "dotenv/config";
import pg from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const EXAM_ID = "exam_eeo_investigator";

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL
    ?.replace(/[?&]sslmode=require\b/, "")
    .replace(/[?&]channel_binding=require\b/, ""),
  ssl: { rejectUnauthorized: false },
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const counts = {
  paidUsersRead: 0,
  examAccessCreated: 0,
  examAccessUpdated: 0,
  certificationsRead: 0,
  certificationsDeduped: 0,
  userCertificationsCreated: 0,
  userCertificationsSkipped: 0,
  errors: 0,
};

async function main() {
  // ── Step 1: PaidUser → ExamAccess ────────────────────────────────────────────

  const paidUsers = await prisma.paidUser.findMany();
  counts.paidUsersRead = paidUsers.length;
  console.log(`PaidUser rows found: ${paidUsers.length}`);

  for (const pu of paidUsers) {
    try {
      const existing = await prisma.examAccess.findUnique({
        where: { clerkUserId_examId: { clerkUserId: pu.clerkUserId, examId: EXAM_ID } },
      });

      if (!existing) {
        await prisma.examAccess.create({
          data: {
            clerkUserId: pu.clerkUserId,
            examId: EXAM_ID,
            purchasedAt: pu.paidAt,
            ceuAccessUntil: pu.ceuAccessUntil ?? null,
          },
        });
        counts.examAccessCreated++;
      } else {
        // Preserve the later ceuAccessUntil — don't downgrade a fresher dual-written value.
        const existingUntil = existing.ceuAccessUntil?.getTime() ?? 0;
        const legacyUntil = pu.ceuAccessUntil?.getTime() ?? 0;
        if (legacyUntil > existingUntil) {
          await prisma.examAccess.update({
            where: { clerkUserId_examId: { clerkUserId: pu.clerkUserId, examId: EXAM_ID } },
            data: { ceuAccessUntil: pu.ceuAccessUntil },
          });
          counts.examAccessUpdated++;
        }
        // else: existing value is equal or newer — no update needed
      }
    } catch (err) {
      console.error(`[ExamAccess] Error for ${pu.clerkUserId}:`, err.message);
      counts.errors++;
    }
  }

  // ── Step 2: Certification → UserCertification ─────────────────────────────────
  // Also ensures ExamAccess exists for users who have Certification but no PaidUser.

  const certifications = await prisma.certification.findMany({
    orderBy: { createdAt: "desc" },
  });
  counts.certificationsRead = certifications.length;
  console.log(`Certification rows found: ${certifications.length}`);

  // Deduplicate: keep only the most recent Certification per clerkUserId.
  // findMany is sorted desc by createdAt, so first occurrence = latest.
  const latestByUser = new Map();
  for (const cert of certifications) {
    if (!latestByUser.has(cert.clerkUserId)) {
      latestByUser.set(cert.clerkUserId, cert);
    }
  }
  counts.certificationsDeduped = certifications.length - latestByUser.size;
  console.log(`Certifications after dedup: ${latestByUser.size} (${counts.certificationsDeduped} duplicates dropped)`);

  for (const cert of latestByUser.values()) {
    try {
      // Ensure ExamAccess exists — handles users with Certification but no PaidUser.
      await prisma.examAccess.upsert({
        where: { clerkUserId_examId: { clerkUserId: cert.clerkUserId, examId: EXAM_ID } },
        create: {
          clerkUserId: cert.clerkUserId,
          examId: EXAM_ID,
          purchasedAt: cert.issuedAt,
          ceuAccessUntil: null,
        },
        update: {},
      });

      // Create UserCertification only if it does not already exist.
      const existingUC = await prisma.userCertification.findUnique({
        where: { clerkUserId_examId: { clerkUserId: cert.clerkUserId, examId: EXAM_ID } },
      });

      if (!existingUC) {
        await prisma.userCertification.create({
          data: {
            clerkUserId: cert.clerkUserId,
            examId: EXAM_ID,
            issuedAt: cert.issuedAt,
            expiresAt: cert.expiresAt,
            renewedAt: cert.renewedAt ?? null,
            ceuPaidAt: cert.ceuPaidAt ?? null,
          },
        });
        counts.userCertificationsCreated++;
      } else {
        counts.userCertificationsSkipped++;
      }
    } catch (err) {
      console.error(`[UserCertification] Error for ${cert.clerkUserId}:`, err.message);
      counts.errors++;
    }
  }

  // ── Summary ───────────────────────────────────────────────────────────────────

  console.log("\n── Backfill complete ──");
  console.log(`  PaidUser rows read:              ${counts.paidUsersRead}`);
  console.log(`  ExamAccess created:              ${counts.examAccessCreated}`);
  console.log(`  ExamAccess updated (ceuUntil):   ${counts.examAccessUpdated}`);
  console.log(`  Certification rows read:         ${counts.certificationsRead}`);
  console.log(`  Certifications deduped (dropped):${counts.certificationsDeduped}`);
  console.log(`  UserCertification created:       ${counts.userCertificationsCreated}`);
  console.log(`  UserCertification skipped:       ${counts.userCertificationsSkipped}`);
  console.log(`  Errors:                          ${counts.errors}`);
}

main()
  .catch((err) => {
    console.error("Fatal error:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
