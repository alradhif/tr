import { useEffect, useMemo, useState } from 'react'
import { ChevronLeft, Plus } from 'lucide-react'
import { useLocation, useNavigate, useOutletContext } from 'react-router-dom'
import { ApiError } from '../../api/client'
import type { Department } from '../../api/org'
import type { OrgProject } from '../../api/orgProjects'
import type { OrgRole } from '../../auth/orgAuth'
import { useDepartmentPortal } from './departmentPortal'
import { canCreateDraft } from '../../auth/permissions'
import { FeedbackBanner } from '../../components/ui/FeedbackBanner'
import { progressColor, RecordCard, RecordCardGrid, StatusBadge, StatusFilterMenu, useViewMode, ViewToggle } from '../../components/ui/RecordCards'
import { aggregateStatus, averageProgress, formatJoinDate, STATUS_DOT, STATUS_META, type StatusClass } from './orgEntityUi'
import '../../design/departments.css'
import '../../design/senior-projects.css'

type DepartmentFilter = 'all' | StatusClass | 'inactive'

type ListNotice = 'success' | 'deleted' | undefined

function departmentProjects(projects: OrgProject[], departmentId: string) {
  return projects.filter((project) => project.departmentId === departmentId)
}

export function OrgDepartmentsPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { role } = useOutletContext<{ role: OrgRole }>()
  const portal = useDepartmentPortal()
  const [departments, setDepartments] = useState<Department[]>([])
  const [projects, setProjects] = useState<OrgProject[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<DepartmentFilter>('all')
  const [view, setView] = useViewMode(`${portal.base}-departments`)
  const [notice, setNotice] = useState<ListNotice>(() => (location.state as { notice?: ListNotice } | null)?.notice)

  useEffect(() => {
    if ((location.state as { notice?: ListNotice } | null)?.notice) {
      navigate(location.pathname, { replace: true, state: {} })
    }
  }, [location.pathname, location.state, navigate])

  useEffect(() => {
    const token = portal.token()
    if (!token) {
      setLoading(false)
      return
    }
    let cancelled = false
    ;(async () => {
      try {
        const [departmentsRes, projectList] = await Promise.all([portal.list(token), portal.projects(token)])
        if (cancelled) return
        setDepartments(departmentsRes.departments)
        setProjects(projectList)
        setError(null)
      } catch (err) {
        if (!cancelled) setError(err instanceof ApiError ? err.message : 'تعذر تحميل الإدارات')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [portal])

  const rows = useMemo(() => {
    return departments.map((department) => {
      const linked = departmentProjects(projects, department.id)
      return {
        department,
        linked,
        progress: averageProgress(linked),
        status: (!department.isActive ? 'delay' : aggregateStatus(linked)) as StatusClass,
      }
    })
  }, [departments, projects])

  const matches = (row: (typeof rows)[number], key: DepartmentFilter) =>
    key === 'all' || (key === 'inactive' ? !row.department.isActive : row.department.isActive && row.status === key)
  const visible = rows.filter((row) => matches(row, filter))

  return (
    <div className="dashboard-page departments-page departments-page--screenshot-one" dir="rtl">
      <div className="departments-shell-title departments-shell-title--reference">
        <h1>الإدارات</h1>
      </div>
      {notice === 'success' ? (
        <FeedbackBanner tone="success" onClose={() => setNotice(undefined)}>
          تم إضافة الإدارة بنجاح
        </FeedbackBanner>
      ) : null}
      {notice === 'deleted' ? (
        <FeedbackBanner tone="success" onClose={() => setNotice(undefined)}>
          تم حذف الإدارة بنجاح
        </FeedbackBanner>
      ) : null}
      {error ? (
        <FeedbackBanner tone="error" onClose={() => setError(null)}>
          {error}
        </FeedbackBanner>
      ) : null}
      <div className="departments-content departments-content--screenshot-one">
        <div className="departments-list-header departments-list-header--screenshot-one">
          <div className="departments-page__heading departments-page__heading--screenshot-one">
            <h2>الإدارات</h2>
          </div>
          <div className="departments-toolbar departments-toolbar--screenshot-one">
            {canCreateDraft(role) ? (
              <button className="departments-primary" type="button" onClick={() => navigate(`${portal.base}/new`)}>
                <Plus size={19} />
                <span>إضافة إدارة جديدة</span>
              </button>
            ) : null}
          </div>
        </div>
        <div className="rc-view-bar">
          <StatusFilterMenu
            title="حالة الإدارة"
            allKey="all"
            value={filter}
            shown={visible.length}
            total={rows.length}
            noun="إدارات"
            onChange={setFilter}
            options={[
              { key: 'all', label: 'الكل', count: rows.length },
              ...(['track', 'delay', 'blocked', 'done'] as const).map((key) => ({
                key,
                label: STATUS_META[key],
                count: rows.filter((row) => matches(row, key)).length,
                dot: STATUS_DOT[key],
              })),
              { key: 'inactive', label: 'غير نشطة', count: rows.filter((row) => matches(row, 'inactive')).length, dot: '#8e8f97' },
            ]}
          />
          <ViewToggle value={view} onChange={setView} />
        </div>
        {view === 'cards' ? (
          <>
            {loading ? <p className="departments-empty">جاري التحميل...</p> : null}
            {!loading && visible.length === 0 ? <p className="departments-empty">لا توجد إدارات حالياً</p> : null}
            <RecordCardGrid>
              {visible.map((row) => (
                <RecordCard
                  key={row.department.id}
                  title={row.department.name}
                  subtitle={row.department.description || '—'}
                  badges={<StatusBadge status={row.status} />}
                  progress={{ label: 'نسبة الإنجاز', value: row.progress }}
                  rows={[
                    { label: 'آخر نشاط', value: <span dir="ltr">{formatJoinDate(row.department.updatedAt ?? row.department.createdAt)}</span> },
                    { label: 'عدد المشاريع', value: row.linked.length },
                    { label: 'القسم', value: row.department.type || '—' },
                    { label: 'مدير الإدارة', value: row.department.managerName || '—' },
                  ]}
                  linkLabel="عرض الإدارة"
                  onOpen={() => navigate(`${portal.base}/${row.department.id}`)}
                />
              ))}
            </RecordCardGrid>
          </>
        ) : (
        <div className="departments-table-wrap departments-table-wrap--screenshot-one">
          <table className="departments-table departments-table--screenshot-one">
            <thead>
              <tr>
                <th>الإدارة</th>
                <th>مدير الإدارة</th>
                <th>القسم</th>
                <th>عدد المشاريع</th>
                <th>نسبة الإنجاز</th>
                <th>الحالة</th>
                <th>آخر نشاط</th>
                <th aria-label="فتح" />
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="departments-empty">
                    جاري التحميل...
                  </td>
                </tr>
              ) : null}
              {!loading &&
                visible.map((row) => (
                  <tr key={row.department.id} onClick={() => navigate(`${portal.base}/${row.department.id}`)}>
                    <td>
                      <strong>{row.department.name}</strong>
                      <small>{row.department.description || '—'}</small>
                    </td>
                    <td>{row.department.managerName || '—'}</td>
                    <td>{row.department.type || '—'}</td>
                    <td className="number-cell">{row.linked.length}</td>
                    <td>
                      <div className="progress-cell progress-cell--screenshot-one">
                        <strong>{row.progress}%</strong>
                        <span>
                          <i style={{ width: `${row.progress}%`, background: progressColor(row.progress) }} />
                        </span>
                      </div>
                    </td>
                    <td>
                      <StatusBadge status={row.status} />
                    </td>
                    <td className="date-cell" dir="ltr">
                      {formatJoinDate(row.department.updatedAt ?? row.department.createdAt)}
                    </td>
                    <td>
                      <ChevronLeft size={23} className="row-chevron" />
                    </td>
                  </tr>
                ))}
              {!loading && visible.length === 0 ? (
                <tr>
                  <td colSpan={8} className="departments-empty">
                    لا توجد إدارات حالياً
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
        )}
      </div>
    </div>
  )
}
