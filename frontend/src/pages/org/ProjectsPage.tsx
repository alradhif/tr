import { useEffect, useMemo, useState } from 'react'
import { message } from 'antd'
import { useTranslation } from 'react-i18next'
import { useNavigate, useOutletContext } from 'react-router-dom'
import { ApiError } from '../../api/client'
import { getProjects, type OrgProject } from '../../api/orgProjects'
import type { OrgRole } from '../../auth/orgAuth'
import { getOrgToken } from '../../auth/orgAuth'
import { canCreateDraft } from '../../auth/permissions'
import { ProjectsListView } from '../../components/senior/ProjectsListView'
import { useViewMode } from '../../components/ui/RecordCards'
import { MultiSelectFilter, SingleSelectFilter } from '../../super-admin-ui/components/ui/filters'

type ProjectUiStatus = 'onTrack' | 'delayed' | 'stalled' | 'completed'
type ProjectFilter = 'all' | 'onTrack' | 'delayed' | 'completed' | 'draft' | 'pending' | 'approved' | 'rejected'

type ProjectRow = {
  key: string
  name: string
  progress: number
  approvalStatus: string
  uiStatus: ProjectUiStatus
  outputsCount: number
  approvedCount: number
  approvedOutputs: string
  executor: string
  goals: string[]
  company: string
  year: string
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
  const [view, setView] = useViewMode('org-projects')
  const [goalFilter, setGoalFilter] = useState<string[]>([])
  const [companyFilter, setCompanyFilter] = useState<string[]>([])
  const [yearFilter, setYearFilter] = useState('all')

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
            progress: p.progressPct ?? 0,
            approvalStatus: p.approvalStatus ?? 'DRAFT',
            uiStatus: mapStatus(p.status, p.endDate),
            outputsCount: p._count?.deliverables ?? p.deliverables?.length ?? 0,
            goals: ((p as OrgProject & { goalLinks?: Array<{ goal?: { title: string } }> }).goalLinks ?? [])
              .map((link) => link.goal?.title ?? '')
              .filter(Boolean),
            company: p.executingCompany?.name ?? 'بدون شركة',
            year: (p.startDate ?? '').slice(0, 4),
            approvedCount: (p.deliverables ?? []).filter((d) => (d as { reviewStatus?: string }).reviewStatus === 'APPROVED').length,
            approvedOutputs: `${(p.deliverables ?? []).filter((d) => (d as { reviewStatus?: string }).reviewStatus === 'APPROVED').length} من ${p.deliverables?.length ?? 0}`,
            executor: p.executingCompany?.name ?? 'داخلي',
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

  const filterCounts = useMemo(
    () => ({
      all: rows.length,
      onTrack: rows.filter((row) => row.uiStatus === 'onTrack').length,
      delayed: rows.filter((row) => row.uiStatus === 'delayed' || row.uiStatus === 'stalled').length,
      completed: rows.filter((row) => row.uiStatus === 'completed').length,
      pending: rows.filter((row) => row.approvalStatus === 'PENDING').length,
      draft: rows.filter((row) => row.approvalStatus === 'DRAFT').length,
      rejected: rows.filter((row) => row.approvalStatus === 'REJECTED').length,
    }),
    [rows],
  )

  const filteredRows = useMemo(
    () =>
      rows.filter(
        (row) =>
          matchesFilter(row, activeFilter) &&
          (goalFilter.length === 0 || row.goals.some((goal) => goalFilter.includes(goal))) &&
          (companyFilter.length === 0 || companyFilter.includes(row.company)) &&
          (yearFilter === 'all' || row.year === yearFilter),
      ),
    [rows, activeFilter, goalFilter, companyFilter, yearFilter],
  )

  return (
    <ProjectsListView
      rows={filteredRows.map((row) => ({
        key: row.key,
        name: row.name,
        progress: row.progress,
        status: row.uiStatus,
        approvalStatus: row.approvalStatus,
        approvedOutputs: row.approvedOutputs,
        subtitle: row.executor,
        noOutputs: row.outputsCount === 0,
      }))}
      loading={loading}
      totalOutputs={rows.reduce((sum, row) => sum + row.outputsCount, 0)}
      createLabel={canCreateDraft(role) ? (role === 'upper' ? t('addProject') : t('addProjectDraft')) : undefined}
      onCreate={() => navigate('/org/projects/new')}
      onOpen={(key) => navigate(`/org/projects/${key}`)}
      exec={{
        view,
        onViewChange: setView,
        kpis: [
          { label: 'عدد المشاريع', value: rows.length, delta: `${filterCounts.completed} مكتمل`, up: true },
          {
            label: 'التقدم التنفيذي',
            value: `${rows.length ? Math.round(rows.reduce((sum, row) => sum + row.progress, 0) / rows.length) : 0}%`,
            delta: `${filterCounts.delayed} متأخر`,
            up: filterCounts.delayed === 0,
          },
          {
            label: 'إجمالي المخرجات',
            value: rows.reduce((sum, row) => sum + row.outputsCount, 0),
            delta: `${rows.reduce((sum, row) => sum + row.approvedCount, 0)} معتمد`,
            up: true,
          },
        ],
        filterBar: (
          <div className="org-projects-filters">
            <MultiSelectFilter
              label="الهدف"
              selected={goalFilter}
              options={[...new Set(rows.flatMap((row) => row.goals))].map((value) => ({ value, label: value }))}
              onApply={setGoalFilter}
            />
            <MultiSelectFilter
              label="المنفذ"
              selected={companyFilter}
              options={[...new Set(rows.map((row) => row.company))].map((value) => ({ value, label: value }))}
              onApply={setCompanyFilter}
            />
            <SingleSelectFilter
              label="حالة التنفيذ"
              value={activeFilter}
              options={[
                { value: 'all', label: `${t('all')} (${filterCounts.all})` },
                { value: 'onTrack', label: `${t('onTrack')} (${filterCounts.onTrack})` },
                { value: 'delayed', label: `${t('delayedTab')} (${filterCounts.delayed})` },
                { value: 'completed', label: `${t('completed')} (${filterCounts.completed})` },
                { value: 'pending', label: `${t('approvalStatusPending')} (${filterCounts.pending})` },
                { value: 'draft', label: `${t('approvalStatusDraft')} (${filterCounts.draft})` },
                { value: 'rejected', label: `${t('approvalStatusRejected')} (${filterCounts.rejected})` },
              ]}
              onChange={(key) => setActiveFilter(key as ProjectFilter)}
            />
            <SingleSelectFilter
              label="الفترة"
              value={yearFilter}
              options={[
                { value: 'all', label: 'الكل' },
                ...[...new Set(rows.map((row) => row.year).filter(Boolean))].sort().map((value) => ({ value, label: value })),
              ]}
              onChange={setYearFilter}
            />
          </div>
        ),
      }}
      filtersOpen={false}
      onToggleFilters={() => undefined}
      activeFilter={activeFilter}
      onFilterChange={(key) => setActiveFilter(key as ProjectFilter)}
      filters={[{ key: 'all', label: t('all'), count: filterCounts.all }]}
    />
  )
}
