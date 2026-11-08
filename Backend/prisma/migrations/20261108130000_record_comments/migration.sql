CREATE TABLE "org_record_comments" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "recordType" TEXT NOT NULL,
    "recordId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "org_record_comments_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "org_record_comments_recordType_recordId_idx" ON "org_record_comments"("recordType", "recordId");
CREATE INDEX "org_record_comments_projectId_idx" ON "org_record_comments"("projectId");

ALTER TABLE "org_record_comments" ADD CONSTRAINT "org_record_comments_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "org_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "org_record_comments" ADD CONSTRAINT "org_record_comments_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "org_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "org_project_payments" ADD COLUMN "receiptUrl" TEXT, ADD COLUMN "receiptName" TEXT;
