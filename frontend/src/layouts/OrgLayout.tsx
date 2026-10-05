import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { AppSidebar } from '../components/ui'
import { getOrgRole, getOrgUser, isOrgAuthenticated, orgRoleLabel, clearOrgSession } from '../auth/orgAuth'
import { AIAssistantPanel } from '../features/portal'
import {
  CompaniesIcon,
  DashboardIcon,
  DepartmentsIcon,
  GoalsIcon,
  ProjectsIcon,
  SidebarSettingsIcon,
} from '../super-admin-ui/components/layout/SidebarIcons'
import { brandAssets } from '@/assets'
import '../design/portal-layout.css'
import '../org-catalog'

export function OrgLayout() {
  const { t } = useTranslation()
  const location = useLocation()
  const role = getOrgRole()
  const user = getOrgUser()
  const catalog = location.pathname.startsWith('/org')

  if (!isOrgAuthenticated() || !role) {
    return <Navigate to="/login" replace />
  }

  return (
    <div className="app-shell" dir="rtl">
      <AppSidebar
        variant="catalog"
        settingsPath="/org/settings"
        userName={user?.name}
        userRole={orgRoleLabel(role)}
        showMore
        brand={<img src={brandAssets.logoFull} alt="TrackPlus" className="sidebar__logo-full" />}
        settingsIcon={<SidebarSettingsIcon />}
        onSignOut={() => {
          clearOrgSession()
          window.location.assign('/login')
        }}
        navItems={[
          { key: '/org/dashboard', label: t('dashboard'), icon: <DashboardIcon /> },
          { key: '/org/goals', label: t('strategicGoals'), icon: <GoalsIcon /> },
          { key: '/org/projects', label: t('projects'), icon: <ProjectsIcon /> },
          { key: '/org/companies', label: t('companies'), icon: <CompaniesIcon /> },
          { key: '/org/departments', label: t('departments'), icon: <DepartmentsIcon /> },
        ]}
      />
      <div className={`app-shell__main${catalog ? ' app-shell__content--catalog' : ''}`}>
        <Outlet context={{ role }} />
        <AIAssistantPanel />
      </div>
    </div>
  )
}
