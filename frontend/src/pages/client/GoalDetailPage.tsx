import { useEffect, useMemo, useState } from 'react'
import { Plus } from 'lucide-react'
import { message } from 'antd'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'
import { commonAssets } from '@/assets'
import { AssetIcon } from '../../components/ui/AssetIcon'
import { ApiError } from '../../api/client'
import { getClientProjects, type ClientProject } from '../../api/clientPortal'
import {
  createClientGoalLink,
  deleteClientGoal,
  getClientGoalById,
  type ClientGoalLinkedProject,
  type ClientStrategicGoal,
} from '../../api/clientStrategy'
import { getClientRole, getClientToken } from '../../auth/clientAuth'
import { canCreateDraft, isUpperManagement } from '../../auth/permissions'
import { Badge, CatalogButton, SubpageHeader, type BadgeVariant } from '../../components/ui'
import { ProgressBar } from '../../org-catalog/ProgressBar'
import { CatalogConfirmDialog } from '../../org-catalog/CatalogConfirmDialog'

function formatDate(value?: string | null) {
  if (!value) return '—'
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? String(value) : d.toLocaleDateString()
}

function linkedProject(link: { project?: ClientGoalLinkedProject | null }): ClientGoalLinkedProject | null {
  return link.project ?? null
}

function mapProjectUiStatus(status?: string | null, endDate?: string | null): 'onTrack' | 'delayed' | 'stalled' | 'completed' {
  const raw = String(status ?? '').toUpperCase()
  if (raw === 'COMPLETED') return 'completed'
  if (raw === 'ON_HOLD' || raw === 'CANCELLED') return 'stalled'
  if (endDate) {
    const end = new Date(endDate)
    if (!Number.isNaN(end.getTime()) && end < new Date() && raw === 'ACTIVE') return 'delayed'
  }
  return 'onTrack'
}

function statusVariant(status: 'onTrack' | 'delayed' | 'stalled' | 'completed'): BadgeVariant {
  if (status === 'delayed') return 'warning'
  if (status === 'stalled') return 'danger'
  return 'success'
}

