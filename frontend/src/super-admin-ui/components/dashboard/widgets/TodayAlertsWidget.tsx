import { useNavigate } from 'react-router-dom'
import { Clock, MessageSquareText, TriangleAlert, type LucideIcon } from 'lucide-react'
import { Card } from '../../ui/Card'
import { useLiveField } from '../../../../features/portal/DashboardLiveContext'
import { WidgetBodyGate } from '../../../../features/portal/WidgetBodyGate'

type AlertType = 'deliverable' | 'risk' | 'approval'

const alertIcons: Record<AlertType, LucideIcon> = {
  deliverable: Clock,
  risk: TriangleAlert,
  approval: MessageSquareText,
}

/** Three alerts in the design's layout; a row opens its project, where approvals are decided. */
export function TodayAlertsWidget() {
  const live = useLiveField('todayAlerts')
  const todayAlerts = live ?? []
  const navigate = useNavigate()
  // The Jodayn dashboard frame in Figma titles this section "حالات الطلبات".
  const title = location.pathname.startsWith('/jodayn') ? 'حالات الطلبات' : 'تنبيهات اليوم'

  return (
    <Card className="widget-today-alerts">
      <div className="widget-today-alerts__header">
        <div className="widget-icon-header">
          <h3 className="widget-header__title">{title}</h3>
        </div>
        <span className="widget-today-alerts__count" aria-label={`${todayAlerts.length} تنبيهات`}>
          {todayAlerts.length}
        </span>
      </div>
      <WidgetBodyGate isEmpty={todayAlerts.length === 0}>
        <div className="alert-list">
          {todayAlerts.map((alert) => {
            const Icon = alertIcons[alert.type as AlertType] || Clock
            const href = (alert as typeof alert & { href?: string }).href
            const content = (
              <>
                <div className={`alert-item__icon alert-item__icon--${alert.type}`}>
                  <Icon size={24} strokeWidth={1.6} />
                </div>
                <div className="alert-item__content">
                  <p className="alert-item__title">{alert.title}</p>
                  <p className="alert-item__subtitle">{alert.subtitle}</p>
                </div>
                <span className="alert-item__time">{alert.time}</span>
              </>
            )
            return href ? (
              <button
                key={alert.id}
                type="button"
                className="alert-item alert-item--link"
                onClick={() => navigate(href)}
              >
                {content}
              </button>
            ) : (
              <div key={alert.id} className="alert-item">
                {content}
              </div>
            )
          })}
        </div>
      </WidgetBodyGate>
    </Card>
  )
}
