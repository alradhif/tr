/*
  Warnings:

  - You are about to drop the column `userType` on the `activity_logs` table. All the data in the column will be lost.
  - You are about to drop the column `userType` on the `audit_logs` table. All the data in the column will be lost.
  - The `oldData` column on the `audit_logs` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `newData` column on the `audit_logs` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `userType` on the `notifications` table. All the data in the column will be lost.
  - You are about to drop the column `userType` on the `password_reset_tokens` table. All the data in the column will be lost.
  - Added the required column `updatedAt` to the `account_subscriptions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `actorType` to the `activity_logs` table without a default value. This is not possible if the table is not empty.
  - Added the required column `actorType` to the `audit_logs` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `client_accounts` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `client_deliverables` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `client_projects` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `client_risks` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `client_strategy_documents` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `client_users` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `departments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `executing_companies` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `financial_reports` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `invoices` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `jodayn_users` table without a default value. This is not possible if the table is not empty.
  - Added the required column `actorType` to the `notifications` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `org_accounts` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `org_deliverables` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `org_projects` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `org_risks` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `org_strategy_documents` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `org_users` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `packages` table without a default value. This is not possible if the table is not empty.
  - Added the required column `actorType` to the `password_reset_tokens` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `revenue_forecasts` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `sectors` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `super_admins` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ActorType" AS ENUM ('SUPER_ADMIN', 'JODAYN', 'ORG', 'CLIENT');

-- DropForeignKey
ALTER TABLE "client_accounts" DROP CONSTRAINT "client_accounts_createdBy_fkey";

-- DropForeignKey
ALTER TABLE "org_accounts" DROP CONSTRAINT "org_accounts_createdBy_fkey";

-- AlterTable
ALTER TABLE "account_subscriptions" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "activity_logs" DROP COLUMN "userType",
ADD COLUMN     "actorType" "ActorType" NOT NULL;

-- AlterTable
ALTER TABLE "audit_logs" DROP COLUMN "userType",
ADD COLUMN     "actorType" "ActorType" NOT NULL,
DROP COLUMN "oldData",
ADD COLUMN     "oldData" JSONB,
DROP COLUMN "newData",
ADD COLUMN     "newData" JSONB;

-- AlterTable
ALTER TABLE "client_accounts" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "client_deliverables" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "client_projects" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "client_risks" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "client_strategy_documents" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "client_users" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "departments" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "executing_companies" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "financial_reports" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "invoices" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "jodayn_users" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "notifications" DROP COLUMN "userType",
ADD COLUMN     "actorType" "ActorType" NOT NULL;

-- AlterTable
ALTER TABLE "org_accounts" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "org_deliverables" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "org_projects" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "org_risks" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "org_strategy_documents" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "org_users" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "packages" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "password_reset_tokens" DROP COLUMN "userType",
ADD COLUMN     "actorType" "ActorType" NOT NULL;

-- AlterTable
ALTER TABLE "revenue_forecasts" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "sectors" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "super_admins" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- DropEnum
DROP TYPE "UserType";

-- CreateIndex
CREATE INDEX "account_subscriptions_packageId_idx" ON "account_subscriptions"("packageId");

-- CreateIndex
CREATE INDEX "account_subscriptions_createdBy_idx" ON "account_subscriptions"("createdBy");

-- CreateIndex
CREATE INDEX "account_subscriptions_accountType_accountId_idx" ON "account_subscriptions"("accountType", "accountId");

-- CreateIndex
CREATE INDEX "activity_logs_userId_idx" ON "activity_logs"("userId");

-- CreateIndex
CREATE INDEX "activity_logs_superAdminId_idx" ON "activity_logs"("superAdminId");

-- CreateIndex
CREATE INDEX "audit_logs_tableName_recordId_idx" ON "audit_logs"("tableName", "recordId");

-- CreateIndex
CREATE INDEX "audit_logs_performedBy_idx" ON "audit_logs"("performedBy");

-- CreateIndex
CREATE INDEX "client_accounts_sectorId_idx" ON "client_accounts"("sectorId");

-- CreateIndex
CREATE INDEX "client_accounts_createdBy_idx" ON "client_accounts"("createdBy");

-- CreateIndex
CREATE INDEX "client_change_request_attachments_requestId_idx" ON "client_change_request_attachments"("requestId");

-- CreateIndex
CREATE INDEX "client_change_request_attachments_uploadedBy_idx" ON "client_change_request_attachments"("uploadedBy");

-- CreateIndex
CREATE INDEX "client_change_requests_projectId_idx" ON "client_change_requests"("projectId");

-- CreateIndex
CREATE INDEX "client_change_requests_requestedBy_idx" ON "client_change_requests"("requestedBy");

-- CreateIndex
CREATE INDEX "client_contracts_projectId_idx" ON "client_contracts"("projectId");

-- CreateIndex
CREATE INDEX "client_contracts_uploadedBy_idx" ON "client_contracts"("uploadedBy");

-- CreateIndex
CREATE INDEX "client_deliverable_attachments_deliverableId_idx" ON "client_deliverable_attachments"("deliverableId");

-- CreateIndex
CREATE INDEX "client_deliverable_attachments_uploadedBy_idx" ON "client_deliverable_attachments"("uploadedBy");

-- CreateIndex
CREATE INDEX "client_deliverable_comments_deliverableId_idx" ON "client_deliverable_comments"("deliverableId");

-- CreateIndex
CREATE INDEX "client_deliverable_comments_authorId_idx" ON "client_deliverable_comments"("authorId");

-- CreateIndex
CREATE INDEX "client_deliverables_projectId_idx" ON "client_deliverables"("projectId");

-- CreateIndex
CREATE INDEX "client_deliverables_responsibleId_idx" ON "client_deliverables"("responsibleId");

-- CreateIndex
CREATE INDEX "client_goal_project_links_goalId_idx" ON "client_goal_project_links"("goalId");

-- CreateIndex
CREATE INDEX "client_goal_project_links_projectId_idx" ON "client_goal_project_links"("projectId");

-- CreateIndex
CREATE INDEX "client_kpi_snapshots_goalId_idx" ON "client_kpi_snapshots"("goalId");

-- CreateIndex
CREATE INDEX "client_project_phases_projectId_idx" ON "client_project_phases"("projectId");

-- CreateIndex
CREATE INDEX "client_project_team_members_projectId_idx" ON "client_project_team_members"("projectId");

-- CreateIndex
CREATE INDEX "client_projects_clientId_idx" ON "client_projects"("clientId");

-- CreateIndex
CREATE INDEX "client_projects_managerId_idx" ON "client_projects"("managerId");

-- CreateIndex
CREATE INDEX "client_request_logs_requestId_idx" ON "client_request_logs"("requestId");

-- CreateIndex
CREATE INDEX "client_request_logs_performedBy_idx" ON "client_request_logs"("performedBy");

-- CreateIndex
CREATE INDEX "client_risk_actions_riskId_idx" ON "client_risk_actions"("riskId");

-- CreateIndex
CREATE INDEX "client_risks_projectId_idx" ON "client_risks"("projectId");

-- CreateIndex
CREATE INDEX "client_scenario_analyses_clientProjectId_idx" ON "client_scenario_analyses"("clientProjectId");

-- CreateIndex
CREATE INDEX "client_scenario_analyses_createdBy_idx" ON "client_scenario_analyses"("createdBy");

-- CreateIndex
CREATE INDEX "client_strategic_goal_stages_goalId_idx" ON "client_strategic_goal_stages"("goalId");

-- CreateIndex
CREATE INDEX "client_strategic_goals_documentId_idx" ON "client_strategic_goals"("documentId");

-- CreateIndex
CREATE INDEX "client_strategic_goals_clientId_idx" ON "client_strategic_goals"("clientId");

-- CreateIndex
CREATE INDEX "client_strategy_documents_clientId_idx" ON "client_strategy_documents"("clientId");

-- CreateIndex
CREATE INDEX "client_strategy_documents_uploadedBy_idx" ON "client_strategy_documents"("uploadedBy");

-- CreateIndex
CREATE INDEX "client_users_clientId_idx" ON "client_users"("clientId");

-- CreateIndex
CREATE INDEX "department_employees_departmentId_idx" ON "department_employees"("departmentId");

-- CreateIndex
CREATE INDEX "departments_orgId_idx" ON "departments"("orgId");

-- CreateIndex
CREATE INDEX "executing_companies_orgId_idx" ON "executing_companies"("orgId");

-- CreateIndex
CREATE INDEX "executing_company_team_companyId_idx" ON "executing_company_team"("companyId");

-- CreateIndex
CREATE INDEX "financial_reports_orgId_idx" ON "financial_reports"("orgId");

-- CreateIndex
CREATE INDEX "financial_reports_clientId_idx" ON "financial_reports"("clientId");

-- CreateIndex
CREATE INDEX "invoices_orgId_idx" ON "invoices"("orgId");

-- CreateIndex
CREATE INDEX "invoices_clientId_idx" ON "invoices"("clientId");

-- CreateIndex
CREATE INDEX "notifications_userId_idx" ON "notifications"("userId");

-- CreateIndex
CREATE INDEX "org_accounts_sectorId_idx" ON "org_accounts"("sectorId");

-- CreateIndex
CREATE INDEX "org_accounts_createdBy_idx" ON "org_accounts"("createdBy");

-- CreateIndex
CREATE INDEX "org_change_request_attachments_requestId_idx" ON "org_change_request_attachments"("requestId");

-- CreateIndex
CREATE INDEX "org_change_request_attachments_uploadedBy_idx" ON "org_change_request_attachments"("uploadedBy");

-- CreateIndex
CREATE INDEX "org_change_requests_projectId_idx" ON "org_change_requests"("projectId");

-- CreateIndex
CREATE INDEX "org_change_requests_requestedBy_idx" ON "org_change_requests"("requestedBy");

-- CreateIndex
CREATE INDEX "org_contracts_projectId_idx" ON "org_contracts"("projectId");

-- CreateIndex
CREATE INDEX "org_contracts_uploadedBy_idx" ON "org_contracts"("uploadedBy");

-- CreateIndex
CREATE INDEX "org_deliverable_attachments_deliverableId_idx" ON "org_deliverable_attachments"("deliverableId");

-- CreateIndex
CREATE INDEX "org_deliverable_attachments_uploadedBy_idx" ON "org_deliverable_attachments"("uploadedBy");

-- CreateIndex
CREATE INDEX "org_deliverable_comments_deliverableId_idx" ON "org_deliverable_comments"("deliverableId");

-- CreateIndex
CREATE INDEX "org_deliverable_comments_authorId_idx" ON "org_deliverable_comments"("authorId");

-- CreateIndex
CREATE INDEX "org_deliverables_projectId_idx" ON "org_deliverables"("projectId");

-- CreateIndex
CREATE INDEX "org_deliverables_responsibleId_idx" ON "org_deliverables"("responsibleId");

-- CreateIndex
CREATE INDEX "org_goal_project_links_goalId_idx" ON "org_goal_project_links"("goalId");

-- CreateIndex
CREATE INDEX "org_goal_project_links_projectId_idx" ON "org_goal_project_links"("projectId");

-- CreateIndex
CREATE INDEX "org_kpi_snapshots_goalId_idx" ON "org_kpi_snapshots"("goalId");

-- CreateIndex
CREATE INDEX "org_project_phases_projectId_idx" ON "org_project_phases"("projectId");

-- CreateIndex
CREATE INDEX "org_project_team_members_projectId_idx" ON "org_project_team_members"("projectId");

-- CreateIndex
CREATE INDEX "org_projects_orgId_idx" ON "org_projects"("orgId");

-- CreateIndex
CREATE INDEX "org_projects_managerId_idx" ON "org_projects"("managerId");

-- CreateIndex
CREATE INDEX "org_projects_departmentId_idx" ON "org_projects"("departmentId");

-- CreateIndex
CREATE INDEX "org_projects_executingCompanyId_idx" ON "org_projects"("executingCompanyId");

-- CreateIndex
CREATE INDEX "org_request_logs_requestId_idx" ON "org_request_logs"("requestId");

-- CreateIndex
CREATE INDEX "org_request_logs_performedBy_idx" ON "org_request_logs"("performedBy");

-- CreateIndex
CREATE INDEX "org_risk_actions_riskId_idx" ON "org_risk_actions"("riskId");

-- CreateIndex
CREATE INDEX "org_risks_projectId_idx" ON "org_risks"("projectId");

-- CreateIndex
CREATE INDEX "org_scenario_analyses_orgProjectId_idx" ON "org_scenario_analyses"("orgProjectId");

-- CreateIndex
CREATE INDEX "org_scenario_analyses_createdBy_idx" ON "org_scenario_analyses"("createdBy");

-- CreateIndex
CREATE INDEX "org_strategic_goal_stages_goalId_idx" ON "org_strategic_goal_stages"("goalId");

-- CreateIndex
CREATE INDEX "org_strategic_goals_documentId_idx" ON "org_strategic_goals"("documentId");

-- CreateIndex
CREATE INDEX "org_strategic_goals_orgId_idx" ON "org_strategic_goals"("orgId");

-- CreateIndex
CREATE INDEX "org_strategy_documents_orgId_idx" ON "org_strategy_documents"("orgId");

-- CreateIndex
CREATE INDEX "org_strategy_documents_uploadedBy_idx" ON "org_strategy_documents"("uploadedBy");

-- CreateIndex
CREATE INDEX "org_users_orgId_idx" ON "org_users"("orgId");

-- CreateIndex
CREATE INDEX "password_reset_tokens_userId_idx" ON "password_reset_tokens"("userId");

-- CreateIndex
CREATE INDEX "revenue_forecasts_orgId_idx" ON "revenue_forecasts"("orgId");

-- CreateIndex
CREATE INDEX "revenue_forecasts_clientId_idx" ON "revenue_forecasts"("clientId");

-- AddForeignKey
ALTER TABLE "org_accounts" ADD CONSTRAINT "org_accounts_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "super_admins"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_accounts" ADD CONSTRAINT "client_accounts_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "super_admins"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
