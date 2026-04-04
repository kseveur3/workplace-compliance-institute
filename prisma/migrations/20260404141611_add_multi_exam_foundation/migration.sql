-- CreateTable
CREATE TABLE "Exam" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "stripePriceId" TEXT NOT NULL,
    "ceuPriceId" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Exam_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExamAccess" (
    "id" TEXT NOT NULL,
    "clerkUserId" TEXT NOT NULL,
    "examId" TEXT NOT NULL,
    "purchasedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ceuAccessUntil" TIMESTAMP(3),

    CONSTRAINT "ExamAccess_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserCertification" (
    "id" TEXT NOT NULL,
    "clerkUserId" TEXT NOT NULL,
    "examId" TEXT NOT NULL,
    "issuedAt" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "renewedAt" TIMESTAMP(3),
    "ceuPaidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserCertification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Exam_slug_key" ON "Exam"("slug");

-- CreateIndex
CREATE INDEX "ExamAccess_clerkUserId_idx" ON "ExamAccess"("clerkUserId");

-- CreateIndex
CREATE UNIQUE INDEX "ExamAccess_clerkUserId_examId_key" ON "ExamAccess"("clerkUserId", "examId");

-- CreateIndex
CREATE INDEX "UserCertification_clerkUserId_idx" ON "UserCertification"("clerkUserId");

-- CreateIndex
CREATE INDEX "UserCertification_expiresAt_idx" ON "UserCertification"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "UserCertification_clerkUserId_examId_key" ON "UserCertification"("clerkUserId", "examId");

-- AddForeignKey
ALTER TABLE "ExamAccess" ADD CONSTRAINT "ExamAccess_examId_fkey" FOREIGN KEY ("examId") REFERENCES "Exam"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserCertification" ADD CONSTRAINT "UserCertification_examId_fkey" FOREIGN KEY ("examId") REFERENCES "Exam"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
