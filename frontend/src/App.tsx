import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { OrgLayout } from './layouts/OrgLayout'
import { ClientLayout } from './layouts/ClientLayout'
import { JodaynLayout } from './layouts/JodaynLayout'
import { SuperAdminApp } from './super-admin-ui/SuperAdminApp'
import { OrgDashboardPage } from './pages/org/DashboardPage'
import { OrgGoalsPage } from './pages/org/GoalsPage'
import { OrgAddGoalPage, OrgEditGoalPage } from './pages/org/AddGoalPage'
import { OrgGoalDetailPage } from './pages/org/GoalDetailPage'
import { OrgProjectsPage } from './pages/org/ProjectsPage'
import { OrgAddProjectPage, OrgEditProjectPage } from './pages/org/AddProjectPage'
import { OrgProjectDetailPage } from './pages/org/ProjectDetailPage'
import { OrgCompaniesPage } from './pages/org/CompaniesPage'
import { OrgAddCompanyPage } from './pages/org/AddCompanyPage'
import { OrgCompanyDetailPage } from './pages/org/CompanyDetailPage'
import { OrgDepartmentsPage } from './pages/org/DepartmentsPage'
import { OrgAddDepartmentPage } from './pages/org/AddDepartmentPage'
import { OrgDepartmentDetailPage } from './pages/org/DepartmentDetailPage'
import { ClientDashboardPage } from './pages/client/DashboardPage'
import { ClientProjectsPage } from './pages/client/ProjectsPage'
import { ClientAddProjectPage } from './pages/client/AddProjectPage'
import { ClientEditProjectPage } from './pages/client/EditProjectPage'
import { ClientProjectDetailPage } from './pages/client/ProjectDetailPage'
import { ClientGoalsPage } from './pages/client/GoalsPage'
import { ClientAddGoalPage } from './pages/client/AddGoalPage'
import { ClientGoalDetailPage } from './pages/client/GoalDetailPage'
import { JodaynDashboardPage } from './pages/jodayn/DashboardPage'
import { JodaynSectorsPage } from './pages/jodayn/SectorsPage'
import { JodaynAddSectorPage } from './pages/jodayn/AddSectorPage'
import { JodaynOrgAccountsPage } from './pages/jodayn/OrgAccountsPage'
import { JodaynClientAccountsPage } from './pages/jodayn/ClientAccountsPage'
import { JodaynInvoicesPage } from './pages/jodayn/InvoicesPage'
import { JodaynAddInvoicePage } from './pages/jodayn/AddInvoicePage'
import { JodaynForecastsPage } from './pages/jodayn/ForecastsPage'
import { JodaynAddForecastPage } from './pages/jodayn/AddForecastPage'
import { JodaynReportsPage } from './pages/jodayn/ReportsPage'
import { JodaynAddReportPage } from './pages/jodayn/AddReportPage'
import { AddPhasePage } from './pages/shared/project/AddPhasePage'
import { AddDeliverablePage } from './pages/shared/project/AddDeliverablePage'
import { AddRiskPage } from './pages/shared/project/AddRiskPage'
import { AddChangeRequestPage } from './pages/shared/project/AddChangeRequestPage'
import { AddScenarioPage } from './pages/shared/project/AddScenarioPage'
import { AddTeamMemberPage } from './pages/shared/project/AddTeamMemberPage'
import { AddContractPage } from './pages/shared/project/AddContractPage'
import { SettingsPage } from './pages/shared/SettingsPage'
import { LandingPage } from './components/landing/LandingPage'
import { UnifiedLoginPage } from './pages/shared/UnifiedLoginPage'
import { ResetPasswordPage } from './pages/shared/ResetPasswordPage'
import { PostAuthLoadingPage } from './pages/shared/PostAuthLoadingPage'
import { OtpPage } from './pages/shared/OtpPage'
import { RtlProvider } from './rtl/RtlProvider'

