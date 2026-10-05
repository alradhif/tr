-- Add DRAFT to the existing project approval workflow.
-- Existing PENDING / APPROVED / REJECTED rows are unchanged.

ALTER TYPE "ApprovalStatus" ADD VALUE IF NOT EXISTS 'DRAFT';

ALTER TABLE "org_projects" ALTER COLUMN "approvalStatus" SET DEFAULT 'DRAFT';
