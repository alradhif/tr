import { useEffect, useMemo, useState } from 'react'
import { Plus } from 'lucide-react'
import { message } from 'antd'
import { useTranslation } from 'react-i18next'
import { useNavigate, useOutletContext } from 'react-router-dom'
import { commonAssets, dashboardDataAssets, navigationAssets, projectsAssets } from '@/assets'
import { AssetIcon } from '../../components/ui/AssetIcon'
import { ApiError } from '../../api/client'
import { getClientProjects } from '../../api/clientPortal'
import type { ClientRole } from '../../auth/clientAuth'
import { getClientToken } from '../../auth/clientAuth'
import { canCreateDraft } from '../../auth/permissions'
import {
  Badge,
  CatalogButton,
  FilterChips,
  ListCard,
  ListCardStack,
  StatCard,
  StatGrid,
  type BadgeVariant,
} from '../../components/ui'
import { EmptyState } from '../../components/EmptyState'
import { OrgCatalogShell } from '../../org-catalog/OrgCatalogShell'
import { ProgressBar } from '../../org-catalog/ProgressBar'
import { PptGeneratorFrame } from '../../features/portal'

import { approvalBadgeVariant, approvalLabelKey } from '../../org-catalog/approvalStatus'

type ProjectUiStatus = 'onTrack' | 'delayed' | 'stalled' | 'completed'
type ProjectFilter = 'all' | 'onTrack' | 'delayed' | 'completed' | 'draft' | 'pending' | 'approved' | 'rejected'
type ViewMode = 'list' | 'ppt'

type ProjectRow = {
  key: string
  name: string
  progress: number
  budget: number
  status: ProjectUiStatus
  approvalStatus: string
  rawStatus: string
  startDate: string
  endDate: string
  type?: string | null
  classification?: string | null
  outputsCount: number
}

function formatDate(value?: string | null) {
  if (!value) return '—'
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? String(value) : d.toLocaleDateString()
}

function mapStatus(raw: string, endDate?: string | null): ProjectUiStatus {
  const status = raw.toUpperCase()
  if (status === 'COMPLETED') return 'completed'
  if (status === 'ON_HOLD' || status === 'CANCELLED') return 'stalled'
  if (endDate) {
    const end = new Date(endDate)
    if (!Number.isNaN(end.getTime()) && end < new Date() && status === 'ACTIVE') return 'delayed'
  }
  return 'onTrack'
}

function matchesFilter(row: ProjectRow, filter: ProjectFilter) {
  if (filter === 'all') return true
  if (filter === 'draft') return row.approvalStatus === 'DRAFT'
  if (filter === 'pending') return row.approvalStatus === 'PENDING'
  if (filter === 'approved') return row.approvalStatus === 'APPROVED'
  if (filter === 'rejected') return row.approvalStatus === 'REJECTED'
  if (filter === 'delayed') return row.status === 'delayed' || row.status === 'stalled'
  return row.status === filter
}

function statusVariant(status: ProjectUiStatus): BadgeVariant {
  if (status === 'delayed') return 'warning'
  if (status === 'stalled') return 'danger'
  return 'success'
}

