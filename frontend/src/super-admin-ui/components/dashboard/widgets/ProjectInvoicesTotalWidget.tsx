import { Card } from '../../ui/Card'
import invoiceIcon from '../../../../features/jodayn-finance/assets/card-icon.svg'
import { formatAmount } from '../../../../features/jodayn-finance/FinanceParts'
import { useLiveField } from '../../../../features/portal/DashboardLiveContext'
import { WidgetBodyGate } from '../../../../features/portal/WidgetBodyGate'

/** Everything invoiced across the projects, including VAT. */
export function ProjectInvoicesTotalWidget() {
  const value = useLiveField('totalRevenue')

  return (
    <Card className="widget-kpi-compact widget-active-projects">
      <div className="widget-icon-header">
        <span className="widget-icon-badge">
          <img src={invoiceIcon} alt="" width={16} height={16} />
        </span>
        <p className="widget-title widget-kpi-compact__title">إجمالي فواتير المشاريع</p>
      </div>
      <WidgetBodyGate isEmpty={value == null}>
        <div className="widget-stat-block widget-stat-inline">
          <span className="widget-stat-value">{formatAmount(value)}</span>
          <span className="widget-stat-label">ريال</span>
        </div>
      </WidgetBodyGate>
    </Card>
  )
}
