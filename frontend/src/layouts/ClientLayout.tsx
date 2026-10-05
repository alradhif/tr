import { Navigate, Outlet } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { brandAssets } from '@/assets'
import { AppSidebar } from '../components/ui'
import {
  clientRoleLabel,
  clearClientSession,
  getClientRole,
  getClientUser,
  isClientAuthenticated,
} from '../auth/clientAuth'
import { AIAssistantPanel } from '../features/portal'
import {
  DashboardIcon,
  GoalsIcon,
  ProjectsIcon,
  SidebarSettingsIcon,
} from '../super-admin-ui/components/layout/SidebarIcons'
import '../design/portal-layout.css'
import '../org-catalog'

export function ClientLayout() {
  const { t } = useTranslation()
  const role = getClientRole()
  const user = getClientUser()

  if (!isClientAuthenticated() || !role || !user) {
    return <Navigate to="/login" replace />
  }

  return (
    <div className="app-shell" dir="rtl">
      <AppSidebar
        variant="catalog"
        settingsPath="/client/settings"
        userName={user.name}
        userRole={clientRoleLabel(role)}
        showMore
        brand={<img src={brandAssets.logoFull} alt="TrackPlus" className="sidebar__logo-full" />}
        settingsIcon={<SidebarSettingsIcon />}
        onSignOut={() => {
          clearClientSession()
          window.location.assign('/login')
        }}
        navItems={[
          { key: '/client/dashboard', label: t('dashboard'), icon: <DashboardIcon /> },
          { key: '/client/goals', label: t('strategicGoals'), icon: <GoalsIcon /> },
          { key: '/client/projects', label: t('projects'), icon: <ProjectsIcon /> },
        ]}
      />
      <div className="app-shell__main app-shell__content--catalog">
        <Outlet context={{ role, user }} />
        <AIAssistantPanel />
      </div>
    </div>
  )
}
