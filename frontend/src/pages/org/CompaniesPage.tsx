import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, ChevronLeft, HelpCircle, ListFilter, Plus } from 'lucide-react'
import { useLocation, useNavigate, useOutletContext } from 'react-router-dom'
import { companiesAssets, matchCompanyLogo } from '@/assets'
import { ApiError } from '../../api/client'
import { getCompanies, type ExecutingCompany } from '../../api/org'
import { getProjects, type OrgProject } from '../../api/orgProjects'
import type { OrgRole } from '../../auth/orgAuth'
import { getOrgToken } from '../../auth/orgAuth'
import { canCreateDraft } from '../../auth/permissions'
import { FeedbackBanner } from '../../components/ui/FeedbackBanner'
import { TrendKpiRow } from '../../components/senior/TrendKpiCard'
import { averageProgress, contractCount, projectStatusClass, STATUS_META } from './orgEntityUi'
import '../../design/senior-companies.css'

type ListNotice = 'success' | 'error' | 'deleted' | undefined

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
      const status = !company.isActive ? 'delay' : projectStatusClass(linked[0]?.status)
      return { company, linked, progress, contracts, status }
    })
  }, [companies, projects])

  const visible = onlyDelayed ? rows.filter((row) => row.status === 'delay' || !row.company.isActive) : rows
  const avgProgress = averageProgress(projects)
  const totalContracts = projects.reduce((sum, project) => sum + contractCount(project), 0)

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
            <h2>قائمة الشركات</h2>
          </div>
          <div className="sc-toolbar">
            {canCreateDraft(role) ? (
              <button type="button" className="sc-btn-primary" onClick={() => navigate('/org/companies/new')}>
                <Plus size={18} />
                <span>إضافة شركة جديدة</span>
              </button>
            ) : null}
            <button
              type="button"
              className={`sc-btn-outline${onlyDelayed ? ' sc-btn-outline--active' : ''}`}
              onClick={() => setOnlyDelayed((value) => !value)}
            >
              <ListFilter size={17} />
              <span>تصفية</span>
            </button>
          </div>
        </div>

        <TrendKpiRow
          stats={[
            { label: 'عدد الشركات', value: String(companies.length), delta: `${rows.filter((r) => r.company.isActive).length} نشط`, up: true },
            { label: 'متوسط التقدم', value: `${avgProgress}%`, delta: `${projects.length} مشروع`, up: avgProgress >= 50 },
            { label: 'إجمالي العقود', value: String(totalContracts), delta: `${projects.length}`, up: totalContracts > 0 },
          ]}
        />

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
                    <img
                      src={matchCompanyLogo(row.company.name) ?? companiesAssets.company}
                      alt={row.company.name}
                      className="sc-logo-img"
                    />
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
                    <div className="sc-progress-fill" style={{ width: `${row.progress}%` }} />
                  </div>
                  <span className="sc-progress-text">{row.progress}%</span>
                </div>
                <div className="sc-col-center">
                  {row.company.isActive ? (
                    <span className="sc-status-pill sc-status-pill--track">
                      <HelpCircle className="sc-status-pill__icon" />
                      {STATUS_META.track}
                    </span>
                  ) : (
                    <span className="sc-status-pill sc-status-pill--warning">
                      <AlertTriangle className="sc-status-pill__icon" />
                      {STATUS_META.delay}
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  className="sc-btn-action"
                  aria-label={`تفاصيل ${row.company.name}`}
                  onClick={() => navigate(`/org/companies/${row.company.id}`)}
                >
                  <ChevronLeft size={20} />
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
