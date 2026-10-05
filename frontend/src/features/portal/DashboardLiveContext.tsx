import {
  createContext,
  useContext,
  type ReactNode,
} from 'react'

export type DashboardLoadState = 'loading' | 'ready' | 'error'

/** Live dashboard payload from Org/Client/Jodayn/SA APIs. Fields may be partial. */
export type LiveDashboardData = {
  live?: boolean
  portal?: string
  activeProjects?: number
  avgProgress?: number
  upcomingDeliverables?: number
  deliverablesThisWeek?: number
  openRisks?: { high: number; medium: number; low: number }
  risksByMonth?: Array<{ month: string; low: number; medium: number; high: number }>
  projectStatuses?: Array<{ label: string; value: number; color: string; count?: number }>
  todayAlerts?: Array<{
    id: string
    type: 'deliverable' | 'risk' | 'approval'
    title: string
    subtitle: string
    time: string
    href?: string
    projectId?: string
    submittedBy?: string
    canDecide?: boolean
  }>
  pendingRequests?: number
  pendingProjectApprovals?: number
  deliverables?: Array<{ id: string; title: string; project: string }>
  projects?: Array<{
    id: string
    title: string
    company: string
    progress: number
    status: 'on-track' | 'late' | 'stalled' | 'completed'
    statusLabel: string
  }>
  activeTenants?: number
  subscriptionsEndingSoon?: number
  tenantStatusBreakdown?: Array<{ name: string; value: number; color: string }>
  tenantsByPlan?: Array<{ label: string; value: number; color: string; count?: number }>
  tenantAlerts?: Array<{
    id: string
    type: 'renewal' | 'unused-invite' | 'trial-expired'
    title: string
    subtitle: string
    time: string
  }>
  latestActions?: Array<{ id: string; title: string }>
  latestTenants?: Array<{
    id: string
    name: string
    status: 'active' | 'trial' | 'suspended'
    statusLabel: string
  }>
  sectorCount?: number
  orgAccounts?: number
  clientAccounts?: number
  pendingInvoices?: number
  totalRevenue?: number
  revenueByMonth?: Array<{ month: string; amount: number }>
}

const DashboardLiveContext = createContext<LiveDashboardData | null>(null)
const DashboardRefreshContext = createContext<() => void>(() => {})
const DashboardLoadContext = createContext<DashboardLoadState>('loading')

export function DashboardLiveProvider({
  value,
  loadState = 'loading',
  refresh,
  children,
}: {
  value: LiveDashboardData | null
  loadState?: DashboardLoadState
  refresh?: () => void
  children: ReactNode
}) {
  return (
    <DashboardRefreshContext.Provider value={refresh ?? (() => {})}>
      <DashboardLoadContext.Provider value={loadState}>
        <DashboardLiveContext.Provider value={value}>{children}</DashboardLiveContext.Provider>
      </DashboardLoadContext.Provider>
    </DashboardRefreshContext.Provider>
  )
}

export function useDashboardLive() {
  return useContext(DashboardLiveContext)
}

export function useDashboardRefresh() {
  return useContext(DashboardRefreshContext)
}

export function useDashboardLoadState() {
  return useContext(DashboardLoadContext)
}

/** True when this widget key has real live data available. */
export function useLiveField<K extends keyof LiveDashboardData>(key: K): LiveDashboardData[K] | undefined {
  const live = useDashboardLive()
  const loadState = useDashboardLoadState()
  if (loadState !== 'ready' || !live?.live) return undefined
  return live[key]
}