export function ClientGoalDetailPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { goalId } = useParams()
  const [goal, setGoal] = useState<ClientStrategicGoal | null>(null)
  const [loading, setLoading] = useState(true)
  const [linkOpen, setLinkOpen] = useState(false)
  const [projects, setProjects] = useState<ClientProject[]>([])
  const [projectsError, setProjectsError] = useState(false)
  const [selectedProjectId, setSelectedProjectId] = useState('')
  const [linking, setLinking] = useState(false)
  const role = getClientRole()
  const canLink = Boolean(role && canCreateDraft(role))
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const load = async () => {
    const token = getClientToken()
    if (!token || !goalId) {
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const { goal: data } = await getClientGoalById(token, goalId)
      setGoal(data)
    } catch (err) {
      message.error(err instanceof ApiError ? err.message : t('loadError'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [goalId, t])

  const linked = useMemo(
    () => (goal?.projectLinks ?? []).map(linkedProject).filter((p): p is ClientGoalLinkedProject => Boolean(p)),
    [goal],
  )

  const linkedIds = new Set(linked.map((p) => p.id))
  const availableProjects = projects.filter((p) => !linkedIds.has(p.id))

  async function openLinkModal() {
    const token = getClientToken()
    if (!token) return
    try {
      const { projects: data } = await getClientProjects(token)
      setProjects(data ?? [])
      setProjectsError(false)
      setSelectedProjectId('')
      setLinkOpen(true)
    } catch (err) {
      setProjectsError(true)
      setProjects([])
      message.error(err instanceof ApiError ? err.message : t('loadError'))
    }
  }

  async function submitLink() {
    const token = getClientToken()
    if (!token || !goalId || !selectedProjectId) return
    setLinking(true)
    try {
      await createClientGoalLink(token, goalId, selectedProjectId)
      message.success(t('linkProject'))
      setLinkOpen(false)
      await load()
    } catch (err) {
      message.error(err instanceof ApiError ? err.message : t('loadError'))
    } finally {
      setLinking(false)
    }
  }

  return (
    <div className="dashboard-page">
      <SubpageHeader
        parent={t('strategicGoals')}
        title={goal?.title ?? t('strategicGoals')}
        onBack={() => navigate('/client/goals')}
        actions={
          <div className="detail-actions">
            {canLink ? (
              <CatalogButton onClick={() => navigate(`/client/goals/${goalId}/edit`)}>{t('edit')}</CatalogButton>
            ) : null}
            {role && isUpperManagement(role) ? (
              <CatalogButton variant="danger" onClick={() => setConfirmDelete(true)}>
                {t('delete')}
              </CatalogButton>
            ) : null}
          </div>
        }
      />

      <div className="tenants-body" dir="rtl">
        {loading ? <div className="catalog-loading">{t('loadingList')}</div> : null}
        {!goal && !loading ? <div className="ui-card goals-empty">{t('noDataYet')}</div> : null}
        {goal ? (
          <>
            <div className="goals-detail-header">
              <h2 className="goals-detail-header__title">{goal.title}</h2>
              <div className="goals-detail-header__meta">
                <span className="goals-detail-header__meta-item">
                  {linked.length} {t('linkedProjects')}
                </span>
                <span className="goals-detail-header__sep">•</span>
                <span className="goals-detail-header__meta-item">
                  <AssetIcon src={commonAssets.clock} size={13} />
                  {[formatDate(goal.startDate), formatDate(goal.endDate)].join(' – ')}
                </span>
              </div>
              {goal.description ? <p className="goals-detail-header__desc">{goal.description}</p> : null}
            </div>

            <div className="ui-card goals-split-card">
              <div className="goals-split-card__header">
                <h3 className="goals-split-card__title">{t('projects')}</h3>
                {canLink ? (
                  <button type="button" className="goals-link-btn" onClick={() => void openLinkModal()}>
                    <Plus size={14} strokeWidth={2.5} />
                    {t('linkProject')}
                  </button>
                ) : null}
              </div>
              <div className="goals-row-list">
                {linked.length === 0 ? (
                  <div className="goals-empty">{t('noLinkedProjectsYet')}</div>
                ) : (
                  linked.map((project) => {
                    const ui = mapProjectUiStatus(project.status, project.endDate)
                    const variant = statusVariant(ui)
                    return (
                      <div key={project.id} className="goals-row">
                        <div className="goals-row__main">
                          <span className="goals-row__title">{project.name}</span>
                        </div>
                        <div className="goals-row__middle">
                          <Badge variant={variant} icon={<span className="tenants-status-dot" />}>
                            {t(ui)}
                          </Badge>
                          <ProgressBar
                            value={project.progressPct ?? 0}
                            tone={variant}
                            className="goals-row__bar"
                          />
                          <span className="goals-row__pct">{project.progressPct ?? 0}%</span>
                        </div>
                        <button
                          type="button"
                          className="tenants-table__nav-btn"
                          onClick={() => navigate(`/client/projects/${project.id}`)}
                          aria-label={project.name}
                        >
                          <AssetIcon src={commonAssets.chevronLeft} size={14} />
                        </button>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          </>
        ) : null}
      </div>

      {linkOpen ? (
        <div
          className="catalog-dialog-backdrop"
          role="dialog"
          aria-modal="true"
          onClick={(event) => {
            if (event.target === event.currentTarget) setLinkOpen(false)
          }}
        >
          <div className="catalog-dialog">
            <h2>{t('linkProject')}</h2>
            <hr />
            {projectsError ? (
              <p className="goals-empty">{t('loadError')}</p>
            ) : availableProjects.length === 0 ? (
              <p className="goals-empty">{t('noProjectsAvailableToLink')}</p>
            ) : (
              <label className="catalog-field">
                <span>{t('chooseProject')}</span>
                <select value={selectedProjectId} onChange={(event) => setSelectedProjectId(event.target.value)}>
                  <option value="">{t('chooseProject')}</option>
                  {availableProjects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <div className="catalog-dialog__actions">
              <CatalogButton
                disabled={!selectedProjectId || linking || projectsError || availableProjects.length === 0}
                onClick={() => void submitLink()}
              >
                {t('linkProject')}
              </CatalogButton>
              <CatalogButton variant="outline" onClick={() => setLinkOpen(false)}>
                {t('cancel')}
              </CatalogButton>
            </div>
          </div>
        </div>
      ) : null}
      <CatalogConfirmDialog
        open={confirmDelete}
        title={t('delete')}
        message={t('confirmDeleteGoal')}
        confirmLabel={t('delete')}
        cancelLabel={t('cancel')}
        loading={deleting}
        onConfirm={async () => {
          const token = getClientToken()
          if (!token || !goalId) return
          setDeleting(true)
          try {
            await deleteClientGoal(token, goalId)
            message.success(t('deletedSuccessfully'))
            navigate('/client/goals')
          } catch (err) {
            message.error(err instanceof ApiError ? err.message : t('loadError'))
          } finally {
            setDeleting(false)
            setConfirmDelete(false)
          }
        }}
        onCancel={() => setConfirmDelete(false)}
      />
    </div>
  )
}
