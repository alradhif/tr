import { navigationAssets } from '@/assets'
import { AssetIcon } from '../../../../components/ui/AssetIcon'
import { Card } from '../../ui/Card'
import { useLiveField } from '../../../../features/portal/DashboardLiveContext'
import { WidgetBodyGate } from '../../../../features/portal/WidgetBodyGate'

export function ActiveProjectsWidget() {
  const value = useLiveField('activeProjects')

  return (
    <Card className="widget-kpi-compact widget-active-projects">
      <div className="widget-icon-header">
        <span className="widget-icon-badge">
          <AssetIcon src={navigationAssets.projects} size={16} />
        </span>
        <p className="widget-title widget-kpi-compact__title">المشاريع النشطة</p>
      </div>
      <WidgetBodyGate isEmpty={value == null}>
        <div className="widget-stat-block widget-stat-inline">
          <span className="widget-stat-value">{value}</span>
          <span className="widget-stat-label">مشاريع</span>
        </div>
      </WidgetBodyGate>
    </Card>
  )
}
