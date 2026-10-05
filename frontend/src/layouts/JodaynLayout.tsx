import { Navigate, Outlet } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { brandAssets, dashboardDataAssets, navigationAssets, tenantsAssets } from '@/assets'
import { AppSidebar } from '../components/ui'
import {
  clearJodaynSession,
  getJodaynRole,
  getJodaynUser,
  isJodaynAuthenticated,
  jodaynRoleLabel,
} from '../auth/jodaynAuth'
import { AIAssistantPanel } from '../features/portal'
import { DashboardIcon, SidebarSettingsIcon } from '../super-admin-ui/components/layout/SidebarIcons'
import '../design/portal-layout.css'
import '../org-catalog'

function NavImg({ src }: { src: string }) {
  return <img src={src} alt="" className="sidebar__nav-icon" width={20} height={20} />
}

export function JodaynLayout() {
  const { t } = useTranslation()
  const role = getJodaynRole()
  const user = getJodaynUser()

  if (!isJodaynAuthenticated() || !role) {
    return <Navigate to="/login" replace />
  }

  return (
    <div className="app-shell" dir="rtl">
      <AppSidebar
        variant="catalog"
        settingsPath="/jodayn/settings"
        userName={user?.name}
        userRole={jodaynRoleLabel(role)}
        showMore
        brand={<img src={brandAssets.logoFull} alt="TrackPlus" className="sidebar__logo-full" />}
        settingsIcon={<SidebarSettingsIcon />}
        onSignOut={() => {
          clearJodaynSession()
          window.location.assign('/login')
        }}
        navItems={[
          { key: '/jodayn/dashboard', label: t('dashboard'), icon: <DashboardIcon /> },
          { key: '/jodayn/sectors', label: t('sectors'), icon: <NavImg src={navigationAssets.departments} /> },
          { key: '/jodayn/org-accounts', label: t('orgAccounts'), icon: <NavImg src={navigationAssets.companies} /> },
          { key: '/jodayn/client-accounts', label: t('clientAccounts'), icon: <NavImg src={tenantsAssets.tenantsMenu} /> },
          { key: '/jodayn/invoices', label: t('invoices'), icon: <NavImg src={dashboardDataAssets.totalPackages} /> },
          { key: '/jodayn/forecasts', label: t('revenueForecasts'), icon: <NavImg src={dashboardDataAssets.active} /> },
          { key: '/jodayn/reports', label: t('financialReports'), icon: <NavImg src={navigationAssets.goals} /> },
        ]}
      />
      <div className="app-shell__main app-shell__content--catalog">
        <Outlet context={{ role }} />
        <AIAssistantPanel />
      </div>
    </div>
  )
}
