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
import {
  CompaniesIcon,
  DashboardIcon,
  DepartmentsIcon,
  GoalsIcon,
  ProjectsIcon,
  SidebarSettingsIcon,
} from '../super-admin-ui/components/layout/SidebarIcons'
// Finance icons from the Figma Jodayn frames (vuesax moneys / wallet-money / note).
import moneysIcon from '../features/jodayn-finance/assets/moneys.svg'
import walletMoneyIcon from '../features/jodayn-finance/assets/wallet-money.svg'
import noteIcon from '../features/jodayn-finance/assets/note.svg'
import '../design/portal-layout.css'
import '../org-catalog'
import '../features/jodayn-finance/jodayn-settings.css'

function NavImg({ src, dark = false }: { src: string; dark?: boolean }) {
  return (
    <img
      src={src}
      alt=""
      className={`sidebar__nav-icon${dark ? ' sidebar__nav-icon--dark' : ''}`}
      width={22}
      height={22}
    />
  )
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
        // Order and labels from the Figma Jodayn dashboard frame (2394:69202).
        navItems={[
          { key: '/jodayn/dashboard', label: t('dashboard'), icon: <DashboardIcon /> },
          { key: '/jodayn/goals', label: t('strategicGoals'), icon: <GoalsIcon /> },
          { key: '/jodayn/projects', label: t('projects'), icon: <ProjectsIcon /> },
          { key: '/jodayn/client-accounts', label: 'العملاء', icon: <CompaniesIcon /> },
          { key: '/jodayn/departments', label: 'الإدارات', icon: <DepartmentsIcon /> },
          { key: '/jodayn/invoices', label: t('invoices'), icon: <NavImg src={moneysIcon} dark /> },
          { key: '/jodayn/forecasts', label: t('revenueForecasts'), icon: <NavImg src={walletMoneyIcon} /> },
          { key: '/jodayn/reports', label: t('financialReports'), icon: <NavImg src={noteIcon} /> },
        ]}
      />
      <div className="app-shell__main app-shell__content--catalog">
        <Outlet context={{ role }} />
        <AIAssistantPanel />
      </div>
    </div>
  )
}