export function ClientProjectsPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { role } = useOutletContext<{ role: ClientRole }>()
  const [view, setView] = useState<ViewMode>('list')
  const [rows, setRows] = useState<ProjectRow[]>([])
  const [loading, setLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState<ProjectFilter>('all')

  useEffect(() => {
    const token = getClientToken()
    if (!token) {
      setLoading(false)
      return
    }
    let cancelled = false
    ;(async () => {
      try {
        const { projects } = await getClientProjects(token)
        if (cancelled) return
        setRows(
          projects.map((p) => ({
            key: p.id,
            name: p.name,
            progress: p.progressPct ?? 0,
            budget: Number(p.budget ?? 0),
            status: mapStatus(p.status, p.endDate),
            approvalStatus: p.approvalStatus ?? 'DRAFT',
            rawStatus: p.status,
            startDate: formatDate(p.startDate),
            endDate: formatDate(p.endDate),
            type: p.type,
            classification: p.classification,
            outputsCount: p._count?.deliverables ?? p.deliverables?.length ?? 0,
          })),
        )
      } catch (err) {
        if (!cancelled) {
          message.error(err instanceof ApiError ? err.message : t('loadError'))
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [t])

  const avgProgress =
    rows.length === 0 ? 0 : Math.round(rows.reduce((sum, row) => sum + row.progress, 0) / rows.length)
  const delayedCount = rows.filter((row) => row.status === 'delayed' || row.status === 'stalled').length
  const totalOutputs = rows.reduce((sum, row) => sum + row.outputsCount, 0)

  const filterCounts = useMemo(
    () => ({
      all: rows.length,
      onTrack: rows.filter((row) => row.status === 'onTrack').length,
      delayed: delayedCount,
      completed: rows.filter((row) => row.status === 'completed').length,
      pending: rows.filter((row) => row.approvalStatus === 'PENDING').length,
      draft: rows.filter((row) => row.approvalStatus === 'DRAFT').length,
      rejected: rows.filter((row) => row.approvalStatus === 'REJECTED').length,
    }),
    [rows, delayedCount],
  )

  const filteredRows = useMemo(
    () => rows.filter((row) => matchesFilter(row, activeFilter)),
    [rows, activeFilter],
  )

  const first = filteredRows[0] ?? rows[0]

  return (
    <OrgCatalogShell title={t('projects')}>
      {canCreateDraft(role) ? (
        <CatalogButton icon={<Plus size={16} strokeWidth={2.5} />} onClick={() => navigate('/client/projects/new')}>
          {role === 'upper' ? t('addProject') : t('addProjectDraft')}
        </CatalogButton>
      ) : null}

      <div className="catalog-view-switch">
        <button type="button" className={view === 'list' ? 'is-active' : ''} onClick={() => setView('list')}>
          {t('listTab')}
        </button>
        <button type="button" className={view === 'ppt' ? 'is-active' : ''} onClick={() => setView('ppt')}>
          {t('pptGeneratorTab')}
        </button>
      </div>

      {view === 'ppt' ? (
        <section className="catalog-card">
          <PptGeneratorFrame
            title="مولّد العروض التقديمية - المشاريع"
            data={
              first
                ? {
                    project: {
                      name: first.name,
                      code: first.key.slice(0, 8).toUpperCase(),
                      department: 'مشاريع العميل',
                      endDate: first.endDate,
                      statusLabel: first.rawStatus,
                      progress: first.progress,
                      ...(Number.isFinite(first.budget)
                        ? { budget: first.budget, budgetCurrency: 'SAR' as const }
                        : {}),
                    },
                    outputs: rows.slice(0, 4).map((r) => r.name),
                    sourceLabel: `بيانات حية — ${rows.length} مشروع`,
                  }
                : null
            }
          />
        </section>
      ) : (
        <>
          <StatGrid>
            <StatCard
              label={t('projectsCount')}
              value={rows.length}
              suffix={t('projectUnit')}
              icon={<AssetIcon src={navigationAssets.projects} size={16} />}
            />
            <StatCard
              label={t('avgProgressShort')}
              value={`${avgProgress}%`}
              icon={<AssetIcon src={dashboardDataAssets.active} size={16} />}
              badge={
                <Badge variant="success" icon={<span className="tenants-status-dot" />}>
                  {t('onTrack')}
                </Badge>
              }
            >
              <ProgressBar value={avgProgress} tone="success" className="goals-stat-card__bar" />
            </StatCard>
            <StatCard
              label={t('outputsCount')}
              value={totalOutputs}
              suffix={t('outputUnit')}
              icon={<AssetIcon src={projectsAssets.deliverables} size={16} />}
            />
            <StatCard
              label={t('delayedProjects')}
              value={delayedCount}
              suffix={t('projectUnit')}
              tone="warn"
              icon={<AssetIcon src={projectsAssets.risks} size={16} />}
            />
          </StatGrid>

          <FilterChips
            value={activeFilter}
            onChange={(key) => setActiveFilter(key as ProjectFilter)}
            items={[
              { key: 'all', label: t('all'), count: filterCounts.all },
              { key: 'onTrack', label: t('onTrack'), count: filterCounts.onTrack },
              { key: 'delayed', label: t('delayedTab'), count: filterCounts.delayed },
              { key: 'completed', label: t('completed'), count: filterCounts.completed },
              { key: 'pending', label: t('approvalStatusPending'), count: filterCounts.pending },
              { key: 'draft', label: t('approvalStatusDraft'), count: filterCounts.draft },
              { key: 'rejected', label: t('approvalStatusRejected'), count: filterCounts.rejected },
            ]}
          />

          <ListCardStack>
            {filteredRows.map((project) => {
              const variant = statusVariant(project.status)
              const typeLabel = project.type || project.classification
              return (
                <ListCard
                  key={project.key}
                  title={project.name}
                  onOpen={() => navigate(`/client/projects/${project.key}`)}
                  badge={
                    <Badge variant={approvalBadgeVariant(project.approvalStatus)}>
                      {t(approvalLabelKey(project.approvalStatus))}
                    </Badge>
                  }
                  metaItems={[
                    typeLabel,
                    <>
                      <AssetIcon src={commonAssets.clock} size={13} />
                      {project.startDate} – {project.endDate}
                    </>,
                  ]}
                  progress={{ value: project.progress, tone: variant, label: t('progressRate') }}
                />
              )
            })}
            {loading ? <div className="catalog-loading">{t('loadingList')}</div> : null}
            {filteredRows.length === 0 && !loading ? <EmptyState description={t('noMatchingFilter')} /> : null}
          </ListCardStack>
        </>
      )}
    </OrgCatalogShell>
  )
}
