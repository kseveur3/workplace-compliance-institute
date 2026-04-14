-- AddColumn: isCeuOnly flag on UserCertification
-- Distinguishes external CEU-only completion records (true) from
-- full certification records (false / default). Used by /my-exams
-- to prevent CEU-only users from appearing as full certification owners.
ALTER TABLE "UserCertification" ADD COLUMN "isCeuOnly" BOOLEAN NOT NULL DEFAULT false;
