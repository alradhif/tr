-- CreateEnum
CREATE TYPE "JodaynRole" AS ENUM ('JODAYN_UPPER_MGMT', 'JODAYN_DATA_ENTRY');

-- CreateEnum
CREATE TYPE "OrgRole" AS ENUM ('ORG_UPPER_MGMT', 'ORG_DATA_ENTRY');

-- CreateEnum
CREATE TYPE "ClientRole" AS ENUM ('CLIENT_UPPER_MGMT', 'CLIENT_DATA_ENTRY');

-- CreateEnum
CREATE TYPE "ContractStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'UPCOMING', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ProjectStatus" AS ENUM ('ACTIVE', 'ON_HOLD', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "RiskLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "RequestStatus" AS ENUM ('PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "RequestAction" AS ENUM ('APPROVED', 'REJECTED', 'SENT_FOR_REVIEW');

-- CreateEnum
CREATE TYPE "DeliverableStatus" AS ENUM ('ACTIVE', 'COMPLETED');

-- CreateEnum
CREATE TYPE "GoalStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'ACHIEVED', 'MISSED');

-- CreateEnum
CREATE TYPE "KpiStatus" AS ENUM ('ON_TRACK', 'AT_RISK', 'ACHIEVED', 'MISSED');

-- CreateEnum
CREATE TYPE "GoalStageStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED');

-- CreateEnum
CREATE TYPE "DocStatus" AS ENUM ('PROCESSING', 'EXTRACTED', 'CONFIRMED');

-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('PENDING', 'PAID', 'OVERDUE', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ReportType" AS ENUM ('EXECUTIVE', 'PROFIT_LOSS', 'RISK');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('APPROVAL', 'REJECTION', 'REVIEW', 'SYSTEM');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('CREATE', 'UPDATE', 'DELETE');

-- CreateEnum
CREATE TYPE "UserType" AS ENUM ('JODAYN', 'ORG', 'CLIENT');

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "userId" TEXT NOT NULL,
    "userType" "UserType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "password_reset_tokens" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "userType" "UserType" NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "isUsed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "password_reset_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "action" "AuditAction" NOT NULL,
    "tableName" TEXT NOT NULL,
    "recordId" TEXT NOT NULL,
    "oldData" TEXT,
    "newData" TEXT,
    "performedBy" TEXT NOT NULL,
    "userType" "UserType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "jodayn_users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "JodaynRole" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "jodayn_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sectors" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "managerName" TEXT NOT NULL,
    "budget" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "profit" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "employeeCount" INTEGER NOT NULL DEFAULT 0,
    "departmentCount" INTEGER NOT NULL DEFAULT 0,
    "annualRevenue" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sectors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "org_accounts" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "domain" TEXT,
    "branch" TEXT,
    "contractDuration" TEXT,
    "contractStatus" "ContractStatus" NOT NULL DEFAULT 'ACTIVE',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sectorId" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "org_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "client_accounts" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "managerName" TEXT,
    "sectorName" TEXT,
    "branch" TEXT,
    "contractDuration" TEXT,
    "contractStatus" "ContractStatus" NOT NULL DEFAULT 'ACTIVE',
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sectorId" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "client_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoices" (
    "id" TEXT NOT NULL,
    "invoiceNumber" TEXT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "remainingAmount" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "vatRate" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "vatAmount" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "totalWithVat" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "clientName" TEXT NOT NULL,
    "contractReference" TEXT,
    "projectName" TEXT,
    "issueDate" TIMESTAMP(3) NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "nextInvoiceDate" TIMESTAMP(3),
    "status" "InvoiceStatus" NOT NULL DEFAULT 'PENDING',
    "orgId" TEXT,
    "clientId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "revenue_forecasts" (
    "id" TEXT NOT NULL,
    "quarter" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "optimisticValue" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "optimisticProbability" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "pessimisticValue" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "pessimisticProbability" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "conservativeValue" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "conservativeProbability" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "branchFilter" TEXT,
    "dateRangeStart" TIMESTAMP(3),
    "dateRangeEnd" TIMESTAMP(3),
    "orgId" TEXT,
    "clientId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "revenue_forecasts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "financial_reports" (
    "id" TEXT NOT NULL,
    "type" "ReportType" NOT NULL,
    "totalContractsValue" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "netProfit" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "budgetVariance" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "cashFlowIn" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "cashFlowOut" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "netCashFlow" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "profitTrend" TEXT,
    "revenueTrend" TEXT,
    "sectorRevenueComparison" TEXT,
    "period" TEXT,
    "aiInsights" TEXT,
    "orgId" TEXT,
    "clientId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "financial_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "org_users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "OrgRole" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "orgId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "org_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "departments" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT,
    "managerName" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "employeeCount" INTEGER NOT NULL DEFAULT 0,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "orgId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "departments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "department_employees" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "role" TEXT,
    "departmentId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "department_employees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "executing_companies" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "registrationNo" TEXT,
    "managerName" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "teamCount" INTEGER NOT NULL DEFAULT 0,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "orgId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "executing_companies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "executing_company_team" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "role" TEXT,
    "companyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "executing_company_team_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "org_projects" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT,
    "classification" TEXT,
    "description" TEXT,
    "status" "ProjectStatus" NOT NULL DEFAULT 'ACTIVE',
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "budget" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "profit" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "profitMargin" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "progressPct" INTEGER NOT NULL DEFAULT 0,
    "criticalPath" TEXT,
    "orgProjectManagerName" TEXT,
    "clientProjectManagerName" TEXT,
    "orgEmail" TEXT,
    "clientEmail" TEXT,
    "orgPhone" TEXT,
    "clientPhone" TEXT,
    "departmentId" TEXT,
    "executingCompanyId" TEXT,
    "orgId" TEXT NOT NULL,
    "managerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "org_projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "org_project_phases" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "scope" TEXT,
    "mainDeliverables" TEXT,
    "notes" TEXT,
    "projectId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "org_project_phases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "org_project_team_members" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "role" TEXT,
    "source" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "org_project_team_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "org_contracts" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "projectId" TEXT NOT NULL,
    "uploadedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "org_contracts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "org_risks" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "probability" "RiskLevel" NOT NULL,
    "impact" "RiskLevel" NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "responsibleName" TEXT,
    "projectId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "org_risks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "org_risk_actions" (
    "id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "responsibleName" TEXT,
    "email" TEXT,
    "price" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "aiMitigationPlan" TEXT,
    "riskId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "org_risk_actions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "org_deliverables" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "email" TEXT,
    "price" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "status" "DeliverableStatus" NOT NULL DEFAULT 'ACTIVE',
    "progressPct" INTEGER NOT NULL DEFAULT 0,
    "projectId" TEXT NOT NULL,
    "responsibleId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "org_deliverables_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "org_deliverable_attachments" (
    "id" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileType" TEXT,
    "fileSize" INTEGER,
    "deliverableId" TEXT NOT NULL,
    "uploadedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "org_deliverable_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "org_deliverable_comments" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "deliverableId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "org_deliverable_comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "org_change_requests" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "priority" "RiskLevel" NOT NULL DEFAULT 'MEDIUM',
    "status" "RequestStatus" NOT NULL DEFAULT 'PENDING',
    "impactOnCost" TEXT,
    "impactOnSchedule" TEXT,
    "submittedBy" TEXT,
    "submittedDate" TIMESTAMP(3),
    "projectId" TEXT NOT NULL,
    "requestedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "org_change_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "org_change_request_attachments" (
    "id" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileType" TEXT,
    "fileSize" INTEGER,
    "requestId" TEXT NOT NULL,
    "uploadedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "org_change_request_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "org_request_logs" (
    "id" TEXT NOT NULL,
    "action" "RequestAction" NOT NULL,
    "comment" TEXT,
    "requestId" TEXT NOT NULL,
    "performedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "org_request_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "org_scenario_analyses" (
    "id" TEXT NOT NULL,
    "orgProjectId" TEXT NOT NULL,
    "originalDate" TIMESTAMP(3),
    "originalCost" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "originalRiskLevel" "RiskLevel",
    "newDate" TIMESTAMP(3),
    "newCost" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "newRiskLevel" "RiskLevel",
    "impactOnSchedule" TEXT,
    "impactOnCost" TEXT,
    "impactOnCriticalPath" TEXT,
    "impactOnRiskLevel" TEXT,
    "recommendations" TEXT,
    "budgetIncrease" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "humanResourcesReduction" INTEGER NOT NULL DEFAULT 0,
    "aiRecommendations" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "org_scenario_analyses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "org_strategy_documents" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileType" TEXT,
    "status" "DocStatus" NOT NULL DEFAULT 'PROCESSING',
    "orgId" TEXT NOT NULL,
    "uploadedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "org_strategy_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "org_strategic_goals" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "requiredOutputsCount" INTEGER NOT NULL DEFAULT 0,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "status" "GoalStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "progressPct" INTEGER NOT NULL DEFAULT 0,
    "achievementPct" INTEGER NOT NULL DEFAULT 0,
    "isAiExtracted" BOOLEAN NOT NULL DEFAULT true,
    "aiSummary" TEXT,
    "documentId" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "org_strategic_goals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "org_strategic_goal_stages" (
    "id" TEXT NOT NULL,
    "stageName" TEXT NOT NULL,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "status" "GoalStageStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "progressPct" INTEGER NOT NULL DEFAULT 0,
    "goalId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "org_strategic_goal_stages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "org_goal_project_links" (
    "id" TEXT NOT NULL,
    "goalId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "relevanceScore" INTEGER NOT NULL DEFAULT 0,
    "aiNotes" TEXT,
    "isAiLinked" BOOLEAN NOT NULL DEFAULT true,
    "actionTaken" TEXT,
    "projectStatus" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "org_goal_project_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "org_kpi_snapshots" (
    "id" TEXT NOT NULL,
    "quarter" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "progressPct" INTEGER NOT NULL DEFAULT 0,
    "achievementPct" INTEGER NOT NULL DEFAULT 0,
    "linkedProjectsCount" INTEGER NOT NULL DEFAULT 0,
    "completedProjectsCount" INTEGER NOT NULL DEFAULT 0,
    "status" "KpiStatus" NOT NULL DEFAULT 'ON_TRACK',
    "notes" TEXT,
    "aiAnalysis" TEXT,
    "goalId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "org_kpi_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "client_users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "ClientRole" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "clientId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "client_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "client_projects" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT,
    "classification" TEXT,
    "description" TEXT,
    "status" "ProjectStatus" NOT NULL DEFAULT 'ACTIVE',
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "budget" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "profit" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "profitMargin" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "progressPct" INTEGER NOT NULL DEFAULT 0,
    "criticalPath" TEXT,
    "orgProjectManagerName" TEXT,
    "clientProjectManagerName" TEXT,
    "orgEmail" TEXT,
    "clientEmail" TEXT,
    "orgPhone" TEXT,
    "clientPhone" TEXT,
    "clientId" TEXT NOT NULL,
    "managerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "client_projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "client_project_phases" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "scope" TEXT,
    "mainDeliverables" TEXT,
    "notes" TEXT,
    "projectId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "client_project_phases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "client_project_team_members" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "role" TEXT,
    "source" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "client_project_team_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "client_contracts" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "projectId" TEXT NOT NULL,
    "uploadedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "client_contracts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "client_risks" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "probability" "RiskLevel" NOT NULL,
    "impact" "RiskLevel" NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "responsibleName" TEXT,
    "projectId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "client_risks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "client_risk_actions" (
    "id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "responsibleName" TEXT,
    "email" TEXT,
    "price" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "aiMitigationPlan" TEXT,
    "riskId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "client_risk_actions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "client_deliverables" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "email" TEXT,
    "price" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "status" "DeliverableStatus" NOT NULL DEFAULT 'ACTIVE',
    "progressPct" INTEGER NOT NULL DEFAULT 0,
    "projectId" TEXT NOT NULL,
    "responsibleId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "client_deliverables_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "client_deliverable_attachments" (
    "id" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileType" TEXT,
    "fileSize" INTEGER,
    "deliverableId" TEXT NOT NULL,
    "uploadedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "client_deliverable_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "client_deliverable_comments" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "deliverableId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "client_deliverable_comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "client_change_requests" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "priority" "RiskLevel" NOT NULL DEFAULT 'MEDIUM',
    "status" "RequestStatus" NOT NULL DEFAULT 'PENDING',
    "impactOnCost" TEXT,
    "impactOnSchedule" TEXT,
    "submittedBy" TEXT,
    "submittedDate" TIMESTAMP(3),
    "projectId" TEXT NOT NULL,
    "requestedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "client_change_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "client_change_request_attachments" (
    "id" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileType" TEXT,
    "fileSize" INTEGER,
    "requestId" TEXT NOT NULL,
    "uploadedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "client_change_request_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "client_request_logs" (
    "id" TEXT NOT NULL,
    "action" "RequestAction" NOT NULL,
    "comment" TEXT,
    "requestId" TEXT NOT NULL,
    "performedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "client_request_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "client_scenario_analyses" (
    "id" TEXT NOT NULL,
    "clientProjectId" TEXT NOT NULL,
    "originalDate" TIMESTAMP(3),
    "originalCost" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "originalRiskLevel" "RiskLevel",
    "newDate" TIMESTAMP(3),
    "newCost" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "newRiskLevel" "RiskLevel",
    "impactOnSchedule" TEXT,
    "impactOnCost" TEXT,
    "impactOnCriticalPath" TEXT,
    "impactOnRiskLevel" TEXT,
    "recommendations" TEXT,
    "budgetIncrease" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "humanResourcesReduction" INTEGER NOT NULL DEFAULT 0,
    "aiRecommendations" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "client_scenario_analyses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "client_strategy_documents" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileType" TEXT,
    "status" "DocStatus" NOT NULL DEFAULT 'PROCESSING',
    "clientId" TEXT NOT NULL,
    "uploadedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "client_strategy_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "client_strategic_goals" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "requiredOutputsCount" INTEGER NOT NULL DEFAULT 0,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "status" "GoalStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "progressPct" INTEGER NOT NULL DEFAULT 0,
    "achievementPct" INTEGER NOT NULL DEFAULT 0,
    "isAiExtracted" BOOLEAN NOT NULL DEFAULT true,
    "aiSummary" TEXT,
    "documentId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "client_strategic_goals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "client_strategic_goal_stages" (
    "id" TEXT NOT NULL,
    "stageName" TEXT NOT NULL,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "status" "GoalStageStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "progressPct" INTEGER NOT NULL DEFAULT 0,
    "goalId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "client_strategic_goal_stages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "client_goal_project_links" (
    "id" TEXT NOT NULL,
    "goalId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "relevanceScore" INTEGER NOT NULL DEFAULT 0,
    "aiNotes" TEXT,
    "isAiLinked" BOOLEAN NOT NULL DEFAULT true,
    "actionTaken" TEXT,
    "projectStatus" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "client_goal_project_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "client_kpi_snapshots" (
    "id" TEXT NOT NULL,
    "quarter" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "progressPct" INTEGER NOT NULL DEFAULT 0,
    "achievementPct" INTEGER NOT NULL DEFAULT 0,
    "linkedProjectsCount" INTEGER NOT NULL DEFAULT 0,
    "completedProjectsCount" INTEGER NOT NULL DEFAULT 0,
    "status" "KpiStatus" NOT NULL DEFAULT 'ON_TRACK',
    "notes" TEXT,
    "aiAnalysis" TEXT,
    "goalId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "client_kpi_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "password_reset_tokens_token_key" ON "password_reset_tokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "jodayn_users_email_key" ON "jodayn_users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "org_users_email_key" ON "org_users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "client_users_email_key" ON "client_users"("email");

-- AddForeignKey
ALTER TABLE "org_accounts" ADD CONSTRAINT "org_accounts_sectorId_fkey" FOREIGN KEY ("sectorId") REFERENCES "sectors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "org_accounts" ADD CONSTRAINT "org_accounts_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "jodayn_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_accounts" ADD CONSTRAINT "client_accounts_sectorId_fkey" FOREIGN KEY ("sectorId") REFERENCES "sectors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_accounts" ADD CONSTRAINT "client_accounts_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "jodayn_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "org_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "client_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "revenue_forecasts" ADD CONSTRAINT "revenue_forecasts_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "org_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "revenue_forecasts" ADD CONSTRAINT "revenue_forecasts_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "client_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financial_reports" ADD CONSTRAINT "financial_reports_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "org_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financial_reports" ADD CONSTRAINT "financial_reports_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "client_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "org_users" ADD CONSTRAINT "org_users_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "org_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "departments" ADD CONSTRAINT "departments_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "org_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "department_employees" ADD CONSTRAINT "department_employees_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "executing_companies" ADD CONSTRAINT "executing_companies_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "org_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "executing_company_team" ADD CONSTRAINT "executing_company_team_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "executing_companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "org_projects" ADD CONSTRAINT "org_projects_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "org_projects" ADD CONSTRAINT "org_projects_executingCompanyId_fkey" FOREIGN KEY ("executingCompanyId") REFERENCES "executing_companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "org_projects" ADD CONSTRAINT "org_projects_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "org_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "org_projects" ADD CONSTRAINT "org_projects_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "org_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "org_project_phases" ADD CONSTRAINT "org_project_phases_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "org_projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "org_project_team_members" ADD CONSTRAINT "org_project_team_members_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "org_projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "org_contracts" ADD CONSTRAINT "org_contracts_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "org_projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "org_contracts" ADD CONSTRAINT "org_contracts_uploadedBy_fkey" FOREIGN KEY ("uploadedBy") REFERENCES "org_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "org_risks" ADD CONSTRAINT "org_risks_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "org_projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "org_risk_actions" ADD CONSTRAINT "org_risk_actions_riskId_fkey" FOREIGN KEY ("riskId") REFERENCES "org_risks"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "org_deliverables" ADD CONSTRAINT "org_deliverables_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "org_projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "org_deliverables" ADD CONSTRAINT "org_deliverables_responsibleId_fkey" FOREIGN KEY ("responsibleId") REFERENCES "org_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "org_deliverable_attachments" ADD CONSTRAINT "org_deliverable_attachments_deliverableId_fkey" FOREIGN KEY ("deliverableId") REFERENCES "org_deliverables"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "org_deliverable_attachments" ADD CONSTRAINT "org_deliverable_attachments_uploadedBy_fkey" FOREIGN KEY ("uploadedBy") REFERENCES "org_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "org_deliverable_comments" ADD CONSTRAINT "org_deliverable_comments_deliverableId_fkey" FOREIGN KEY ("deliverableId") REFERENCES "org_deliverables"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "org_deliverable_comments" ADD CONSTRAINT "org_deliverable_comments_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "org_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "org_change_requests" ADD CONSTRAINT "org_change_requests_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "org_projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "org_change_requests" ADD CONSTRAINT "org_change_requests_requestedBy_fkey" FOREIGN KEY ("requestedBy") REFERENCES "org_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "org_change_request_attachments" ADD CONSTRAINT "org_change_request_attachments_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "org_change_requests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "org_change_request_attachments" ADD CONSTRAINT "org_change_request_attachments_uploadedBy_fkey" FOREIGN KEY ("uploadedBy") REFERENCES "org_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "org_request_logs" ADD CONSTRAINT "org_request_logs_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "org_change_requests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "org_request_logs" ADD CONSTRAINT "org_request_logs_performedBy_fkey" FOREIGN KEY ("performedBy") REFERENCES "org_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "org_scenario_analyses" ADD CONSTRAINT "org_scenario_analyses_orgProjectId_fkey" FOREIGN KEY ("orgProjectId") REFERENCES "org_projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "org_scenario_analyses" ADD CONSTRAINT "org_scenario_analyses_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "org_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "org_strategy_documents" ADD CONSTRAINT "org_strategy_documents_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "org_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "org_strategy_documents" ADD CONSTRAINT "org_strategy_documents_uploadedBy_fkey" FOREIGN KEY ("uploadedBy") REFERENCES "org_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "org_strategic_goals" ADD CONSTRAINT "org_strategic_goals_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "org_strategy_documents"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "org_strategic_goals" ADD CONSTRAINT "org_strategic_goals_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "org_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "org_strategic_goal_stages" ADD CONSTRAINT "org_strategic_goal_stages_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "org_strategic_goals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "org_goal_project_links" ADD CONSTRAINT "org_goal_project_links_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "org_strategic_goals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "org_goal_project_links" ADD CONSTRAINT "org_goal_project_links_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "org_projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "org_kpi_snapshots" ADD CONSTRAINT "org_kpi_snapshots_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "org_strategic_goals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_users" ADD CONSTRAINT "client_users_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "client_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_projects" ADD CONSTRAINT "client_projects_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "client_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_projects" ADD CONSTRAINT "client_projects_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "client_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_project_phases" ADD CONSTRAINT "client_project_phases_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "client_projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_project_team_members" ADD CONSTRAINT "client_project_team_members_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "client_projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_contracts" ADD CONSTRAINT "client_contracts_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "client_projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_contracts" ADD CONSTRAINT "client_contracts_uploadedBy_fkey" FOREIGN KEY ("uploadedBy") REFERENCES "client_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_risks" ADD CONSTRAINT "client_risks_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "client_projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_risk_actions" ADD CONSTRAINT "client_risk_actions_riskId_fkey" FOREIGN KEY ("riskId") REFERENCES "client_risks"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_deliverables" ADD CONSTRAINT "client_deliverables_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "client_projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_deliverables" ADD CONSTRAINT "client_deliverables_responsibleId_fkey" FOREIGN KEY ("responsibleId") REFERENCES "client_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_deliverable_attachments" ADD CONSTRAINT "client_deliverable_attachments_deliverableId_fkey" FOREIGN KEY ("deliverableId") REFERENCES "client_deliverables"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_deliverable_attachments" ADD CONSTRAINT "client_deliverable_attachments_uploadedBy_fkey" FOREIGN KEY ("uploadedBy") REFERENCES "client_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_deliverable_comments" ADD CONSTRAINT "client_deliverable_comments_deliverableId_fkey" FOREIGN KEY ("deliverableId") REFERENCES "client_deliverables"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_deliverable_comments" ADD CONSTRAINT "client_deliverable_comments_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "client_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_change_requests" ADD CONSTRAINT "client_change_requests_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "client_projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_change_requests" ADD CONSTRAINT "client_change_requests_requestedBy_fkey" FOREIGN KEY ("requestedBy") REFERENCES "client_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_change_request_attachments" ADD CONSTRAINT "client_change_request_attachments_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "client_change_requests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_change_request_attachments" ADD CONSTRAINT "client_change_request_attachments_uploadedBy_fkey" FOREIGN KEY ("uploadedBy") REFERENCES "client_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_request_logs" ADD CONSTRAINT "client_request_logs_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "client_change_requests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_request_logs" ADD CONSTRAINT "client_request_logs_performedBy_fkey" FOREIGN KEY ("performedBy") REFERENCES "client_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_scenario_analyses" ADD CONSTRAINT "client_scenario_analyses_clientProjectId_fkey" FOREIGN KEY ("clientProjectId") REFERENCES "client_projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_scenario_analyses" ADD CONSTRAINT "client_scenario_analyses_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "client_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_strategy_documents" ADD CONSTRAINT "client_strategy_documents_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "client_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_strategy_documents" ADD CONSTRAINT "client_strategy_documents_uploadedBy_fkey" FOREIGN KEY ("uploadedBy") REFERENCES "client_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_strategic_goals" ADD CONSTRAINT "client_strategic_goals_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "client_strategy_documents"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_strategic_goals" ADD CONSTRAINT "client_strategic_goals_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "client_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_strategic_goal_stages" ADD CONSTRAINT "client_strategic_goal_stages_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "client_strategic_goals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_goal_project_links" ADD CONSTRAINT "client_goal_project_links_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "client_strategic_goals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_goal_project_links" ADD CONSTRAINT "client_goal_project_links_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "client_projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_kpi_snapshots" ADD CONSTRAINT "client_kpi_snapshots_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "client_strategic_goals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
