import { useEffect, useMemo, useState } from 'react'
import { ChevronLeft, Plus } from 'lucide-react'
import { useLocation, useNavigate, useOutletContext } from 'react-router-dom'
import { CompanyMark } from '../../components/ui/CompanyLogoPicker'
import { ApiError } from '../../api/client'
import { getCompanies, type ExecutingCompany } from '../../api/org'
import { getProjects, type OrgProject } from '../../api/orgProjects'
import type { OrgRole } from '../../auth/orgAuth'
import { getOrgToken } from '../../auth/orgAuth'
import { canCreateDraft } from '../../auth/permissions'
import { FeedbackBanner } from '../../components/ui/FeedbackBanner'
import { progressColor, RecordCard, RecordCardGrid, StatusBadge, StatusFilterMenu, useViewMode, ViewToggle } from '../../components/ui/RecordCards'
import { aggregateStatus, averageProgress, contractCount, STATUS_DOT, STATUS_META, type StatusClass } from './orgEntityUi'
import '../../design/senior-companies.css'

type ListNotice = 'success' | 'error' | 'deleted' | undefined
type CompanyFilter = 'all' | StatusClass | 'inactive'

function companyProjects(projects: OrgProject[], companyId: string) {
  return projects.filter((project) => project.executingCompanyId === companyId)
}

export function OrgCompaniesPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { role } = useOutletContext<{ role: OrgRole }>()
  const [companies, setCompanies] = useState<ExecutingCompany[]>([])
  const [projects, setProjects] = useState<OrgProject[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<CompanyFilter>('all')
  const [view, setView] = useViewMode('org-companies')
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
        const [companiesRes, projectsRes] = await Promise.all([getCompanies(token), getProjects(token)])
        if (cancelled) return
        setCompanies(companiesRes.companies)
        setProjects(projectsRes.projects ?? [])
        setError(null)
      } catch (err) {
        if (!cancelled) setError(err instanceof ApiError ? err.message : 'تعذر تحميل الشركات')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const rows = useMemo(() => {
    return companies.map((company) => {
      const linked = companyProjects(projects, company.id)
      const progress = averageProgress(linked)
      const contracts = linked.reduce((sum, project) => sum + contractCount(project), 0)
      const status: StatusClass = !company.isActive ? 'delay' : aggregateStatus(linked)
      return { company, linked, progress, contracts, status }
    })
  }, [companies, projects])

  const matches = (row: (typeof rows)[number], key: CompanyFilter) =>
    key === 'all' || (key === 'inactive' ? !row.company.isActive : row.company.isActive && row.status === key)
  const visible = rows.filter((row) => matches(row, filter))
  const openCompany = (id: string) => navigate(`/org/companies/${id}`)

  return (
    <div className="dashboard-page sc-page" dir="rtl">
      <div className="sc-shell-title">
        <h1>الشركات</h1>
      </div>

      {notice === 'success' ? (
        <FeedbackBanner tone="success" onClose={() => setNotice(undefined)}>
          تم إضافة الشركة بنجاح
        </FeedbackBanner>
      ) : null}
      {notice === 'deleted' ? (
        <FeedbackBanner tone="success" onClose={() => setNotice(undefined)}>
          تم حذف الشركة بنجاح
        </FeedbackBanner>
      ) : null}
      {notice === 'error' || error ? (
        <FeedbackBanner tone="error" onClose={() => { setNotice(undefined); setError(null) }}>
          {error || 'حدث خطأ ما ، يرجى المحاولة مرة أخرى'}
        </FeedbackBanner>
      ) : null}

      <div className="sc-content">
        <div className="sc-list-header">
          <div className="sc-page-heading">
            <h2>الشركات</h2>
          </div>
          <div className="sc-toolbar">
            {canCreateDraft(role) ? (
              <button type="button" className="sc-btn-primary" onClick={() => navigate('/org/companies/new')}>
                <Plus size={18} />
                <span>إضافة شركة جديدة</span>
              </button>
            ) : null}
          </div>
        </div>

        <div className="rc-view-bar">
          <StatusFilterMenu
            title="حالة الشركة"
            allKey="all"
            value={filter}
            shown={visible.length}
            total={rows.length}
            noun="شركات"
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
            {loading ? <p className="sc-empty">جاري التحميل...</p> : null}
            {!loading && visible.length === 0 ? <p className="sc-empty">لا توجد شركات حالياً</p> : null}
            <RecordCardGrid>
              {visible.map((row) => (
                <RecordCard
                  key={row.company.id}
                  title={row.company.name}
                  subtitle={row.company.description || row.company.email || '—'}
                  badges={<StatusBadge status={row.status} />}
                  progress={{ label: 'نسبة الإنجاز', value: row.progress }}
                  rows={[{ label: 'عدد العقود', value: row.contracts }]}
                  linkLabel="عرض الشركة"
                  onOpen={() => openCompany(row.company.id)}
                />
              ))}
            </RecordCardGrid>
          </>
        ) : (
        <div className="sc-table-wrap">
          <div className="sc-table-head">
            <span className="sc-col-name">الشركة</span>
            <span className="sc-col-center">عدد العقود</span>
            <span className="sc-col-center">نسبة الإنجاز</span>
            <span className="sc-col-center">الحالة</span>
            <span />
          </div>
          <ul className="sc-table-body">
            {loading ? <li className="sc-empty">جاري التحميل...</li> : null}
            {!loading && visible.length === 0 ? <li className="sc-empty">لا توجد شركات حالياً</li> : null}
            {visible.map((row, index) => (
              <li
                key={row.company.id}
                className={`sc-table-row ${index % 2 === 0 ? 'sc-row-even' : 'sc-row-odd'}`}
              >
                <div className="sc-company-cell">
                  <span className="sc-logo-box">
                    <CompanyMark name={row.company.name} logoUrl={row.company.logoUrl} />
                  </span>
                  <div className="sc-company-info">
                    <p className="sc-company-name">{row.company.name}</p>
                    <p className="sc-company-desc">{row.company.description || row.company.email || '—'}</p>
                  </div>
                </div>
                <div className="sc-col-center">
                  <span className="sc-contracts-count">{row.contracts}</span>
                </div>
                <div className="sc-progress-cell">
                  <div className="sc-progress-track">
                    <div className="sc-progress-fill" style={{ width: `${row.progress}%`, background: progressColor(row.progress) }} />
                  </div>
                  <span className="sc-progress-text">{row.progress}%</span>
                </div>
                <div className="sc-col-center">
                  <StatusBadge status={row.status} />
                </div>
                <button
                  type="button"
                  className="sc-btn-action"
                  aria-label={`تفاصيل ${row.company.name}`}
                  onClick={() => openCompany(row.company.id)}
                >
                  <ChevronLeft size={20} />
                </button>
              </li>
            ))}
          </ul>
        </div>
        )}
      </div>
    </div>
  )
}
