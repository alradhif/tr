import { TrendingUp } from 'lucide-react'
import { Card } from '../../ui/Card'
import { useLiveField } from '../../../../features/portal/DashboardLiveContext'
import { WidgetBodyGate } from '../../../../features/portal/WidgetBodyGate'

export function TotalRevenueWidget() {
  const value = useLiveField('totalRevenue')

  return (
    <Card className="widget-total-revenue">
      <span className="widget-icon-badge widget-total-revenue__icon">
        <TrendingUp size={16} aria-hidden style={{ transform: 'scaleX(-1)' }} />
      </span>
      <div className="widget-icon-header">
        <p className="widget-title widget-kpi-compact__title">إجمالي الايرادات</p>
      </div>
      <WidgetBodyGate isEmpty={value == null}>
        <div className="widget-stat-block widget-stat-inline">
          <span className="widget-stat-value">{Number(value || 0).toLocaleString('ar-SA')}</span>
          <span className="widget-stat-label">ر.س</span>
        </div>
      </WidgetBodyGate>
    </Card>
  )
}
