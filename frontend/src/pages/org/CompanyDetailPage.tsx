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
  Trash2,
  User,
  X,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useOutletContext, useParams } from 'react-router-dom'
import { companiesAssets, matchCompanyLogo } from '@/assets'
import { ApiError } from '../../api/client'
import {
  deleteCompany,
  getCompanyById,
  getCompanyTeam,
  updateCompany,
  type CompanyTeamMember,
  type ExecutingCompany,
} from '../../api/org'
import { getProjects, type OrgProject } from '../../api/orgProjects'
import type { OrgRole } from '../../auth/orgAuth'
import { getOrgToken } from '../../auth/orgAuth'
import { canCreateDraft, isUpperManagement } from '../../auth/permissions'
import { FeedbackBanner } from '../../components/ui/FeedbackBanner'
import { SubpageHeader } from '../../components/ui'
import { TrendKpiRow } from '../../components/senior/TrendKpiCard'
import { downloadCsv } from '../../api/me'
import { averageProgress, nextStatusFilter, projectStatusClass, STATUS_META, type StatusClass } from './orgEntityUi'
import '../../design/senior-companies.css'

const tabs = ['المشاريع', 'التقارير', 'الموظفين'] as const

function Field({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof User
  label: string
  value: string
}) {
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

function ModalInput({
  id,
  label,
  value,
  onChange,
  invalid,
}: {
  id: string
  label: string
  value: string
  onChange: (v: string) => void
  invalid: boolean
}) {
  return (
    <div className="edit-modal__field">
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={invalid}
        style={invalid ? { borderColor: '#f04438' } : {}}
      />
    </div>
  )
}

export function OrgCompanyDetailPage({ initialEdit = false }: { initialEdit?: boolean }) {
  const navigate = useNavigate()
  const { companyId } = useParams()
  const { role } = useOutletContext<{ role: OrgRole }>()
  const [company, setCompany] = useState<ExecutingCompany | null>(null)
  const [team, setTeam] = useState<CompanyTeamMember[]>([])
  const [projects, setProjects] = useState<OrgProject[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [banner, setBanner] = useState<'success' | 'error' | null>(null)
  const [editOpen, setEditOpen] = useState(initialEdit)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [tab, setTab] = useState<(typeof tabs)[number]>('المشاريع')
  const [draftName, setDraftName] = useState('')
  const [draftRegistration, setDraftRegistration] = useState('')
  const [draftOwner, setDraftOwner] = useState('')
  const [draftPhone, setDraftPhone] = useState('')
  const [draftEmail, setDraftEmail] = useState('')
  const [draftDescription, setDraftDescription] = useState('')
  const [touched, setTouched] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [statusFilter, setStatusFilter] = useState<StatusClass | 'all'>('all')

  const canEdit = canCreateDraft(role)
  const canDelete = isUpperManagement(role)

  useEffect(() => {
    const token = getOrgToken()
    if (!token || !companyId) {
      setLoading(false)
      return
    }
    let cancelled = false
    ;(async () => {
      try {
        const [{ company: data }, teamRes, projectsRes] = await Promise.all([
          getCompanyById(token, companyId),
          getCompanyTeam(token, companyId),
          getProjects(token),
        ])
        if (cancelled) return
        setCompany(data)
        setTeam(teamRes.team ?? data.team ?? [])
        setProjects((projectsRes.projects ?? []).filter((project) => project.executingCompanyId === companyId))
        setDraftName(data.name)
        setDraftRegistration(data.registrationNo ?? '')
        setDraftOwner(data.managerName ?? '')
        setDraftPhone(data.phone ?? '')
        setDraftEmail(data.email ?? '')
        setDraftDescription(data.description ?? '')
        setError(null)
      } catch (err) {
        if (!cancelled) setError(err instanceof ApiError ? err.message : 'تعذر تحميل الشركة')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [companyId])

  const progress = averageProgress(projects)
  const visibleProjects =
    statusFilter === 'all' ? projects : projects.filter((project) => projectStatusClass(project.status) === statusFilter)

  function exportTab() {
    if (!company) return
    if (tab === 'المشاريع') {
      downloadCsv(
        `company-${company.id.slice(0, 8)}-projects.csv`,
        [
          ['name', 'اسم المشروع'],
          ['progress', 'نسبة التقدم'],
          ['status', 'الحالة'],
        ],
        visibleProjects.map((project) => ({
          name: project.name,
          progress: `${project.progressPct || 0}%`,
          status: STATUS_META[projectStatusClass(project.status)],
        })),
      )
    } else if (tab === 'الموظفين') {
      downloadCsv(
        `company-${company.id.slice(0, 8)}-team.csv`,
        [
          ['name', 'الاسم'],
          ['role', 'الدور'],
          ['email', 'البريد الإلكتروني'],
        ],
        team.map((member) => ({ name: member.name, role: member.role || '', email: member.email || '' })),
      )
    }
  }
  const outputs = projects.reduce((sum, project) => sum + (project._count?.deliverables ?? 0), 0)

  const openEdit = () => {
    if (!company) return
    setDraftName(company.name)
    setDraftRegistration(company.registrationNo ?? '')
    setDraftOwner(company.managerName ?? '')
    setDraftPhone(company.phone ?? '')
    setDraftEmail(company.email ?? '')
    setDraftDescription(company.description ?? '')
    setTouched(false)
    setEditOpen(true)
  }

  const missing = (value: string) => touched && !value.trim()

  const save = async (event: React.FormEvent) => {
    event.preventDefault()
    setTouched(true)
    if (!draftName.trim() || !companyId) {
      setBanner('error')
      return
    }
    const token = getOrgToken()
    if (!token) return
    setSaving(true)
    try {
      const { company: updated } = await updateCompany(token, companyId, {
        name: draftName.trim(),
        registrationNo: draftRegistration.trim() || undefined,
        managerName: draftOwner.trim() || undefined,
        phone: draftPhone.trim() || undefined,
        email: draftEmail.trim() || undefined,
        description: draftDescription.trim() || undefined,
      })
      setCompany(updated)
      setBanner('success')
      setEditOpen(false)
    } catch (err) {
      setBanner('error')
      if (err instanceof ApiError) setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const onDelete = async () => {
    const token = getOrgToken()
    if (!token || !companyId) return
    setDeleting(true)
    try {
      await deleteCompany(token, companyId)
      navigate('/org/companies', { state: { notice: 'deleted' } })
    } catch (err) {
      setBanner('error')
      if (err instanceof ApiError) setError(err.message)
      setConfirmDelete(false)
    } finally {
      setDeleting(false)
    }
  }

  const logo = useMemo(
    () => (company ? matchCompanyLogo(company.name) ?? companiesAssets.company : companiesAssets.company),
    [company],
  )

  if (!loading && !company) {
    return (
      <div className="dashboard-page cd-page" dir="rtl">
        <SubpageHeader parent="الشركات" title="غير موجودة" onBack={() => navigate('/org/companies')} />
        <p className="sc-empty" style={{ padding: '80px 24px' }}>
          {error || 'هذه الشركة غير موجودة أو تم حذفها.'}
        </p>
      </div>
    )
  }

  return (
    <div className="dashboard-page cd-page" dir="rtl">
      <SubpageHeader
        parent="الشركات"
        title={company?.name ?? 'الشركات'}
        onBack={() => navigate('/org/companies')}
        actions={
          <>
            {canEdit ? (
              <button type="button" className="sc-btn-primary cd-action-btn" onClick={openEdit}>
                تعديل
              </button>
            ) : null}
            {canDelete ? (
              <button type="button" className="sc-btn-danger cd-action-btn" onClick={() => setConfirmDelete(true)}>
                حذف
              </button>
            ) : null}
          </>
        }
      />

      {banner === 'success' ? (
        <FeedbackBanner tone="success" onClose={() => setBanner(null)}>
          تم حفظ التغييرات بنجاح
        </FeedbackBanner>
      ) : null}
      {banner === 'error' || error ? (
        <FeedbackBanner tone="error" onClose={() => { setBanner(null); setError(null) }}>
          {error || 'حدث خطأ ما ، يرجى المحاولة مرة أخرى'}
        </FeedbackBanner>
      ) : null}

      <div className="cd-content">
        {loading ? <p className="sc-empty">جاري التحميل...</p> : null}
        {company ? (
          <>
            <div className="cd-kpis">
              <TrendKpiRow
                stats={[
                  { label: 'عدد المشاريع', value: String(projects.length), delta: `${team.length} موظف`, up: true },
                  { label: 'متوسط التقدم', value: `${progress}%`, delta: company.isActive ? 'نشط' : 'غير نشط', up: progress >= 50 },
                  { label: 'عدد المخرجات', value: String(outputs), delta: `${company.teamCount ?? team.length}`, up: outputs > 0 },
                ]}
              />
            </div>

            <div className="cd-main-card">
              <div className="cd-intro">
                <span className="cd-logo cd-logo--img">
                  <img src={logo} alt={company.name} className="cd-logo-img" />
                </span>
                <div>
                  <h2 className="cd-company-name">{company.name}</h2>
                  <p className="cd-company-desc">{company.description || '—'}</p>
                </div>
              </div>

              <div className="cd-info-row">
                <Field icon={ClipboardList} label="رقم السجل التجاري" value={company.registrationNo || '—'} />
                <Field icon={ClipboardCheck} label="الأداء" value={company.isActive ? 'نشط' : 'غير نشط'} />
                <Field icon={Briefcase} label="القطاع" value="—" />
              </div>
              <div className="cd-info-row">
                <Field icon={User} label="الشخص المسؤول" value={company.managerName || '—'} />
                <Field icon={Phone} label="الهاتف" value={company.phone || '—'} />
                <Field icon={Mail} label="البريد الإلكتروني" value={company.email || '—'} />
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
                <button
                  type="button"
                  className="sc-btn-outline cd-tool-btn"
                  disabled={tab === 'التقارير' || (tab === 'المشاريع' ? visibleProjects.length === 0 : team.length === 0)}
                  onClick={exportTab}
                >
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
                        {projects.length === 0 ? 'لا توجد مشاريع مرتبطة بهذه الشركة' : 'لا توجد مشاريع بهذه الحالة'}
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
                            onClick={() => navigate(`/org/projects/${project.id}`)}
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

              {tab === 'التقارير' ? <p className="cd-empty-tab">لا توجد بيانات لعرضها في التقارير</p> : null}

              {tab === 'الموظفين' ? (
                <ul className="cd-proj-body">
                  {team.length === 0 ? <li className="cd-empty-tab">لا يوجد موظفون مضافون بعد</li> : null}
                  {team.map((member) => (
                    <li key={member.id} className="cd-proj-row">
                      <div className="sc-company-cell">
                        <span className="sc-logo-box">{member.name.charAt(0)}</span>
                        <div className="sc-company-info">
                          <p className="sc-company-name">{member.name}</p>
                          <p className="sc-company-desc">
                            {member.role || '—'}
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

      {editOpen && company ? (
        <div className="modal-backdrop">
          <form onSubmit={(event) => void save(event)} className="edit-modal">
            <div className="edit-modal__heading">
              <button type="button" aria-label="إغلاق" onClick={() => setEditOpen(false)} className="sc-btn-action" style={{ marginInlineEnd: 'auto' }}>
                <X size={16} />
              </button>
              <h2>تعديل بيانات الشركة</h2>
              <span className="edit-modal__icon">
                <ClipboardList size={22} />
              </span>
            </div>
            <div className="edit-modal__grid">
              <ModalInput id="edit-name" label="اسم الشركة" value={draftName} onChange={setDraftName} invalid={missing(draftName)} />
              <ModalInput id="edit-registration" label="رقم السجل التجاري" value={draftRegistration} onChange={setDraftRegistration} invalid={false} />
              <ModalInput id="edit-owner" label="الشخص المسؤول" value={draftOwner} onChange={setDraftOwner} invalid={false} />
              <ModalInput id="edit-phone" label="الهاتف" value={draftPhone} onChange={setDraftPhone} invalid={false} />
              <ModalInput id="edit-email" label="البريد الإلكتروني" value={draftEmail} onChange={setDraftEmail} invalid={false} />
              <div className="edit-modal__full">
                <label htmlFor="edit-description">وصف الشركة</label>
                <textarea
                  id="edit-description"
                  rows={4}
                  value={draftDescription}
                  onChange={(e) => setDraftDescription(e.target.value)}
                />
              </div>
            </div>
            <div className="edit-modal__actions">
              <button type="submit" className="sc-btn-primary" style={{ minWidth: 'auto', height: 38, fontSize: 13 }} disabled={saving}>
                {saving ? 'جاري الحفظ...' : 'حفظ التغييرات'}
              </button>
              <button type="button" onClick={() => setEditOpen(false)} className="sc-btn-outline" style={{ minWidth: 'auto', height: 38, fontSize: 13 }}>
                إلغاء
              </button>
            </div>
          </form>
        </div>
      ) : null}

      {confirmDelete ? (
        <div role="dialog" aria-modal="true" aria-label="تأكيد الإجراء" className="modal-backdrop">
          <div className="delete-modal">
            <div className="delete-modal__heading">
              <div className="delete-icon">
                <Trash2 size={24} />
              </div>
              <h2>تأكيد الإجراء</h2>
            </div>
            <hr />
            <p>هل أنت متأكد من حذف هذه الشركة؟</p>
            <div className="delete-modal__actions">
              <button
                type="button"
                className="sc-btn-danger"
                style={{ minWidth: 'auto', height: 38, fontSize: 13 }}
                disabled={deleting}
                onClick={() => void onDelete()}
              >
                {deleting ? 'جاري الحذف...' : 'حذف'}
              </button>
              <button type="button" className="sc-btn-outline" style={{ minWidth: 'auto', height: 38, fontSize: 13 }} onClick={() => setConfirmDelete(false)}>
                إلغاء
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
