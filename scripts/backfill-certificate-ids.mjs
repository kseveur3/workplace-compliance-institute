/**
 * One-time backfill: assign certificateId to UserCertification rows where it is null.
 *
 * - Only updates rows with certificateId = null
 * - Never overwrites an existing certificateId
 * - Uses the same ID format as /complete-exam: WCI-EEO-<6 uppercase alphanumeric chars>
 * - Avoids collisions by checking uniqueness before writing (with retry up to MAX_ATTEMPTS)
 * - Idempotent: safe to re-run
 */

import "dotenv/config";
import pg from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // matches /complete-exam — no O/0/I/1
const MAX_ATTEMPTS = 20; // attempts per row before giving up

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL
    ?.replace(/[?&]sslmode=require\b/, "")
    .replace(/[?&]channel_binding=require\b/, ""),
  ssl: { rejectUnauthorized: false },
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

function generateId() {
  const suffix = Array.from(
    { length: 6 },
    () => CHARS[Math.floor(Math.random() * CHARS.length)]
  ).join("");
  return `WCI-EEO-${suffix}`;
}

const counts = {
  rowsRead: 0,
  updated: 0,
  skipped: 0,
  errors: 0,
};

async function main() {
  const rows = await prisma.userCertification.findMany({
    where: { certificateId: null },
    select: { id: true, clerkUserId: true },
  });

  counts.rowsRead = rows.length;
  console.log(`Rows with null certificateId: ${rows.length}`);

  for (const row of rows) {
    let assigned = false;
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      const candidateId = generateId();
      // Check uniqueness before writing — avoids unique-constraint errors
      const collision = await prisma.userCertification.findUnique({
        where: { certificateId: candidateId },
        select: { id: true },
      });
      if (collision) {
        console.warn(`  [${row.clerkUserId}] Collision on attempt ${attempt}: ${candidateId}`);
        continue;
      }
      try {
        await prisma.userCertification.update({
          where: { id: row.id },
          data: { certificateId: candidateId },
        });
        console.log(`  Assigned ${candidateId} → ${row.clerkUserId}`);
        counts.updated++;
        assigned = true;
        break;
      } catch (err) {
        // Unique constraint race — another process may have just used this ID
        console.warn(`  [${row.clerkUserId}] Write collision on attempt ${attempt}: ${err.message}`);
      }
    }
    if (!assigned) {
      console.error(`  [${row.clerkUserId}] FAILED: could not generate a unique ID after ${MAX_ATTEMPTS} attempts`);
      counts.errors++;
    }
  }

  console.log("\n── Backfill complete ──");
  console.log(`  Rows read (null certificateId): ${counts.rowsRead}`);
  console.log(`  Updated:                        ${counts.updated}`);
  console.log(`  Errors (gave up):               ${counts.errors}`);
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
