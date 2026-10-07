import { Navigate, Outlet } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { brandAssets } from '@/assets'
import { AppSidebar } from '../components/ui'
import {
  clearJodaynSession,
  getJodaynRole,
  getJodaynUser,
  isJodaynAuthenticated,
  jodaynRoleLabel,
} from '../auth/jodaynAuth'
import { AIAssistantPanel } from '../features/portal'
import { SidebarSettingsIcon } from '../super-admin-ui/components/layout/SidebarIcons'
import fileTextIcon from '../features/jodayn-finance/assets/file-text.svg'
import walletIcon from '../features/jodayn-finance/assets/wallet.svg'
import creditCardIcon from '../features/jodayn-finance/assets/credit-card.svg'
import barChartIcon from '../features/jodayn-finance/assets/bar-chart-3.svg'
import buildingIcon from '../features/jodayn-finance/assets/building-2.svg'
import usersIcon from '../features/jodayn-finance/assets/users.svg'
import '../design/portal-layout.css'
import '../org-catalog'
import '../features/jodayn-finance/jodayn-settings.css'

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
    <div className="app-shell jodayn-shell" dir="rtl">
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
          { key: '/jodayn/reports', label: t('financialReports'), icon: <NavImg src={fileTextIcon} /> },
          { key: '/jodayn/forecasts', label: t('revenueForecasts'), icon: <NavImg src={walletIcon} /> },
          { key: '/jodayn/invoices', label: t('invoices'), icon: <NavImg src={creditCardIcon} /> },
          { key: '/jodayn/client-accounts', label: t('clientAccounts'), icon: <NavImg src={barChartIcon} /> },
          { key: '/jodayn/org-accounts', label: t('orgAccounts'), icon: <NavImg src={buildingIcon} /> },
          { key: '/jodayn/sectors', label: t('sectors'), icon: <NavImg src={usersIcon} /> },
        ]}
      />
      <div className="app-shell__main app-shell__content--catalog">
        <Outlet context={{ role }} />
        <AIAssistantPanel />
      </div>
    </div>
  )
}
