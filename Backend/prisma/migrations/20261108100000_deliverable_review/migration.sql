CREATE TYPE "DeliverableReviewStatus" AS ENUM ('NOT_SUBMITTED', 'PENDING', 'CHANGES_REQUESTED', 'APPROVED');

ALTER TABLE "org_deliverables"
  ADD COLUMN "reviewStatus" "DeliverableReviewStatus" NOT NULL DEFAULT 'NOT_SUBMITTED',
  ADD COLUMN "version" INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN "submittedAt" TIMESTAMP(3),
  ADD COLUMN "submittedByName" TEXT,
  ADD COLUMN "reviewedAt" TIMESTAMP(3),
  ADD COLUMN "reviewedByName" TEXT,
  ADD COLUMN "reviewNote" TEXT;

-- Deliverables already marked complete keep counting toward progress.
UPDATE "org_deliverables" SET "reviewStatus" = 'APPROVED' WHERE "status" = 'COMPLETED';