const projectNestedForms = [
  <Route key="ph" path="projects/:projectId/phases/new" element={<AddPhasePage />} />,
  <Route key="dl" path="projects/:projectId/deliverables/new" element={<AddDeliverablePage />} />,
  <Route key="rk" path="projects/:projectId/risks/new" element={<AddRiskPage />} />,
  <Route
    key="cr"
    path="projects/:projectId/change-requests/new"
    element={<AddChangeRequestPage />}
  />,
  <Route key="sc" path="projects/:projectId/scenarios/new" element={<AddScenarioPage />} />,
  <Route key="tm" path="projects/:projectId/team/new" element={<AddTeamMemberPage />} />,
  <Route key="ct" path="projects/:projectId/contracts/new" element={<AddContractPage />} />,
]

export default function App() {
  return (
    <RtlProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/request-demo" element={<LandingPage />} />
          <Route path="/login" element={<UnifiedLoginPage />} />
          <Route path="/otp" element={<OtpPage />} />
          <Route path="/loading" element={<PostAuthLoadingPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />

          {/* Common typo / shortcut */}
          <Route path="/superadmin" element={<Navigate to="/login" replace />} />
          <Route path="/superadmin/*" element={<Navigate to="/login" replace />} />

          {/* Super Admin — new UI (in-app login / OTP / shell) */}
          <Route path="/super-admin/*" element={<SuperAdminApp />} />
          <Route path="/super-admin" element={<SuperAdminApp />} />

          {/* Jodayn */}
          <Route path="/jodayn/login" element={<Navigate to="/login" replace />} />
          <Route path="/jodayn" element={<JodaynLayout />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<JodaynDashboardPage />} />
            <Route path="sectors" element={<JodaynSectorsPage />} />
            <Route path="sectors/new" element={<JodaynAddSectorPage />} />
            <Route path="org-accounts" element={<JodaynOrgAccountsPage />} />
            <Route path="client-accounts" element={<JodaynClientAccountsPage />} />
            <Route path="invoices" element={<JodaynInvoicesPage />} />
            <Route path="invoices/new" element={<JodaynAddInvoicePage />} />
            <Route path="forecasts" element={<JodaynForecastsPage />} />
            <Route path="forecasts/new" element={<JodaynAddForecastPage />} />
            <Route path="reports" element={<JodaynReportsPage />} />
            <Route path="reports/new" element={<JodaynAddReportPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>

          {/* Org / الجهة */}
          <Route path="/org/login" element={<Navigate to="/login" replace />} />
          <Route path="/org" element={<OrgLayout />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<OrgDashboardPage />} />
            <Route path="goals" element={<OrgGoalsPage />} />
            <Route path="goals/new" element={<OrgAddGoalPage />} />
            <Route path="goals/:goalId/edit" element={<OrgEditGoalPage />} />
            <Route path="goals/:goalId" element={<OrgGoalDetailPage />} />
            <Route path="projects" element={<OrgProjectsPage />} />
            <Route path="projects/new" element={<OrgAddProjectPage />} />
            {projectNestedForms}
            <Route path="projects/:projectId/edit" element={<OrgEditProjectPage />} />
            <Route path="projects/:projectId" element={<OrgProjectDetailPage />} />
            <Route path="companies" element={<OrgCompaniesPage />} />
            <Route path="companies/new" element={<OrgAddCompanyPage />} />
            <Route path="companies/:companyId/edit" element={<OrgCompanyDetailPage initialEdit />} />
            <Route path="companies/:companyId" element={<OrgCompanyDetailPage />} />
            <Route path="departments" element={<OrgDepartmentsPage />} />
            <Route path="departments/new" element={<OrgAddDepartmentPage />} />
            <Route path="departments/:departmentId/edit" element={<OrgDepartmentDetailPage initialEdit />} />
            <Route path="departments/:departmentId" element={<OrgDepartmentDetailPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>

          {/* Client / العميل */}
          <Route path="/client/login" element={<Navigate to="/login" replace />} />
          <Route path="/client" element={<ClientLayout />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<ClientDashboardPage />} />
            <Route path="goals" element={<ClientGoalsPage />} />
            <Route path="goals/new" element={<ClientAddGoalPage />} />
            <Route path="goals/:goalId" element={<ClientGoalDetailPage />} />
            <Route path="projects" element={<ClientProjectsPage />} />
            <Route path="projects/new" element={<ClientAddProjectPage />} />
            <Route path="projects/:projectId/edit" element={<ClientEditProjectPage />} />
            {projectNestedForms}
            <Route path="projects/:projectId" element={<ClientProjectDetailPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </RtlProvider>
  )
}
