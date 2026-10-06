-- DropForeignKey
ALTER TABLE "department_employees" DROP CONSTRAINT "department_employees_departmentId_fkey";

-- DropForeignKey
ALTER TABLE "executing_company_team" DROP CONSTRAINT "executing_company_team_companyId_fkey";

-- DropForeignKey
ALTER TABLE "org_project_phases" DROP CONSTRAINT "org_project_phases_projectId_fkey";

-- DropForeignKey
ALTER TABLE "org_project_team_members" DROP CONSTRAINT "org_project_team_members_projectId_fkey";

-- DropForeignKey
ALTER TABLE "org_contracts" DROP CONSTRAINT "org_contracts_projectId_fkey";

-- DropForeignKey
ALTER TABLE "org_risks" DROP CONSTRAINT "org_risks_projectId_fkey";

-- DropForeignKey
ALTER TABLE "org_risk_actions" DROP CONSTRAINT "org_risk_actions_riskId_fkey";

-- DropForeignKey
ALTER TABLE "org_deliverables" DROP CONSTRAINT "org_deliverables_projectId_fkey";

-- DropForeignKey
ALTER TABLE "org_deliverable_attachments" DROP CONSTRAINT "org_deliverable_attachments_deliverableId_fkey";

-- DropForeignKey
ALTER TABLE "org_deliverable_comments" DROP CONSTRAINT "org_deliverable_comments_deliverableId_fkey";

-- DropForeignKey
ALTER TABLE "org_change_requests" DROP CONSTRAINT "org_change_requests_projectId_fkey";

-- DropForeignKey
ALTER TABLE "org_change_request_attachments" DROP CONSTRAINT "org_change_request_attachments_requestId_fkey";

-- DropForeignKey
ALTER TABLE "org_request_logs" DROP CONSTRAINT "org_request_logs_requestId_fkey";

-- DropForeignKey
ALTER TABLE "org_scenario_analyses" DROP CONSTRAINT "org_scenario_analyses_orgProjectId_fkey";

-- DropForeignKey
ALTER TABLE "org_strategic_goals" DROP CONSTRAINT "org_strategic_goals_documentId_fkey";

-- DropForeignKey
ALTER TABLE "org_strategic_goal_stages" DROP CONSTRAINT "org_strategic_goal_stages_goalId_fkey";

-- DropForeignKey
ALTER TABLE "org_goal_project_links" DROP CONSTRAINT "org_goal_project_links_goalId_fkey";

-- DropForeignKey
ALTER TABLE "org_goal_project_links" DROP CONSTRAINT "org_goal_project_links_projectId_fkey";

-- DropForeignKey
ALTER TABLE "org_kpi_snapshots" DROP CONSTRAINT "org_kpi_snapshots_goalId_fkey";

-- DropForeignKey
ALTER TABLE "client_project_phases" DROP CONSTRAINT "client_project_phases_projectId_fkey";

-- DropForeignKey
ALTER TABLE "client_project_team_members" DROP CONSTRAINT "client_project_team_members_projectId_fkey";

-- DropForeignKey
ALTER TABLE "client_contracts" DROP CONSTRAINT "client_contracts_projectId_fkey";

-- DropForeignKey
ALTER TABLE "client_risks" DROP CONSTRAINT "client_risks_projectId_fkey";

-- DropForeignKey
ALTER TABLE "client_risk_actions" DROP CONSTRAINT "client_risk_actions_riskId_fkey";

-- DropForeignKey
ALTER TABLE "client_deliverables" DROP CONSTRAINT "client_deliverables_projectId_fkey";

-- DropForeignKey
ALTER TABLE "client_deliverable_attachments" DROP CONSTRAINT "client_deliverable_attachments_deliverableId_fkey";

-- DropForeignKey
ALTER TABLE "client_deliverable_comments" DROP CONSTRAINT "client_deliverable_comments_deliverableId_fkey";

-- DropForeignKey
ALTER TABLE "client_change_requests" DROP CONSTRAINT "client_change_requests_projectId_fkey";

-- DropForeignKey
ALTER TABLE "client_change_request_attachments" DROP CONSTRAINT "client_change_request_attachments_requestId_fkey";

-- DropForeignKey
ALTER TABLE "client_request_logs" DROP CONSTRAINT "client_request_logs_requestId_fkey";

-- DropForeignKey
ALTER TABLE "client_scenario_analyses" DROP CONSTRAINT "client_scenario_analyses_clientProjectId_fkey";

-- DropForeignKey
ALTER TABLE "client_strategic_goals" DROP CONSTRAINT "client_strategic_goals_documentId_fkey";

-- DropForeignKey
ALTER TABLE "client_strategic_goal_stages" DROP CONSTRAINT "client_strategic_goal_stages_goalId_fkey";

-- DropForeignKey
ALTER TABLE "client_goal_project_links" DROP CONSTRAINT "client_goal_project_links_goalId_fkey";

-- DropForeignKey
ALTER TABLE "client_goal_project_links" DROP CONSTRAINT "client_goal_project_links_projectId_fkey";

-- DropForeignKey
ALTER TABLE "client_kpi_snapshots" DROP CONSTRAINT "client_kpi_snapshots_goalId_fkey";

-- AlterTable
ALTER TABLE "notifications" ADD COLUMN     "link" TEXT;

-- AlterTable
ALTER TABLE "jodayn_users" ADD COLUMN     "activatedAt" TIMESTAMP(3),
ADD COLUMN     "lastLoginAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "org_users" ADD COLUMN     "activatedAt" TIMESTAMP(3),
ADD COLUMN     "lastLoginAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "org_projects" ADD COLUMN     "submittedAt" TIMESTAMP(3),
ADD COLUMN     "submittedById" TEXT;

