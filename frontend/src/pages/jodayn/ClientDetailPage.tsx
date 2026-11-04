import {
  Briefcase,
  ChevronLeft,
  ClipboardCheck,
  ClipboardList,
  Download,
  HelpCircle,
  ListFilter,
  Mail,
  Phone,
  User,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { message } from 'antd'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'
import { companiesAssets, matchCompanyLogo } from '@/assets'
import { ApiError } from '../../api/client'
import { getJodaynClient, type JodaynClientDetail } from '../../api/jodayn'
import { downloadCsv } from '../../api/me'
import { getJodaynToken } from '../../auth/jodaynAuth'
import { SubpageHeader } from '../../components/ui'
import { TrendKpiRow } from '../../components/senior/TrendKpiCard'
import { formatAmount } from '../../features/jodayn-finance/FinanceParts'
import { nextStatusFilter, projectStatusClass, STATUS_META, type StatusClass } from '../org/orgEntityUi'
import { reportName, reportTypeLabel } from './labels'
import '../../design/senior-companies.css'

const tabs = ['المشاريع', 'التقارير', 'الموظفين'] as const

function Field({ icon: Icon, label, value }: { icon: typeof User; label: string; value: string }) {
  return (
    <div className="cd-info-item">
      <span className="cd-info-icon">
        <Icon size={16} />
      </span>
      <div>
        <p className="cd-info-label">{label}</p>
        <strong className="cd-info-value">{value}</strong>
      </div>
    </div>
  )
}

function performanceLabel(progress: number) {
  if (progress >= 75) return 'ممتاز'
  if (progress >= 50) return 'جيد'
  return 'يحتاج متابعة'
}

/** Client account page for Jodayn, laid out as the Figma company frame (2352:123200). */
export function JodaynClientDetailPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { clientId } = useParams<{ clientId: string }>()
  const [data, setData] = useState<JodaynClientDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<(typeof tabs)[number]>('المشاريع')
  const [statusFilter, setStatusFilter] = useState<StatusClass | 'all'>('all')

  useEffect(() => {
    const token = getJodaynToken()
    if (!token || !clientId) {
      setLoading(false)
      return
    }
    let cancelled = false
    getJodaynClient(token, clientId)
      .then((res) => {
        if (!cancelled) setData(res)
      })
      .catch((err) => {
        if (!cancelled) message.error(err instanceof ApiError ? err.message : t('loadError'))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [clientId, t])

  const client = data?.client
  const projects = useMemo(() => data?.projects ?? [], [data])
  const users = data?.users ?? []
  const reports = data?.reports ?? []
  const progress = projects.length
    ? Math.round(projects.reduce((sum, p) => sum + (p.progressPct || 0), 0) / projects.length)
    : 0
  const outputs = projects.reduce((sum, p) => sum + (p._count?.deliverables ?? 0), 0)
  const activeProjects = projects.filter((p) => p.status === 'ACTIVE').length
  const visibleProjects = useMemo(
    () => (statusFilter === 'all' ? projects : projects.filter((p) => projectStatusClass(p.status) === statusFilter)),
    [projects, statusFilter],
  )

  const logo = useMemo(
    () => (client ? matchCompanyLogo(client.name) ?? companiesAssets.company : companiesAssets.company),
    [client],
  )

  const exportTab = () => {
    if (!client) return
    if (tab === 'المشاريع') {
      downloadCsv(
        `${client.name}-projects.csv`,
        [
          ['name', 'اسم المشروع'],
          ['progressPct', 'نسبة التقدم'],
          ['status', 'الحالة'],
        ],
        visibleProjects.map((p) => ({ ...p, status: STATUS_META[projectStatusClass(p.status)] })),
      )
    } else if (tab === 'التقارير') {
      downloadCsv(
        `${client.name}-reports.csv`,
        [
          ['name', 'اسم التقرير'],
          ['period', 'الفترة'],
          ['totalContractsValue', 'قيمة العقود'],
          ['netProfit', 'صافي الربح'],
        ],
        reports.map((r) => ({ ...r, name: reportName(r.period, reportTypeLabel(r.type, t)) })),
      )
    } else {
      downloadCsv(
        `${client.name}-users.csv`,
        [
          ['name', 'الاسم'],
          ['email', 'البريد الإلكتروني'],
          ['role', 'الدور'],
        ],
        users,
      )
    }
  }

  const exportDisabled =
    tab === 'المشاريع' ? visibleProjects.length === 0 : tab === 'التقارير' ? reports.length === 0 : users.length === 0

  if (!loading && !client) {
    return (
      <div className="dashboard-page cd-page" dir="rtl">
        <SubpageHeader parent="العملاء" title="غير موجود" onBack={() => navigate('/jodayn/client-accounts')} />
        <p className="sc-empty" style={{ padding: '80px 24px' }}>
          هذا الحساب غير موجود أو تم حذفه.
        </p>
      </div>
    )
  }

  return (
    <div className="dashboard-page cd-page" dir="rtl">
      <SubpageHeader
        parent="العملاء"
        title={client?.name ?? 'العملاء'}
        onBack={() => navigate('/jodayn/client-accounts')}
      />

      <div className="cd-content">
        {loading ? <p className="sc-empty">جاري التحميل...</p> : null}
        {client ? (
          <>
            <div className="cd-kpis">
              <TrendKpiRow
                stats={[
                  { label: 'عدد المشاريع', value: String(projects.length), delta: `${activeProjects} نشط`, up: true },
                  { label: 'متوسط التقدم', value: `${progress}%`, delta: performanceLabel(progress), up: progress >= 50 },
                  { label: 'عدد المخرجات', value: String(outputs), delta: `${users.length} مستخدم`, up: outputs > 0 },
                ]}
              />
            </div>

            <div className="cd-main-card">
              <div className="cd-intro">
                <span className="cd-logo cd-logo--img">
                  <img src={logo} alt={client.name} className="cd-logo-img" />
                </span>
                <div>
                  <h2 className="cd-company-name">{client.name}</h2>
                  <p className="cd-company-desc">{client.description || '—'}</p>
                </div>
              </div>

              <div className="cd-info-row">
                <Field icon={ClipboardList} label="رقم السجل التجاري" value={client.crNumber || '—'} />
                <Field icon={ClipboardCheck} label="الأداء" value={performanceLabel(progress)} />
                <Field icon={Briefcase} label="القطاع" value={client.sector?.name || client.sectorName || '—'} />
              </div>
              <div className="cd-info-row">
                <Field icon={User} label="الشخص المسؤول" value={client.managerName || '—'} />
                <Field icon={Phone} label="الهاتف" value={client.phone || '—'} />
                <Field icon={Mail} label="البريد الإلكتروني" value={users[0]?.email || '—'} />
              </div>

              <div className="cd-tabs">
                {tabs.map((item) => (
                  <button
                    key={item}
                    type="button"
                    className={`cd-tab${tab === item ? ' cd-tab--active' : ''}`}
                    onClick={() => setTab(item)}
                  >
                    {item}
                  </button>
                ))}
              </div>

              <div className="cd-tab-toolbar">
                <button
                  type="button"
                  className="sc-btn-outline cd-tool-btn"
                  disabled={tab !== 'المشاريع'}
                  title="تصفية المشاريع حسب الحالة"
                  onClick={() => setStatusFilter(nextStatusFilter(statusFilter))}
                >
                  <ListFilter size={15} />
                  {statusFilter === 'all' ? 'تصفية' : `تصفية: ${STATUS_META[statusFilter]}`}
                </button>
                <button type="button" className="sc-btn-outline cd-tool-btn" disabled={exportDisabled} onClick={exportTab}>
                  <Download size={15} />
                  تصدير
                </button>
              </div>

              {tab === 'المشاريع' ? (
                <div>
                  <div className="cd-proj-head cd-proj-head--with-trash">
                    <span className="cd-proj-col-name">اسم المشروع</span>
                    <span className="sc-col-center">نسبة التقدم</span>
                    <span className="sc-col-center">الحالة</span>
                    <span />
                    <span />
                  </div>
                  <ul className="cd-proj-body">
                    {visibleProjects.length === 0 ? (
                      <li className="cd-empty-tab">
                        {projects.length === 0 ? 'لا توجد مشاريع لهذا العميل' : 'لا توجد مشاريع بهذه الحالة'}
                      </li>
                    ) : null}
                    {visibleProjects.map((project) => {
                      const status = projectStatusClass(project.status)
                      return (
                        <li key={project.id} className="cd-proj-row cd-proj-row--with-trash">
                          <p className="cd-proj-name cd-proj-name--right">{project.name}</p>
                          <div className="sc-progress-cell">
                            <div className="sc-progress-track">
                              <div
                                className={`sc-progress-fill sc-progress-fill--${status}`}
                                style={{ width: `${project.progressPct || 0}%` }}
                              />
                            </div>
                            <span className="sc-progress-text">{project.progressPct || 0}%</span>
                          </div>
                          <div className="sc-col-center">
                            <span className={`cd-proj-status cd-proj-status--${status}`}>
                              <HelpCircle size={13} />
                              {STATUS_META[status]}
                            </span>
                          </div>
                          <button
                            type="button"
                            aria-label={`تفاصيل ${project.name}`}
                            className="sc-btn-action"
                            onClick={() => navigate(`/jodayn/projects/client/${project.id}`)}
                          >
                            <ChevronLeft size={18} />
                          </button>
                          <span />
                        </li>
                      )
                    })}
                  </ul>
                </div>
              ) : null}

              {tab === 'التقارير' ? (
                <ul className="cd-proj-body">
                  {reports.length === 0 ? <li className="cd-empty-tab">لا توجد تقارير لهذا العميل</li> : null}
                  {reports.map((report) => (
                    <li key={report.id} className="cd-proj-row cd-proj-row--with-trash">
                      <p className="cd-proj-name cd-proj-name--right">
                        {reportName(report.period, reportTypeLabel(report.type, t))}
                      </p>
                      <span className="sc-col-center">{report.period || '—'}</span>
                      <span className="sc-col-center">{formatAmount(report.netProfit)}</span>
                      <button
                        type="button"
                        aria-label="فتح التقرير"
                        className="sc-btn-action"
                        onClick={() => navigate(`/jodayn/reports/${report.id}`)}
                      >
                        <ChevronLeft size={18} />
                      </button>
                      <span />
                    </li>
                  ))}
                </ul>
              ) : null}

              {tab === 'الموظفين' ? (
                <ul className="cd-proj-body">
                  {users.length === 0 ? <li className="cd-empty-tab">لا يوجد موظفون مضافون بعد</li> : null}
                  {users.map((member) => (
                    <li key={member.id} className="cd-proj-row">
                      <div className="sc-company-cell">
                        <span className="sc-logo-box">{member.name.charAt(0)}</span>
                        <div className="sc-company-info">
                          <p className="sc-company-name">{member.name}</p>
                          <p className="sc-company-desc">
                            {member.role === 'CLIENT_UPPER_MGMT' ? 'إدارة عليا' : 'مدخل بيانات'}
                            {member.email ? ` · ${member.email}` : ''}
                          </p>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          </>
        ) : null}
      </div>

    </div>
  )
}
