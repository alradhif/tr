import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { PageHeader } from '../../components/ui'
import { DashboardGrid, useDashboardState } from '../../super-admin-ui/components/dashboard/DashboardGrid'
import { WidgetLibraryPanel } from '../../super-admin-ui/components/dashboard/WidgetLibraryPanel'
import {
  ADMIN_DEFAULT_ACTIVE_WIDGET_IDS,
  ADMIN_PORTAL_LAYOUT,
  SUPERADMIN_DEFAULT_ACTIVE_WIDGET_IDS,
  DEFAULT_LAYOUT,
  type WidgetId,
} from '../../super-admin-ui/config/widgets'
import type { LayoutItem } from 'react-grid-layout/legacy'
import { EditGridIcon } from '../../super-admin-ui/components/layout/EditGridIcon'
import {
  DashboardLiveProvider,
  type DashboardLoadState,
  type LiveDashboardData,
} from './DashboardLiveContext'
import { ApiError } from '../../api/client'
import { getOrgDashboard } from '../../api/org'
import { getClientDashboard } from '../../api/clientPortal'
import { getJodaynDashboard } from '../../api/jodayn'
import { getOrgToken } from '../../auth/orgAuth'
import { getClientToken } from '../../auth/clientAuth'
import { getJodaynToken } from '../../auth/jodaynAuth'
import '../../super-admin-ui/components/dashboard/dashboard.css'
import '../../super-admin-ui/components/layout/layout.css'
import '../../super-admin-ui/components/ui/ui.css'
import './portal-dashboard.css'

export type PortalKind = 'org' | 'client' | 'jodayn'

type PortalDashboardProps = {
  title: string
  subtitle?: string
  portal: PortalKind
  banner?: ReactNode
  /** Matches TrackPlus-new-ui senior vs data-entry header treatment. */
  variant?: 'senior' | 'dataentry'
}

const JODAYN_LAYOUT: LayoutItem[] = DEFAULT_LAYOUT.filter((item) =>
  SUPERADMIN_DEFAULT_ACTIVE_WIDGET_IDS.includes(item.i as WidgetId),
)

function dashboardEndpoint(portal: PortalKind) {
  if (portal === 'org') return '/org/dashboard'
  if (portal === 'client') return '/client/dashboard'
  return '/jodayn/dashboard'
}

export function PortalDashboard({
  title,
  subtitle,
  portal,
  banner,
  variant = 'senior',
}: PortalDashboardProps) {
  const { t } = useTranslation()
  const widgetIds =
    portal === 'jodayn' ? SUPERADMIN_DEFAULT_ACTIVE_WIDGET_IDS : ADMIN_DEFAULT_ACTIVE_WIDGET_IDS
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
    widgetIds,
    widgetIds,
    portal === 'jodayn' ? JODAYN_LAYOUT : ADMIN_PORTAL_LAYOUT,
    portal,
  )

  const [live, setLive] = useState<LiveDashboardData | null>(null)
  const [loadState, setLoadState] = useState<DashboardLoadState>('loading')

  useEffect(() => {
    setLayout(portal === 'jodayn' ? JODAYN_LAYOUT : ADMIN_PORTAL_LAYOUT)
  }, [portal, setLayout])

  const loadLive = useCallback(async () => {
    const endpoint = dashboardEndpoint(portal)
    setLoadState('loading')
    try {
      if (portal === 'org') {
        const token = getOrgToken()
        if (!token) {
          console.error('[dashboard]', { endpoint, status: 0, message: 'missing token' })
          setLive(null)
          setLoadState('error')
          return
        }
        setLive(await getOrgDashboard(token))
      } else if (portal === 'client') {
        const token = getClientToken()
        if (!token) {
          console.error('[dashboard]', { endpoint, status: 0, message: 'missing token' })
          setLive(null)
          setLoadState('error')
          return
        }
        setLive(await getClientDashboard(token))
      } else {
        const token = getJodaynToken()
        if (!token) {
          console.error('[dashboard]', { endpoint, status: 0, message: 'missing token' })
          setLive(null)
          setLoadState('error')
          return
        }
        setLive(await getJodaynDashboard(token))
      }
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
  }, [portal])

  useEffect(() => {
    void loadLive()
  }, [loadLive])

  const editButton = (
    <button
      type="button"
      className={`header__edit-btn ${isEditMode ? 'header__edit-btn--active' : ''}`}
      onClick={() => setIsEditMode((prev) => !prev)}
    >
      <EditGridIcon size={16} className="header__edit-icon" />
      <span>{isEditMode ? t('endEditing') : t('editLayout')}</span>
    </button>
  )

  const grid = (
    <>
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
    </>
  )

  return (
    <DashboardLiveProvider value={live} loadState={loadState} refresh={() => void loadLive()}>
      <div className={`dashboard-page${isEditMode ? ' dashboard-page--editing' : ''}`}>
        <PageHeader
          className={variant === 'dataentry' ? 'page-header--dataentry' : 'page-header--senior'}
          title={title}
          subtitle={subtitle}
          action={editButton}
        />
        {banner}
        {grid}
      </div>
    </DashboardLiveProvider>
  )
}
