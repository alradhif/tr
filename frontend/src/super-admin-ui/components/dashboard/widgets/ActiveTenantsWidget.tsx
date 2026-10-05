import { Card } from '../../ui/Card'
import { useLiveField } from '../../../../features/portal/DashboardLiveContext'
import { WidgetBodyGate } from '../../../../features/portal/WidgetBodyGate'

export function ActiveTenantsWidget() {
  const value = useLiveField('activeTenants')

  return (
    <Card className="widget-kpi-compact widget-active-tenants">
      <div className="widget-icon-header">
        <p className="widget-title widget-kpi-compact__title">المستأجرون النشطون</p>
      </div>
      <WidgetBodyGate isEmpty={value == null}>
        <div className="widget-stat-block widget-stat-inline">
          <span className="widget-stat-value">{value}</span>
          <span className="widget-stat-label">جهات</span>
        </div>
      </WidgetBodyGate>
    </Card>
  )
}
