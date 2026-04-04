-- Add certificateId to UserCertification (nullable; existing rows keep NULL)
ALTER TABLE "UserCertification" ADD COLUMN "certificateId" TEXT;

-- Unique constraint: each issued certificate gets a distinct ID
CREATE UNIQUE INDEX "UserCertification_certificateId_key" ON "UserCertification"("certificateId");
