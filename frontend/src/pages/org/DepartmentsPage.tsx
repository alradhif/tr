import { useEffect, useMemo, useState } from 'react'
import { ChevronLeft, Filter, Plus } from 'lucide-react'
import { useLocation, useNavigate, useOutletContext } from 'react-router-dom'
import { ApiError } from '../../api/client'
import { getDepartments, type Department } from '../../api/org'
import { getProjects, type OrgProject } from '../../api/orgProjects'
import type { OrgRole } from '../../auth/orgAuth'
import { getOrgToken } from '../../auth/orgAuth'
import { canCreateDraft } from '../../auth/permissions'
import { FeedbackBanner } from '../../components/ui/FeedbackBanner'
import { averageProgress, formatJoinDate, projectStatusClass, STATUS_META } from './orgEntityUi'
import '../../design/departments.css'

type ListNotice = 'success' | 'deleted' | undefined

function departmentProjects(projects: OrgProject[], departmentId: string) {
  return projects.filter((project) => project.departmentId === departmentId)
}

export function OrgDepartmentsPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { role } = useOutletContext<{ role: OrgRole }>()
  const [departments, setDepartments] = useState<Department[]>([])
  const [projects, setProjects] = useState<OrgProject[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [onlyDelayed, setOnlyDelayed] = useState(false)
  const [notice, setNotice] = useState<ListNotice>(() => (location.state as { notice?: ListNotice } | null)?.notice)

  useEffect(() => {
    if ((location.state as { notice?: ListNotice } | null)?.notice) {
      navigate(location.pathname, { replace: true, state: {} })
    }
  }, [location.pathname, location.state, navigate])

  useEffect(() => {
    const token = getOrgToken()
    if (!token) {
      setLoading(false)
      return
    }
    let cancelled = false
    ;(async () => {
      try {
        const [departmentsRes, projectsRes] = await Promise.all([getDepartments(token), getProjects(token)])
        if (cancelled) return
        setDepartments(departmentsRes.departments)
        setProjects(projectsRes.projects ?? [])
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
  }, [])

  const rows = useMemo(() => {
    return departments.map((department) => {
      const linked = departmentProjects(projects, department.id)
      return {
        department,
        linked,
        progress: averageProgress(linked),
        status: !department.isActive ? 'delay' as const : projectStatusClass(linked[0]?.status),
      }
    })
  }, [departments, projects])

  const visible = onlyDelayed ? rows.filter((row) => !row.department.isActive) : rows

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
          <div className="departments-toolbar departments-toolbar--screenshot-one">
            {canCreateDraft(role) ? (
              <button className="departments-primary" type="button" onClick={() => navigate('/org/departments/new')}>
                <Plus size={19} />
                <span>إضافة إدارة جديدة</span>
              </button>
            ) : null}
            <button
              className="departments-outline"
              type="button"
              onClick={() => setOnlyDelayed((value) => !value)}
            >
              <Filter size={18} />
              <span>تصفية</span>
            </button>
          </div>
        </div>
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
                  <tr key={row.department.id} onClick={() => navigate(`/org/departments/${row.department.id}`)}>
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
                          <i className={`bar-${row.status}`} style={{ width: `${row.progress}%` }} />
                        </span>
                      </div>
                    </td>
                    <td>
                      <span className={`status-pill project-status--${row.status}`}>
                        <b className="status-pill__question">?</b>
                        {STATUS_META[row.status]}
                      </span>
                    </td>
                    <td className="date-cell" dir="ltr">
                      {formatJoinDate(row.department.createdAt)}
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
      </div>
    </div>
  )
}
