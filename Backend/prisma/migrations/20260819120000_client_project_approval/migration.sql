-- Mirror org project approval on client projects.
-- Existing live client projects stay accepted so current work is not reset to draft.

ALTER TABLE "client_projects" ADD COLUMN "approvalStatus" "ApprovalStatus" NOT NULL DEFAULT 'DRAFT',
ADD COLUMN "approvedAt" TIMESTAMP(3),
ADD COLUMN "approvedBy" TEXT,
ADD COLUMN "rejectionReason" TEXT;

UPDATE "client_projects"
SET "approvalStatus" = 'APPROVED',
    "approvedAt" = COALESCE("updatedAt", NOW())
WHERE "approvalStatus" = 'DRAFT';
