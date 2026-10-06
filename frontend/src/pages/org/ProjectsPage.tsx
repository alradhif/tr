import { useEffect, useMemo, useState } from 'react'
import { message } from 'antd'
import { useTranslation } from 'react-i18next'
import { useNavigate, useOutletContext } from 'react-router-dom'
import { ApiError } from '../../api/client'
import { getProjects } from '../../api/orgProjects'
import type { OrgRole } from '../../auth/orgAuth'
import { getOrgToken } from '../../auth/orgAuth'
import { canCreateDraft } from '../../auth/permissions'
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
  const [filtersOpen, setFiltersOpen] = useState(false)

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
      createLabel={canCreateDraft(role) ? (role === 'upper' ? t('addProject') : t('addProjectDraft')) : undefined}
      onCreate={() => navigate('/org/projects/new')}
      onOpen={(key) => navigate(`/org/projects/${key}`)}
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
  )
}
