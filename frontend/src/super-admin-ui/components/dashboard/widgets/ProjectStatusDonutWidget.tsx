import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts'
import { Card } from '../../ui/Card'
import { useLiveField } from '../../../../features/portal/DashboardLiveContext'
import { WidgetBodyGate } from '../../../../features/portal/WidgetBodyGate'

export function ProjectStatusDonutWidget() {
  const projectStatuses = useLiveField('projectStatuses') ?? []
  const isEmpty = projectStatuses.length === 0
  const chartData = projectStatuses.filter((item) => (item.count ?? item.value) > 0)

  return (
    <Card className="widget-status-donut">
      <div className="widget-icon-header">
        <p className="widget-title">توزيع حالات المشاريع</p>
      </div>
      <WidgetBodyGate isEmpty={isEmpty}>
        <div className="widget-status-donut__body">
          <div className="legend-list widget-status-donut__legend">
            {projectStatuses.map((item) => (
              <div key={item.label} className="legend-item">
                <span className="legend-item__left">
                  <span className="legend-item__dot" style={{ background: item.color }} />
                  {item.label}
                </span>
                <span className="legend-item__value">{item.value}%</span>
              </div>
            ))}
          </div>
          <div className="widget-status-donut__chart">
            <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={44}
                outerRadius={72}
                paddingAngle={2}
                dataKey="value"
                stroke="none"
              >
                {chartData.map((entry) => (
                  <Cell key={entry.label} fill={entry.color} />
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
