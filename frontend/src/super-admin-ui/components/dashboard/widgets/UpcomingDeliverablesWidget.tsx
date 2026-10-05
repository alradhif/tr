import { dashboardAssets, projectsAssets } from '@/assets'
import { AssetIcon } from '../../../../components/ui/AssetIcon'
import { Card } from '../../ui/Card'
import { Badge } from '../../ui/Badge'
import { useLiveField } from '../../../../features/portal/DashboardLiveContext'
import { WidgetBodyGate } from '../../../../features/portal/WidgetBodyGate'

export function UpcomingDeliverablesWidget() {
  const upcoming = useLiveField('upcomingDeliverables')
  const thisWeek = useLiveField('deliverablesThisWeek')

  return (
    <Card className="widget-kpi-compact widget-upcoming-deliverables">
      <div className="widget-icon-header">
        <span className="widget-icon-badge">
          <AssetIcon src={projectsAssets.deliverables} size={16} />
        </span>
        <p className="widget-title widget-kpi-compact__title">مخرجات قادمة</p>
      </div>
      <WidgetBodyGate isEmpty={upcoming == null}>
        <div className="widget-bottom-row widget-kpi-compact__bottom-row">
          <div className="widget-stat-inline">
            <span className="widget-stat-value">{upcoming}</span>
            <span className="widget-stat-label">مخرجات</span>
          </div>
          <Badge variant="warning" icon={<AssetIcon src={dashboardAssets.notification} size={14} />}>
            {thisWeek ?? 0} خلال أسبوع
          </Badge>
        </div>
      </WidgetBodyGate>
    </Card>
  )
}
