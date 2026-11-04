CREATE TABLE "org_project_payments" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "invoiceNumber" TEXT,
    "amount" DECIMAL(65,30) NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "paidAt" TIMESTAMP(3),
    "orgId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "companyId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "org_project_payments_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "org_project_payments_orgId_idx" ON "org_project_payments"("orgId");
CREATE INDEX "org_project_payments_projectId_idx" ON "org_project_payments"("projectId");
CREATE INDEX "org_project_payments_companyId_idx" ON "org_project_payments"("companyId");

ALTER TABLE "org_project_payments" ADD CONSTRAINT "org_project_payments_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "org_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "org_project_payments" ADD CONSTRAINT "org_project_payments_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "org_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "org_project_payments" ADD CONSTRAINT "org_project_payments_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "executing_companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;
