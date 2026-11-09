import { Card } from '../../ui/Card'
import { useLiveField } from '../../../../features/portal/DashboardLiveContext'
import { WidgetBodyGate } from '../../../../features/portal/WidgetBodyGate'

const SERIES = [
  { key: 'active', label: 'نشط', color: '#50B055' },
  { key: 'trial', label: 'تجربة', color: '#F7A63A' },
  { key: 'suspended', label: 'معلق', color: '#F04438' },
] as const

/** Tenants per month, stacked by status (Figma: "المستأجرون حسب الحالة شهريًا"). */
export function SubscriptionsRevenueChartWidget() {
  const months = useLiveField('tenantsByStatusMonth') ?? []
  const total = (month: (typeof months)[number]) => SERIES.reduce((sum, series) => sum + month[series.key], 0)
  const top = Math.max(2, ...months.map(total))
  const ceiling = Math.ceil(top / 2) * 2
  const ticks = [ceiling, Math.round((ceiling * 2) / 3), Math.round(ceiling / 3), 0]

  return (
    <Card className="widget-risks-chart">
      <div className="widget-risks-chart__header">
        <div className="widget-icon-header">
          <p className="widget-title">المستخدمون حسب الحالة شهريًا</p>
        </div>
        <div className="sa-status-chart__legend">
          {SERIES.map((series) => (
            <span key={series.key}>
              <i style={{ background: series.color }} />
              {series.label}
            </span>
          ))}
        </div>
      </div>
      <WidgetBodyGate isEmpty={months.length === 0}>
        <div className="sa-status-chart" dir="ltr">
          <div className="sa-status-chart__ticks">
            {ticks.map((tick) => (
              <span key={tick}>{tick}</span>
            ))}
          </div>
          <div className="sa-status-chart__plot">
            {months.map((month) => (
              <div className="sa-status-chart__month" key={month.month}>
                <div className="sa-status-chart__bar" style={{ height: `${(total(month) / ceiling) * 100}%` }}>
                  {SERIES.filter((series) => month[series.key] > 0).map((series) => (
                    <i
                      key={series.key}
                      title={`${series.label}: ${month[series.key]}`}
                      style={{ flexGrow: month[series.key], background: series.color }}
                    />
                  ))}
                </div>
                <span>{month.month}</span>
              </div>
            ))}
          </div>
        </div>
      </WidgetBodyGate>
    </Card>
  )
}
