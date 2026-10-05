import { useEffect, useMemo, useState } from 'react'
import { Plus } from 'lucide-react'
import { message } from 'antd'
import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'
import { commonAssets, dashboardDataAssets, navigationAssets } from '@/assets'
import { AssetIcon } from '../../components/ui/AssetIcon'
import { ApiError } from '../../api/client'
import { getProjects, type OrgProject } from '../../api/orgProjects'
import {
  createGoalLink,
  deleteGoal,
  getGoalById,
  type GoalLinkedProject,
  type StrategicGoal,
} from '../../api/orgStrategy'
import { getOrgRole, getOrgToken } from '../../auth/orgAuth'
import { canCreateDraft, isUpperManagement } from '../../auth/permissions'
import { Badge, CatalogButton, SubpageHeader, type BadgeVariant } from '../../components/ui'
import { CatalogConfirmDialog } from '../../org-catalog/CatalogConfirmDialog'
import { ProgressBar } from '../../org-catalog/ProgressBar'

const TAG_DOTS = ['#17b26a', '#2e90fa', '#f79009', '#7a5af8']

function formatDate(value?: string | null) {
  if (!value) return '—'
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? String(value) : d.toLocaleDateString()
}

function formatRelative(value?: string | null, fallback = '—') {
  if (!value) return fallback
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return fallback
  return d.toLocaleDateString()
}

