import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts'
import { dashboardAssets } from '@/assets'
import { AssetIcon } from '../../../../components/ui/AssetIcon'
import { Card } from '../../ui/Card'
import { useLiveField } from '../../../../features/portal/DashboardLiveContext'
import { WidgetBodyGate } from '../../../../features/portal/WidgetBodyGate'

export function OpenRisksDonutWidget() {
  const openRisks = useLiveField('openRisks')
  const data = openRisks
    ? [
        { name: 'مرتفع', value: openRisks.high, color: '#F04438' },
        { name: 'متوسط', value: openRisks.medium, color: '#F79009' },
        { name: 'منخفض', value: openRisks.low, color: '#17B26A' },
      ]
    : []

  return (
    <Card className="widget-open-risks">
      <div className="widget-icon-header">
        <span className="widget-icon-badge">
          <AssetIcon src={dashboardAssets.risk} size={16} />
        </span>
        <p className="widget-title widget-open-risks__title">المخاطر المفتوحة</p>
      </div>
      <WidgetBodyGate isEmpty={!openRisks}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
          <div className="legend-list" style={{ flex: 1 }}>
            {data.map((item) => (
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
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={20}
                  outerRadius={34}
                  paddingAngle={2}
                  dataKey="value"
                  stroke="none"
                >
                  {data.map((entry) => (
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
