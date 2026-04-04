-- Add fullName to UserCertification (nullable; existing rows keep NULL, certificate falls back to email)
ALTER TABLE "UserCertification" ADD COLUMN "fullName" TEXT;
