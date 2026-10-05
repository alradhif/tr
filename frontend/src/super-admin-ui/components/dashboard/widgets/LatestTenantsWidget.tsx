import { ChevronLeft, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react'
import { Card } from '../../ui/Card'
import { Badge } from '../../ui/Badge'
import { useLiveField } from '../../../../features/portal/DashboardLiveContext'
import { WidgetBodyGate } from '../../../../features/portal/WidgetBodyGate'

const statusVariant = {
  active: 'success',
  trial: 'warning',
  suspended: 'danger',
} as const

const statusIcon = {
  active: CheckCircle2,
  trial: AlertTriangle,
  suspended: XCircle,
} as const

export function LatestTenantsWidget() {
  const latestTenants = useLiveField('latestTenants') ?? []

  return (
    <Card>
      <div className="widget-header">
        <div className="widget-icon-header">
          <h3 className="widget-header__title">أحدث المستأجرين</h3>
        </div>
        <button type="button" className="widget-header__link">
          عرض الكل
        </button>
      </div>
      <WidgetBodyGate isEmpty={latestTenants.length === 0}>
        <div className="list-rows">
          {latestTenants.map((item) => {
            const StatusIcon = statusIcon[item.status]
            return (
              <div className="list-row" key={item.id}>
                <div className="list-row__text">
                  <p className="list-row__title list-row__title--single-line">{item.name}</p>
                </div>
                <Badge variant={statusVariant[item.status]} icon={<StatusIcon size={12} />}>
                  {item.statusLabel}
                </Badge>
                <button type="button" className="list-row__nav-btn" aria-label="عرض التفاصيل">
                  <ChevronLeft size={14} />
                </button>
              </div>
            )
          })}
        </div>
      </WidgetBodyGate>
    </Card>
  )
}
