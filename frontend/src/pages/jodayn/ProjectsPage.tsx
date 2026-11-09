import { useEffect, useMemo, useState } from 'react'
import { message } from 'antd'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { ApiError } from '../../api/client'
import { getJodaynProjects, type JodaynProject } from '../../api/jodayn'
import { getJodaynToken } from '../../auth/jodaynAuth'
import { executionFilterOptions, ProjectsListView } from '../../components/senior/ProjectsListView'
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
  ownerType: JodaynProject['ownerType']
  owner: string
  doneOutputs: number
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

/** Read-only list of every organization's and client's projects. */
export function JodaynProjectsPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [rows, setRows] = useState<ProjectRow[]>([])
  const [loading, setLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState<ProjectFilter>('all')
  const [view, setView] = useViewMode('jodayn-projects')
  const [ownerFilter, setOwnerFilter] = useState<string[]>([])
  const [yearFilter, setYearFilter] = useState('all')

  useEffect(() => {
    const token = getJodaynToken()
    if (!token) {
      setLoading(false)
      return
    }
    let cancelled = false
    ;(async () => {
      try {
        const { projects } = await getJodaynProjects(token)
        if (cancelled) return
        setRows(
          projects.map((p) => ({
            key: p.id,
            name: p.name,
            progress: p.progressPct ?? 0,
            approvalStatus: p.approvalStatus ?? 'DRAFT',
            uiStatus: mapStatus(p.status, p.endDate),
            outputsCount: p._count?.deliverables ?? 0,
            ownerType: p.ownerType,
            owner: p.ownerName ?? '—',
            // Organizations count what they approved; clients have no approval step.
            doneOutputs: (p.deliverables ?? []).filter((d) =>
              p.ownerType === 'org' ? d.reviewStatus === 'APPROVED' : String(d.status).toUpperCase() === 'COMPLETED',
            ).length,
            year: (p.startDate ?? '').slice(0, 4),
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
          (ownerFilter.length === 0 || ownerFilter.includes(row.owner)) &&
          (yearFilter === 'all' || row.year === yearFilter),
      ),
    [rows, activeFilter, ownerFilter, yearFilter],
  )

  return (
    <ProjectsListView
      rows={filteredRows.map((row) => ({
        key: row.key,
        name: row.name,
        progress: row.progress,
        status: row.uiStatus,
        approvalStatus: row.approvalStatus,
        approvedOutputs: `${row.doneOutputs} من ${row.outputsCount}`,
        noOutputs: row.outputsCount === 0,
        subtitle: row.owner,
      }))}
      loading={loading}
      totalOutputs={rows.reduce((sum, row) => sum + row.outputsCount, 0)}
      onOpen={(key) => {
        const row = rows.find((item) => item.key === key)
        if (row) navigate(`/jodayn/projects/${row.ownerType}/${row.key}`)
      }}
      exec={{
        view,
        onViewChange: setView,
        outputsLabel: 'المخرجات المنجزة',
        progressLabel: 'نسبة التقدم',
        kpis: [
          { label: 'عدد المشاريع', value: rows.length, delta: `${filterCounts.completed} مكتمل`, up: true },
          {
            label: 'نسبة التقدم',
            value: `${rows.length ? Math.round(rows.reduce((sum, row) => sum + row.progress, 0) / rows.length) : 0}%`,
            delta: `${filterCounts.delayed} متأخر`,
            up: filterCounts.delayed === 0,
          },
          {
            label: 'إجمالي المخرجات',
            value: rows.reduce((sum, row) => sum + row.outputsCount, 0),
            delta: `${rows.reduce((sum, row) => sum + row.doneOutputs, 0)} منجز`,
            up: true,
          },
        ],
        filterBar: (
          <div className="org-projects-filters">
            <MultiSelectFilter
              label="الجهة"
              selected={ownerFilter}
              options={[...new Set(rows.map((row) => row.owner))].map((value) => ({ value, label: value }))}
              onApply={setOwnerFilter}
            />
            <SingleSelectFilter
              label="حالة التنفيذ"
              value={activeFilter}
              options={executionFilterOptions(t, filterCounts)}
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
