import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts'
import { Card } from '../../ui/Card'
import { useLiveField } from '../../../../features/portal/DashboardLiveContext'
import { WidgetBodyGate } from '../../../../features/portal/WidgetBodyGate'

export function TenantStatusDonutWidget() {
  const tenantStatusBreakdown = useLiveField('tenantStatusBreakdown') ?? []
  const isEmpty = tenantStatusBreakdown.length === 0

  return (
    <Card className="widget-tenant-status-donut">
      <div className="widget-icon-header">
        <p className="widget-title widget-tenant-status-donut__title">إجمالي المستأجرين</p>
      </div>
      <WidgetBodyGate isEmpty={isEmpty}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 'auto' }}>
          <div className="legend-list" style={{ flex: 1 }}>
            {tenantStatusBreakdown.map((item) => (
              <div key={item.name} className="legend-item">
                <span className="legend-item__left">
                  <span className="legend-item__dot" style={{ background: item.color }} />
                  <span style={{ color: item.color, fontWeight: 700 }}>{item.name}</span>
                </span>
                <span className="legend-item__value">{item.value}</span>
              </div>
            ))}
          </div>
          <div style={{ width: 76, height: 76, flexShrink: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={tenantStatusBreakdown}
                  cx="50%"
                  cy="50%"
                  innerRadius={20}
                  outerRadius={34}
                  paddingAngle={2}
                  dataKey="value"
                  stroke="none"
                >
                  {tenantStatusBreakdown.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </WidgetBodyGate>
    </Card>
  )
}