-- AlterTable
ALTER TABLE "client_users" ADD COLUMN     "activatedAt" TIMESTAMP(3),
ADD COLUMN     "lastLoginAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "client_projects" ADD COLUMN     "submittedAt" TIMESTAMP(3),
ADD COLUMN     "submittedById" TEXT;

-- AlterTable
ALTER TABLE "packages" ADD COLUMN     "billingCycle" TEXT NOT NULL DEFAULT 'YEARLY',
ADD COLUMN     "features" JSONB,
ADD COLUMN     "label" TEXT,
ADD COLUMN     "packageType" TEXT,
ADD COLUMN     "storageGb" INTEGER NOT NULL DEFAULT 10,
ALTER COLUMN   "name" TYPE TEXT USING "name"::text;

-- AlterTable
ALTER TABLE "account_subscriptions" ADD COLUMN     "storageLimitGb" INTEGER,
ADD COLUMN     "userLimit" INTEGER;

-- DropEnum
DROP TYPE "PackageName";

-- CreateTable
CREATE TABLE "dashboard_layouts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "actorType" "ActorType" NOT NULL,
    "portal" TEXT NOT NULL,
    "widgetIds" JSONB NOT NULL,
    "layout" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dashboard_layouts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "dashboard_layouts_userId_actorType_portal_key" ON "dashboard_layouts"("userId", "actorType", "portal");


-- AddForeignKey
ALTER TABLE "department_employees" ADD CONSTRAINT "department_employees_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "executing_company_team" ADD CONSTRAINT "executing_company_team_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "executing_companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "org_project_phases" ADD CONSTRAINT "org_project_phases_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "org_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "org_project_team_members" ADD CONSTRAINT "org_project_team_members_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "org_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "org_contracts" ADD CONSTRAINT "org_contracts_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "org_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "org_risks" ADD CONSTRAINT "org_risks_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "org_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "org_risk_actions" ADD CONSTRAINT "org_risk_actions_riskId_fkey" FOREIGN KEY ("riskId") REFERENCES "org_risks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "org_deliverables" ADD CONSTRAINT "org_deliverables_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "org_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "org_deliverable_attachments" ADD CONSTRAINT "org_deliverable_attachments_deliverableId_fkey" FOREIGN KEY ("deliverableId") REFERENCES "org_deliverables"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "org_deliverable_comments" ADD CONSTRAINT "org_deliverable_comments_deliverableId_fkey" FOREIGN KEY ("deliverableId") REFERENCES "org_deliverables"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "org_change_requests" ADD CONSTRAINT "org_change_requests_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "org_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "org_change_request_attachments" ADD CONSTRAINT "org_change_request_attachments_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "org_change_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "org_request_logs" ADD CONSTRAINT "org_request_logs_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "org_change_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "org_scenario_analyses" ADD CONSTRAINT "org_scenario_analyses_orgProjectId_fkey" FOREIGN KEY ("orgProjectId") REFERENCES "org_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "org_strategic_goals" ADD CONSTRAINT "org_strategic_goals_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "org_strategy_documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "org_strategic_goal_stages" ADD CONSTRAINT "org_strategic_goal_stages_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "org_strategic_goals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "org_goal_project_links" ADD CONSTRAINT "org_goal_project_links_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "org_strategic_goals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "org_goal_project_links" ADD CONSTRAINT "org_goal_project_links_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "org_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "org_kpi_snapshots" ADD CONSTRAINT "org_kpi_snapshots_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "org_strategic_goals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_project_phases" ADD CONSTRAINT "client_project_phases_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "client_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_project_team_members" ADD CONSTRAINT "client_project_team_members_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "client_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_contracts" ADD CONSTRAINT "client_contracts_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "client_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_risks" ADD CONSTRAINT "client_risks_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "client_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_risk_actions" ADD CONSTRAINT "client_risk_actions_riskId_fkey" FOREIGN KEY ("riskId") REFERENCES "client_risks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_deliverables" ADD CONSTRAINT "client_deliverables_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "client_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_deliverable_attachments" ADD CONSTRAINT "client_deliverable_attachments_deliverableId_fkey" FOREIGN KEY ("deliverableId") REFERENCES "client_deliverables"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_deliverable_comments" ADD CONSTRAINT "client_deliverable_comments_deliverableId_fkey" FOREIGN KEY ("deliverableId") REFERENCES "client_deliverables"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_change_requests" ADD CONSTRAINT "client_change_requests_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "client_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_change_request_attachments" ADD CONSTRAINT "client_change_request_attachments_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "client_change_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_request_logs" ADD CONSTRAINT "client_request_logs_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "client_change_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_scenario_analyses" ADD CONSTRAINT "client_scenario_analyses_clientProjectId_fkey" FOREIGN KEY ("clientProjectId") REFERENCES "client_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_strategic_goals" ADD CONSTRAINT "client_strategic_goals_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "client_strategy_documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_strategic_goal_stages" ADD CONSTRAINT "client_strategic_goal_stages_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "client_strategic_goals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_goal_project_links" ADD CONSTRAINT "client_goal_project_links_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "client_strategic_goals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_goal_project_links" ADD CONSTRAINT "client_goal_project_links_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "client_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_kpi_snapshots" ADD CONSTRAINT "client_kpi_snapshots_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "client_strategic_goals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

