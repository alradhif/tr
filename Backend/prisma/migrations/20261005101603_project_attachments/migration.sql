-- CreateTable
CREATE TABLE "org_project_attachments" (
    "id" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileType" TEXT,
    "fileSize" INTEGER,
    "storageKey" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "uploadedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "org_project_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "client_project_attachments" (
    "id" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileType" TEXT,
    "fileSize" INTEGER,
    "storageKey" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "uploadedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "client_project_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "org_project_attachments_storageKey_key" ON "org_project_attachments"("storageKey");

-- CreateIndex
CREATE INDEX "org_project_attachments_projectId_idx" ON "org_project_attachments"("projectId");

-- CreateIndex
CREATE INDEX "org_project_attachments_uploadedBy_idx" ON "org_project_attachments"("uploadedBy");

-- CreateIndex
CREATE UNIQUE INDEX "client_project_attachments_storageKey_key" ON "client_project_attachments"("storageKey");

-- CreateIndex
CREATE INDEX "client_project_attachments_projectId_idx" ON "client_project_attachments"("projectId");

-- CreateIndex
CREATE INDEX "client_project_attachments_uploadedBy_idx" ON "client_project_attachments"("uploadedBy");

-- AddForeignKey
ALTER TABLE "org_project_attachments" ADD CONSTRAINT "org_project_attachments_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "org_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "org_project_attachments" ADD CONSTRAINT "org_project_attachments_uploadedBy_fkey" FOREIGN KEY ("uploadedBy") REFERENCES "org_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_project_attachments" ADD CONSTRAINT "client_project_attachments_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "client_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_project_attachments" ADD CONSTRAINT "client_project_attachments_uploadedBy_fkey" FOREIGN KEY ("uploadedBy") REFERENCES "client_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
