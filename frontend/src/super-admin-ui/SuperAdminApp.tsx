import { useCallback, useEffect, useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { AppShell } from './components/layout/AppShell'
import { Header } from './components/layout/Header'
import type { PageId } from './components/layout/Sidebar'
import { TenantsPage } from './components/tenants/TenantsPage'
import { UsersPage } from './components/users/UsersPage'
import { SettingsPage } from '../pages/shared/SettingsPage'
import { AuditLogPage } from './components/audit/AuditLogPage'
import { SubscriptionsPage } from './components/subscriptions/SubscriptionsPage'
import { DashboardGrid, useDashboardState } from './components/dashboard/DashboardGrid'
import { WidgetLibraryPanel } from './components/dashboard/WidgetLibraryPanel'
import { AIAssistantPanel } from './components/assistant/AIAssistantPanel'
import { CompaniesPage } from './components/companies/CompaniesPage'
import type { UserRole } from './types/auth'
import {
  ADMIN_DEFAULT_ACTIVE_WIDGET_IDS,
  SUPERADMIN_DEFAULT_ACTIVE_WIDGET_IDS,
} from './config/widgets'
import {
  clearSuperAdminSession,
  getSuperAdminToken,
  isSuperAdminAuthenticated,
} from '../auth/superAdminAuth'
import { PackageProvider } from './context/PackageContext'
import { TenantProvider } from './context/TenantContext'
import { getSuperAdminDashboard } from '../api/superAdmin'
import { ApiError } from '../api/client'
import {
  DashboardLiveProvider,
  type DashboardLoadState,
  type LiveDashboardData,
} from '../features/portal/DashboardLiveContext'
import './components/layout/layout.css'
import './components/dashboard/dashboard.css'
import './styles/global.css'

type AuthStep = 'login' | 'authenticated'

function DashboardPage({ role }: { role: UserRole }) {
  const {
    isEditMode,
    setIsEditMode,
    activeWidgetIds,
    layout,
    setLayout,
    removeWidget,
    removedWidgetIds,
    addWidget,
  } = useDashboardState(
    role === 'admin' ? ADMIN_DEFAULT_ACTIVE_WIDGET_IDS : SUPERADMIN_DEFAULT_ACTIVE_WIDGET_IDS,
    undefined,
    undefined,
    'superadmin',
  )
  const [live, setLive] = useState<LiveDashboardData | null>(null)
  const [loadState, setLoadState] = useState<DashboardLoadState>('loading')

  const loadLive = useCallback(async () => {
    const endpoint = '/super-admin/dashboard'
    setLoadState('loading')
    const token = getSuperAdminToken()
    if (!token) {
      console.error('[dashboard]', { endpoint, status: 0, message: 'missing token' })
      setLive(null)
      setLoadState('error')
      return
    }
    try {
      const data = await getSuperAdminDashboard(token)
      setLive(data)
      setLoadState('ready')
    } catch (err) {
      const status = err instanceof ApiError ? err.status : 0
      console.error('[dashboard]', {
        endpoint,
        status,
        message: err instanceof Error ? err.message : 'request failed',
      })
      setLive(null)
      setLoadState('error')
    }
  }, [])

  useEffect(() => {
    void loadLive()
  }, [loadLive])

  return (
    <DashboardLiveProvider value={live} loadState={loadState} refresh={() => void loadLive()}>
      <div className={`dashboard-page${isEditMode ? ' dashboard-page--editing' : ''}`}>
        <Header
          role={role}
          isEditMode={isEditMode}
          onToggleEdit={() => setIsEditMode((prev) => !prev)}
        />
        <div className="dashboard-body">
          <div
            className={`dashboard-body__grid-area ${
              isEditMode ? 'dashboard-body__grid-area--library-open' : ''
            }`}
          >
            <DashboardGrid
              isEditMode={isEditMode}
              activeWidgetIds={activeWidgetIds}
              layout={layout}
              onLayoutChange={setLayout}
              onRemoveWidget={removeWidget}
            />
          </div>
        </div>
        {isEditMode && (
          <WidgetLibraryPanel
            onClose={() => setIsEditMode(false)}
            removedWidgetIds={removedWidgetIds}
            onAddWidget={addWidget}
          />
        )}
      </div>
    </DashboardLiveProvider>
  )
}

const PAGE_PATHS: Record<PageId, string> = {
  dashboard: '/super-admin',
  tenants: '/super-admin/tenants',
  users: '/super-admin/users',
  subscriptions: '/super-admin/subscriptions',
  'audit-log': '/super-admin/audit-log',
  settings: '/super-admin/settings',
  companies: '/super-admin',
}

function pageFromPath(pathname: string): PageId {
  if (pathname.includes('/tenants')) return 'tenants'
  if (pathname.includes('/users')) return 'users'
  if (pathname.includes('/subscriptions')) return 'subscriptions'
  if (pathname.includes('/audit-log')) return 'audit-log'
  if (pathname.includes('/settings')) return 'settings'
  return 'dashboard'
}

function SuperAdminAppInner() {
  const location = useLocation()
  const navigate = useNavigate()
  const [activePage, setActivePage] = useState<PageId>(() => pageFromPath(location.pathname))
  const [authStep, setAuthStep] = useState<AuthStep>(() => {
    if (isSuperAdminAuthenticated()) return 'authenticated'
    return 'login'
  })
  const role: UserRole = 'superadmin'

  useEffect(() => {
    setActivePage(pageFromPath(location.pathname))
  }, [location.pathname])

  const handleNavigate = (page: PageId) => {
    setActivePage(page)
    navigate(PAGE_PATHS[page] ?? '/super-admin')
  }

  if (authStep === 'login') {
    return <Navigate to="/login" replace />
  }

  function renderPage() {
    if (activePage === 'dashboard') return <DashboardPage role={role} />
    if (role === 'admin') return <CompaniesPage />
    if (activePage === 'tenants') return <TenantsPage />
    if (activePage === 'users') return <UsersPage />
    if (activePage === 'subscriptions') return <SubscriptionsPage />
    if (activePage === 'settings') return <SettingsPage />
    return <AuditLogPage />
  }

  const handleSignOut = () => {
    clearSuperAdminSession()
    setAuthStep('login')
    setActivePage('dashboard')
    navigate('/login', { replace: true })
  }

  return (
    <AppShell
      role={role}
      activePage={activePage}
      onNavigate={handleNavigate}
      onSignOut={handleSignOut}
    >
      {renderPage()}
      <AIAssistantPanel />
    </AppShell>
  )
}

export function SuperAdminApp() {
  return (
    <PackageProvider>
      <TenantProvider>
        <SuperAdminAppInner />
      </TenantProvider>
    </PackageProvider>
  )
}
