import { useEffect, useMemo, useState } from 'react'
import { message } from 'antd'
import { useTranslation } from 'react-i18next'
import { ApiError } from '../../api/client'
import { getJodaynProjects, type JodaynProject } from '../../api/jodayn'
import { getJodaynToken } from '../../auth/jodaynAuth'
import { FinanceDetails, formatAmount, formatDate } from '../../features/jodayn-finance/FinanceParts'
import { ProjectsListView } from '../../components/senior/ProjectsListView'

type ProjectUiStatus = 'onTrack' | 'delayed' | 'stalled' | 'completed'
type ProjectFilter = 'all' | 'onTrack' | 'delayed' | 'completed' | 'draft' | 'pending' | 'approved' | 'rejected'

type ProjectRow = {
  key: string
  name: string
  progress: number
  approvalStatus: string
  uiStatus: ProjectUiStatus
  outputsCount: number
  source: JodaynProject
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
  const [rows, setRows] = useState<ProjectRow[]>([])
  const [loading, setLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState<ProjectFilter>('all')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [opened, setOpened] = useState<ProjectRow | null>(null)

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
            source: p,
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
    () => rows.filter((row) => matchesFilter(row, activeFilter)),
    [rows, activeFilter],
  )

  return (
    <>
      <ProjectsListView
        rows={filteredRows.map((row) => ({
          key: row.key,
          name: row.name,
          progress: row.progress,
          status: row.uiStatus,
          approvalStatus: row.approvalStatus,
        }))}
        loading={loading}
        totalOutputs={rows.reduce((sum, row) => sum + row.outputsCount, 0)}
        onOpen={(key) => setOpened(rows.find((row) => row.key === key) ?? null)}
        filtersOpen={filtersOpen}
        onToggleFilters={() => setFiltersOpen((open) => !open)}
        activeFilter={activeFilter}
        onFilterChange={(key) => setActiveFilter(key as ProjectFilter)}
        filters={[
          { key: 'all', label: t('all'), count: filterCounts.all },
          { key: 'onTrack', label: t('onTrack'), count: filterCounts.onTrack },
          { key: 'delayed', label: t('delayedTab'), count: filterCounts.delayed },
          { key: 'completed', label: t('completed'), count: filterCounts.completed },
          { key: 'pending', label: t('approvalStatusPending'), count: filterCounts.pending },
          { key: 'draft', label: t('approvalStatusDraft'), count: filterCounts.draft },
          { key: 'rejected', label: t('approvalStatusRejected'), count: filterCounts.rejected },
        ]}
      />
      {opened ? (
        <FinanceDetails
          title={opened.name}
          onClose={() => setOpened(null)}
          fields={[
            { label: 'الجهة', value: opened.source.ownerName ?? '—' },
            { label: 'نوع الحساب', value: opened.source.ownerType === 'client' ? 'عميل' : 'جهة' },
            { label: t('progress'), value: `${opened.progress}%` },
            { label: 'الميزانية', value: `${formatAmount(opened.source.budget)} ريال` },
            { label: 'تاريخ البدء', value: formatDate(opened.source.startDate) },
            { label: 'تاريخ الانتهاء', value: formatDate(opened.source.endDate) },
            { label: 'المخرجات', value: opened.outputsCount },
          ]}
        />
      ) : null}
    </>
  )
}
