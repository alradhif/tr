import { Card } from '../../ui/Card'
import { useLiveField } from '../../../../features/portal/DashboardLiveContext'
import { WidgetBodyGate } from '../../../../features/portal/WidgetBodyGate'

export function SubscriptionsRevenueChartWidget() {
  const months = useLiveField('revenueByMonth') ?? []
  const max = Math.max(...months.map((item) => item.amount), 1)

  return (
    <Card className="widget-risks-chart">
      <div className="widget-risks-chart__header">
        <div className="widget-icon-header">
          <p className="widget-title">الاشتراكات والإيرادات</p>
        </div>
      </div>
      <WidgetBodyGate isEmpty={months.length === 0}>
        <div className="widget-risks-chart__plot" style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 160, padding: '8px 4px 0' }}>
          {months.map((item) => (
            <div key={item.month} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, minWidth: 0 }}>
              <div
                title={`${item.month}: ${item.amount.toLocaleString('ar-SA')}`}
                style={{
                  width: '70%',
                  height: `${Math.max(4, (item.amount / max) * 120)}px`,
                  borderRadius: 6,
                  background: '#2E90FA',
                }}
              />
              <span style={{ fontSize: 11, color: '#71717a' }}>{item.month}</span>
            </div>
          ))}
        </div>
      </WidgetBodyGate>
    </Card>
  )
}
