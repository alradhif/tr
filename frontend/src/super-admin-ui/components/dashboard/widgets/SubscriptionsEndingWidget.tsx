import { Card } from '../../ui/Card'
import { useLiveField } from '../../../../features/portal/DashboardLiveContext'
import { WidgetBodyGate } from '../../../../features/portal/WidgetBodyGate'

export function SubscriptionsEndingWidget() {
  const value = useLiveField('subscriptionsEndingSoon')

  return (
    <Card className="widget-kpi-compact widget-subscriptions-ending">
      <div className="widget-icon-header">
        <p className="widget-title widget-kpi-compact__title">اشتراكات تنتهي خلال 30 يوم</p>
      </div>
      <WidgetBodyGate isEmpty={value == null}>
        <div className="widget-stat-block widget-stat-inline">
          <span className="widget-stat-value">{value}</span>
          <span className="widget-stat-label">حسابات</span>
        </div>
      </WidgetBodyGate>
    </Card>
  )
}