function linkedProject(link: { project?: GoalLinkedProject | null }): GoalLinkedProject | null {
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

function riskBucket(value?: string | null): 'high' | 'medium' | 'low' {
  const raw = String(value ?? '').toUpperCase()
  if (raw === 'HIGH' || raw === 'CRITICAL') return 'high'
  if (raw === 'MEDIUM') return 'medium'
  return 'low'
}

export function OrgGoalDetailPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { goalId } = useParams()
  const [goal, setGoal] = useState<StrategicGoal | null>(null)
  const [loading, setLoading] = useState(true)
  const [linkOpen, setLinkOpen] = useState(false)
  const [projects, setProjects] = useState<OrgProject[]>([])
  const [selectedProjectId, setSelectedProjectId] = useState('')
  const [linking, setLinking] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const role = getOrgRole()

  const load = async () => {
    const token = getOrgToken()
    if (!token || !goalId) {
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const { goal: data } = await getGoalById(token, goalId)
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
    () => (goal?.projectLinks ?? []).map(linkedProject).filter((p): p is GoalLinkedProject => Boolean(p)),
    [goal],
  )

  const delayedCount = linked.filter((p) => {
    const ui = mapProjectUiStatus(p.status, p.endDate)
    return ui === 'delayed' || ui === 'stalled'
  }).length

  const avgProgress =
    linked.length === 0
      ? 0
      : Math.round(linked.reduce((sum, p) => sum + (p.progressPct ?? 0), 0) / linked.length)

  const openRisks = useMemo(() => {
    const counts = { high: 0, medium: 0, low: 0 }
    linked.forEach((project) => {
      ;(project.risks ?? []).forEach((risk) => {
        if (String(risk.status ?? '').toUpperCase() === 'CLOSED') return
        counts[riskBucket(risk.impact ?? risk.probability)] += 1
      })
    })
    return counts
  }, [linked])

  const outputs = useMemo(
    () =>
      linked.flatMap((project) =>
        (project.deliverables ?? []).map((item) => ({
          ...item,
          projectName: project.name,
        })),
      ),
    [linked],
  )

  const progress = goal?.achievementPct ?? goal?.progressPct ?? 0
  const remaining = Math.max(0, 100 - progress)
  const progressTone: BadgeVariant = progress >= 70 ? 'success' : progress >= 40 ? 'warning' : 'danger'
  const dateRange = [formatDate(goal?.startDate), formatDate(goal?.endDate)].join(' – ')
  const riskData = [
    { name: t('high'), value: openRisks.high, color: '#F04438' },
    { name: t('medium'), value: openRisks.medium, color: '#F79009' },
    { name: t('low'), value: openRisks.low, color: '#17B26A' },
  ]
  const riskTotal = openRisks.high + openRisks.medium + openRisks.low
  const linkedIds = new Set(linked.map((p) => p.id))
  const availableProjects = projects.filter((p) => !linkedIds.has(p.id))

  async function openLinkModal() {
    const token = getOrgToken()
    if (!token) return
    try {
      const { projects: data } = await getProjects(token)
      setProjects(data)
      setSelectedProjectId('')
      setLinkOpen(true)
    } catch (err) {
      message.error(err instanceof ApiError ? err.message : t('loadError'))
    }
  }

  async function submitLink() {
    const token = getOrgToken()
    if (!token || !goalId || !selectedProjectId) return
    setLinking(true)
    try {
      await createGoalLink(token, goalId, selectedProjectId)
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
        onBack={() => navigate('/org/goals')}
        actions={
          <div className="detail-actions">
            {role && canCreateDraft(role) ? (
              <CatalogButton onClick={() => navigate(`/org/goals/${goalId}/edit`)}>{t('edit')}</CatalogButton>
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
        {!goal && !loading ? (
          <div className="ui-card goals-empty">{t('noDataYet')}</div>
        ) : goal ? (
          <>
            <div className="goals-detail-header">
              <h2 className="goals-detail-header__title">{goal.title}</h2>
              <div className="goals-detail-header__meta">
                <span>
                  {t('lastUpdated')}: {formatRelative(goal.updatedAt ?? goal.createdAt)}
                </span>
                <span className="goals-detail-header__sep">•</span>
                <span className="goals-detail-header__meta-item">
                  {linked.length} {t('linkedProjects')}
                </span>
                <span className="goals-detail-header__sep">•</span>
                <span className="goals-detail-header__meta-item">
                  <AssetIcon src={commonAssets.clock} size={13} />
                  {dateRange}
                </span>
              </div>
              {goal.description ? <p className="goals-detail-header__desc">{goal.description}</p> : null}
            </div>

            <div className="goals-stats-grid">
              <div className="ui-card goals-stat-card">
                <div className="widget-icon-header">
                  <p className="widget-title">{t('linkedProjects')}</p>
                  <span className="widget-icon-badge">
                    <AssetIcon src={navigationAssets.projects} size={16} />
                  </span>
                </div>
                <div className="goals-stat-card__value-row">
                  <span className="widget-stat-value">{linked.length}</span>
                  <span className="goals-stat-card__unit">{t('projectUnit')}</span>
                </div>
              </div>

              <div className="ui-card goals-stat-card">
                <div className="widget-icon-header">
                  <p className="widget-title">{t('delayedProjects')}</p>
                  <span className="widget-icon-badge widget-icon-badge--warning">
                    <AssetIcon src={dashboardDataAssets.suspended} size={16} />
                  </span>
                </div>
                <div className="goals-stat-card__value-row">
                  <span className="widget-stat-value">{delayedCount}</span>
                  <span className="goals-stat-card__unit">{t('projectsUnit')}</span>
                </div>
              </div>

              <div className="ui-card goals-stat-card goals-avg-card">
                <div className="widget-icon-header">
                  <p className="widget-title goals-avg-card__title">{t('avgProgress')}</p>
                  <span className="widget-icon-badge">
                    <AssetIcon src={dashboardDataAssets.active} size={16} />
                  </span>
                </div>
                <div className="goals-avg-card__value-row">
                  <span className="widget-stat-value goals-avg-card__value">{avgProgress}%</span>
                  <Badge variant="success" icon={<span className="tenants-status-dot" />}>
                    {t('onTrack')}
                  </Badge>
                </div>
                <ProgressBar value={avgProgress} tone="success" className="goals-avg-card__bar" />
              </div>

              <div className="ui-card goals-stat-card goals-risks-card">
                <p className="widget-title goals-risks-card__label">{t('openRisks')}</p>
                <div className="goals-risks-card__body">
                  <div className="goals-risks-legend">
                    {riskData.map((item) => (
                      <div key={item.name} className="goals-risks-legend__row">
                        <span className="goals-risks-legend__name" style={{ color: item.color }}>
                          {item.name}
                        </span>
                        <span className="goals-risks-legend__dot" style={{ background: item.color }} />
                        <span className="goals-risks-legend__count">{item.value}</span>
                      </div>
                    ))}
                  </div>
                  <div className="goals-risks-card__donut">
                    {riskTotal > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={riskData}
                            cx="50%"
                            cy="50%"
                            innerRadius={22}
                            outerRadius={34}
                            paddingAngle={2}
                            dataKey="value"
                            stroke="none"
                            startAngle={90}
                            endAngle={-270}
                          >
                            {riskData.map((entry) => (
                              <Cell key={entry.name} fill={entry.color} />
                            ))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>

            <div className="ui-card goals-kpi-card">
              <div className="goals-kpi-card__top">
                <h3 className="goals-kpi-card__title">{t('kpiTitle')}</h3>
                <span className="goals-kpi-card__pill">{t('remainingToGoal', { pct: remaining })}</span>
              </div>
              <div className="goals-kpi-card__value-row">
                <span className="goals-kpi-card__value">
                  100% / <strong className={`goals-kpi-card__value--${progressTone}`}>{progress}%</strong>
                </span>
              </div>
              <ProgressBar value={progress} tone={progressTone} className="goals-kpi-card__bar" />
              <div className="goals-card__tags goals-kpi-card__tags">
                {linked.slice(0, 4).map((project, index) => (
                  <span key={project.id} className="goals-tag">
                    <span className="goals-tag__dot" style={{ background: TAG_DOTS[index % TAG_DOTS.length] }} />
                    {project.name}
                  </span>
                ))}
                {linked.length > 4 ? (
                  <span className="goals-tag goals-tag--muted">
                    + {linked.length - 4} {t('projectsUnit')}
                  </span>
                ) : null}
              </div>
            </div>

            <div className="goals-split">
              <div className="ui-card goals-split-card">
                <div className="goals-split-card__header">
                  <h3 className="goals-split-card__title">{t('projects')}</h3>
                  <button type="button" className="goals-link-btn" onClick={() => void openLinkModal()}>
                    <Plus size={14} strokeWidth={2.5} />
                    {t('linkProject')}
                  </button>
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
                            <span className="goals-row__subtitle">{project.executingCompany?.name ?? '—'}</span>
                          </div>
                          <div className="goals-row__middle">
                            <Badge variant={variant} icon={<span className="tenants-status-dot" />}>
                              {t(
                                ui === 'onTrack'
                                  ? 'onTrack'
                                  : ui === 'delayed'
                                    ? 'delayed'
                                    : ui === 'stalled'
                                      ? 'stalled'
                                      : 'completed',
                              )}
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
                            onClick={() => navigate(`/org/projects/${project.id}`)}
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

              <div className="ui-card goals-split-card">
                <div className="goals-split-card__header">
                  <h3 className="goals-split-card__title">{t('deliverables')}</h3>
                  <span className="goals-count-badge">{outputs.length}</span>
                </div>
                <div className="goals-row-list">
                      {outputs.length === 0 ? (
                        <div className="goals-empty">{t('noOutputsYet')}</div>
                      ) : (
                    outputs.map((output) => (
                      <div key={output.id} className="goals-row">
                        <div className="goals-row__main">
                          <span className="goals-row__title">{output.name}</span>
                          <span className="goals-row__subtitle">{output.projectName}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
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
            <div className="catalog-dialog__actions">
              <CatalogButton disabled={!selectedProjectId || linking} onClick={() => void submitLink()}>
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
          const token = getOrgToken()
          if (!token || !goalId) return
          setDeleting(true)
          try {
            await deleteGoal(token, goalId)
            message.success(t('deletedSuccessfully'))
            navigate('/org/goals')
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
