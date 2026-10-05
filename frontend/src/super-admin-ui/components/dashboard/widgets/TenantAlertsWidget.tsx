import { commonAssets, dashboardAssets, dashboardDataAssets } from '@/assets'
import { AssetIcon } from '../../../../components/ui/AssetIcon'
import { Card } from '../../ui/Card'
import { useLiveField } from '../../../../features/portal/DashboardLiveContext'
import { WidgetBodyGate } from '../../../../features/portal/WidgetBodyGate'

type TenantAlertType = 'renewal' | 'unused-invite' | 'trial-expired'

const alertIconClass: Record<TenantAlertType, string> = {
  renewal: 'deliverable',
  'unused-invite': 'risk',
  'trial-expired': 'approval',
}

const alertIcons: Record<TenantAlertType, string> = {
  renewal: commonAssets.clock,
  'unused-invite': dashboardAssets.risk,
  'trial-expired': dashboardDataAssets.trial,
}

export function TenantAlertsWidget() {
  const tenantAlerts = useLiveField('tenantAlerts') ?? []

  return (
    <Card className="widget-today-alerts">
      <div className="widget-today-alerts__header">
        <div className="widget-icon-header">
          <h3 className="widget-header__title">تنبيهات اليوم</h3>
        </div>
        <span className="widget-today-alerts__count" aria-label={`${tenantAlerts.length} تنبيهات`}>
          {tenantAlerts.length}
        </span>
      </div>
      <WidgetBodyGate isEmpty={tenantAlerts.length === 0}>
        <div className="alert-list">
          {tenantAlerts.map((alert) => {
            const type = (alert.type as TenantAlertType) || 'renewal'
            const iconSrc = alertIcons[type] || commonAssets.clock
            return (
              <div key={alert.id} className="alert-item">
                <div className={`alert-item__icon alert-item__icon--${alertIconClass[type] || 'deliverable'}`}>
                  <AssetIcon src={iconSrc} size={20} />
                </div>
                <div className="alert-item__content">
                  <p className="alert-item__title">{alert.title}</p>
                  <p className="alert-item__subtitle">{alert.subtitle}</p>
                </div>
                <span className="alert-item__time">{alert.time}</span>
              </div>
            )
          })}
        </div>
      </WidgetBodyGate>
    </Card>
  )
}
