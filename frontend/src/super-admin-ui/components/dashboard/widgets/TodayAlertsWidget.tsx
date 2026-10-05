import { useState, type ReactNode } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Check, X } from 'lucide-react'
import { message } from 'antd'
import { useTranslation } from 'react-i18next'
import { commonAssets, dashboardAssets } from '@/assets'
import { AssetIcon } from '../../../../components/ui/AssetIcon'
import { Card } from '../../ui/Card'
import { useDashboardRefresh, useLiveField } from '../../../../features/portal/DashboardLiveContext'
import { WidgetBodyGate } from '../../../../features/portal/WidgetBodyGate'
import { ApiError } from '../../../../api/client'
import { approveProject, rejectProject } from '../../../../api/orgProjects'
import { approveClientProject, rejectClientProject } from '../../../../api/clientPortal'
import { getOrgToken } from '../../../../auth/orgAuth'
import { getClientToken } from '../../../../auth/clientAuth'
import { CatalogConfirmDialog } from '../../../../org-catalog/CatalogConfirmDialog'

function ApprovalIcon({ size = 20 }: { size?: number }) {
  return <AssetIcon src={dashboardAssets.approval} size={size} />
}

function DeliverableClockIcon({ size = 20 }: { size?: number }) {
  return <AssetIcon src={commonAssets.clock1} size={size} />
}

function RiskIcon({ size = 20 }: { size?: number }) {
  return <AssetIcon src={dashboardAssets.risk} size={size} />
}

type AlertType = 'deliverable' | 'risk' | 'approval'

type AlertIconComponent = (props: { size?: number }) => ReactNode

const alertIcons: Record<AlertType, AlertIconComponent> = {
  deliverable: DeliverableClockIcon,
  risk: RiskIcon,
  approval: ApprovalIcon,
}

export function TodayAlertsWidget() {
  const { t } = useTranslation()
  const live = useLiveField('todayAlerts')
  const pendingApprovals = useLiveField('pendingProjectApprovals')
  const refresh = useDashboardRefresh()
  const todayAlerts = live ?? []
  const navigate = useNavigate()
  const location = useLocation()
  const isClientPortal = location.pathname.startsWith('/client')
  const count =
    typeof pendingApprovals === 'number' && pendingApprovals > 0
      ? pendingApprovals
      : todayAlerts.length
  const [rejectId, setRejectId] = useState<string | null>(null)
  const [reason, setReason] = useState('')
  const [working, setWorking] = useState(false)

  const portalToken = () => (isClientPortal ? getClientToken() : getOrgToken())

  const runApprove = async (projectId: string) => {
    const token = portalToken()
    if (!token) return
    setWorking(true)
    try {
      if (isClientPortal) await approveClientProject(token, projectId)
      else await approveProject(token, projectId)
      message.success(t('projectApproved'))
      refresh()
    } catch (err) {
      message.error(err instanceof ApiError ? err.message : t('loadError'))
    } finally {
      setWorking(false)
    }
  }

  const runReject = async () => {
    const token = portalToken()
    if (!token || !rejectId) return
    if (!reason.trim()) {
      message.error(t('rejectionReasonRequired'))
      return
    }
    setWorking(true)
    try {
      if (isClientPortal) await rejectClientProject(token, rejectId, reason.trim())
      else await rejectProject(token, rejectId, reason.trim())
      message.success(t('projectRejected'))
      setRejectId(null)
      setReason('')
      refresh()
    } catch (err) {
      message.error(err instanceof ApiError ? err.message : t('loadError'))
    } finally {
      setWorking(false)
    }
  }

  return (
    <Card className="widget-today-alerts">
      <div className="widget-today-alerts__header">
        <div className="widget-icon-header">
          <h3 className="widget-header__title">تنبيهات اليوم</h3>
        </div>
        <span className="widget-today-alerts__count" aria-label={`${count} تنبيهات`}>
          {count}
        </span>
      </div>
      <WidgetBodyGate isEmpty={todayAlerts.length === 0}>
      <div className="alert-list">
        {todayAlerts.map((alert) => {
          const Icon = alertIcons[alert.type as AlertType] || DeliverableClockIcon
          const extra = alert as typeof alert & {
            canDecide?: boolean
            projectId?: string
            href?: string
            submittedBy?: string
          }
          const canDecide = Boolean(extra.canDecide) && Boolean(extra.projectId)
          const href = extra.href
          const submittedBy = extra.submittedBy
          if (!canDecide) {
            return (
              <div key={alert.id} className="alert-item">
                <div className={`alert-item__icon alert-item__icon--${alert.type}`}>
                  <Icon size={20} />
                </div>
                <div className="alert-item__content">
                  <p className="alert-item__title">{alert.title}</p>
                  <p className="alert-item__subtitle">{alert.subtitle}</p>
                </div>
                <span className="alert-item__time">{alert.time}</span>
              </div>
            )
          }

          return (
            <div key={alert.id} className="alert-item alert-item--decision">
              <div className="alert-item__row">
                <div className={`alert-item__icon alert-item__icon--${alert.type}`}>
                  <Icon size={20} />
                </div>
                <div className="alert-item__content">
                  <div className="alert-item__head">
                    <p className="alert-item__title">{alert.title}</p>
                    <span className="alert-item__time">{alert.time}</span>
                  </div>
                  <div className="alert-item__meta-row">
                    <span className="alert-item__chip">{t('approvalStatusPending')}</span>
                    {submittedBy ? (
                      <p className="alert-item__meta">{t('submittedByLine', { name: submittedBy })}</p>
                    ) : null}
                  </div>
                </div>
              </div>
              <div className="alert-item__actions">
                {href ? (
                  <button
                    type="button"
                    className="alert-action alert-action--ghost"
                    disabled={working}
                    onClick={() => navigate(href)}
                  >
                    {t('viewDetails')}
                  </button>
                ) : (
                  <span />
                )}
                <div className="alert-item__decide">
                  <button
                    type="button"
                    className="alert-action alert-action--approve"
                    disabled={working}
                    onClick={() => void runApprove(String(extra.projectId))}
                  >
                    <Check size={14} strokeWidth={2.5} />
                    {t('approve')}
                  </button>
                  <button
                    type="button"
                    className="alert-action alert-action--reject"
                    disabled={working}
                    onClick={() => {
                      setReason('')
                      setRejectId(String(extra.projectId))
                    }}
                  >
                    <X size={14} strokeWidth={2.5} />
                    {t('reject')}
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>
      </WidgetBodyGate>
      <CatalogConfirmDialog
        open={Boolean(rejectId)}
        title={t('reject')}
        message={t('rejectProjectConfirm')}
        confirmLabel={t('confirmReject')}
        cancelLabel={t('cancel')}
        icon={<X size={22} />}
        loading={working}
        promptLabel={t('rejectionReason')}
        promptPlaceholder={t('rejectionReasonPlaceholder')}
        promptValue={reason}
        onPromptChange={setReason}
        onConfirm={() => void runReject()}
        onCancel={() => {
          setRejectId(null)
          setReason('')
        }}
      />
    </Card>
  )
}
