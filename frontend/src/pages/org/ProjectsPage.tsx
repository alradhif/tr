import { useEffect, useMemo, useState } from 'react'
import { Plus } from 'lucide-react'
import { message } from 'antd'
import { useTranslation } from 'react-i18next'
import { useNavigate, useOutletContext } from 'react-router-dom'
import { commonAssets, dashboardDataAssets, navigationAssets, projectsAssets } from '@/assets'
import { AssetIcon } from '../../components/ui/AssetIcon'
import { ApiError } from '../../api/client'
import { getProjects } from '../../api/orgProjects'
import type { OrgRole } from '../../auth/orgAuth'
import { getOrgToken } from '../../auth/orgAuth'
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
import { OrgCatalogShell } from '../../org-catalog/OrgCatalogShell'
import { ProgressBar } from '../../org-catalog/ProgressBar'
import { EmptyState } from '../../components/EmptyState'
import { approvalBadgeVariant, approvalLabelKey } from '../../org-catalog/approvalStatus'

type ProjectUiStatus = 'onTrack' | 'delayed' | 'stalled' | 'completed'
type ProjectFilter = 'all' | 'onTrack' | 'delayed' | 'completed' | 'draft' | 'pending' | 'approved' | 'rejected'

type ProjectRow = {
  key: string
  name: string
  company: string
  type?: string | null
  classification?: string | null
  progress: number
  status: string
  approvalStatus: string
  uiStatus: ProjectUiStatus
  startDate: string
  endDate: string
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

function statusVariant(status: ProjectUiStatus): BadgeVariant {
  if (status === 'delayed') return 'warning'
  if (status === 'stalled') return 'danger'
  return 'success'
}

function matchesFilter(row: ProjectRow, filter: ProjectFilter) {
  if (filter === 'all') return true
  if (filter === 'draft') return row.approvalStatus === 'DRAFT'
  if (filter === 'pending') return row.approvalStatus === 'PENDING'
  if (filter === 'approved') return row.approvalStatus === 'APPROVED'
  if (filter === 'rejected') return row.approvalStatus === 'REJECTED'
  if (filter === 'delayed') return row.uiStatus === 'delayed' || row.uiStatus === 'stalled'
  return row.uiStatus === filter
}

export function OrgProjectsPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { role } = useOutletContext<{ role: OrgRole }>()
  const [rows, setRows] = useState<ProjectRow[]>([])
  const [loading, setLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState<ProjectFilter>('all')

  useEffect(() => {
    const token = getOrgToken()
    if (!token) {
      setLoading(false)
      return
    }
    let cancelled = false
    ;(async () => {
      try {
        const { projects } = await getProjects(token)
        if (cancelled) return
        setRows(
          projects.map((p) => ({
            key: p.id,
            name: p.name,
            company: p.executingCompany?.name ?? p.department?.name ?? '—',
            type: p.type,
            classification: p.classification,
            progress: p.progressPct ?? 0,
            status: p.status,
            approvalStatus: p.approvalStatus ?? 'DRAFT',
            uiStatus: mapStatus(p.status, p.endDate),
            startDate: formatDate(p.startDate),
            endDate: formatDate(p.endDate),
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
  const delayedCount = rows.filter((row) => row.uiStatus === 'delayed' || row.uiStatus === 'stalled').length
  const totalOutputs = rows.reduce((sum, row) => sum + row.outputsCount, 0)

  const filterCounts = useMemo(
    () => ({
      all: rows.length,
      onTrack: rows.filter((row) => row.uiStatus === 'onTrack').length,
      delayed: delayedCount,
      completed: rows.filter((row) => row.uiStatus === 'completed').length,
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

  return (
    <OrgCatalogShell title={t('projects')}>
      {canCreateDraft(role) ? (
        <CatalogButton icon={<Plus size={16} strokeWidth={2.5} />} onClick={() => navigate('/org/projects/new')}>
          {role === 'upper' ? t('addProject') : t('addProjectDraft')}
        </CatalogButton>
      ) : null}

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
          const variant = statusVariant(project.uiStatus)
          const typeLabel = project.type || project.classification || project.company
          return (
            <ListCard
              key={project.key}
              title={project.name}
              onOpen={() => navigate(`/org/projects/${project.key}`)}
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
              tags={
                <>
                  {project.company && project.company !== '—' ? (
                    <span className="list-card__tag">
                      <span className="list-card__tag-dot" style={{ background: '#2584df' }} />
                      {project.company}
                    </span>
                  ) : null}
                  {project.classification && project.classification !== project.type ? (
                    <span className="list-card__tag list-card__tag--muted">{project.classification}</span>
                  ) : null}
                </>
              }
            />
          )
        })}
        {loading ? <div className="catalog-loading">{t('loadingList')}</div> : null}
        {filteredRows.length === 0 && !loading ? <EmptyState description={t('noMatchingFilter')} /> : null}
      </ListCardStack>
    </OrgCatalogShell>
  )
}
