import { useEffect, useState, type ReactNode } from 'react'
import {
  Briefcase,
  ChevronLeft,
  ClipboardList,
  Download,
  HelpCircle,
  ListFilter,
  Mail,
  Phone,
  Trash2,
  User,
} from 'lucide-react'
import { useNavigate, useOutletContext, useParams } from 'react-router-dom'
import { departmentsAssets } from '@/assets'
import { ApiError } from '../../api/client'
import {
  deleteDepartment,
  getDepartmentById,
  getDepartmentEmployees,
  updateDepartment,
  type Department,
  type DepartmentEmployee,
} from '../../api/org'
import { getProjects, type OrgProject } from '../../api/orgProjects'
import type { OrgRole } from '../../auth/orgAuth'
import { getOrgToken } from '../../auth/orgAuth'
import { canCreateDraft, isUpperManagement } from '../../auth/permissions'
import { FeedbackBanner } from '../../components/ui/FeedbackBanner'
import { SubpageHeader } from '../../components/ui'
import { TrendKpiRow } from '../../components/senior/TrendKpiCard'
import { averageProgress, projectStatusClass, STATUS_META } from './orgEntityUi'
import '../../design/departments-detail.css'
import '../../design/departments.css'

const tabs = ['المشاريع', 'التقارير', 'الموظفين'] as const
type Tab = (typeof tabs)[number]

export function OrgDepartmentDetailPage({ initialEdit = false }: { initialEdit?: boolean }) {
  const navigate = useNavigate()
  const { departmentId } = useParams()
  const { role } = useOutletContext<{ role: OrgRole }>()
  const [department, setDepartment] = useState<Department | null>(null)
  const [employees, setEmployees] = useState<DepartmentEmployee[]>([])
  const [projects, setProjects] = useState<OrgProject[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tab, setTab] = useState<Tab>('المشاريع')
  const [editOpen, setEditOpen] = useState(initialEdit)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [banner, setBanner] = useState<'success' | 'error' | null>(null)
  const [deleting, setDeleting] = useState(false)

  const canEdit = canCreateDraft(role)
  const canDelete = isUpperManagement(role)

  useEffect(() => {
    const token = getOrgToken()
    if (!token || !departmentId) {
      setLoading(false)
      return
    }
    let cancelled = false
    ;(async () => {
      try {
        const [{ department: data }, employeesRes, projectsRes] = await Promise.all([
          getDepartmentById(token, departmentId),
          getDepartmentEmployees(token, departmentId),
          getProjects(token),
        ])
        if (cancelled) return
        setDepartment(data)
        setEmployees(employeesRes.employees ?? [])
        setProjects((projectsRes.projects ?? []).filter((project) => project.departmentId === departmentId))
        setError(null)
      } catch (err) {
        if (!cancelled) setError(err instanceof ApiError ? err.message : 'تعذر تحميل الإدارة')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [departmentId])

  const saveDepartment = async (form: EditForm) => {
    if (!form.name.trim() || !departmentId) {
      setEditOpen(false)
      setBanner('error')
      return
    }
    const token = getOrgToken()
    if (!token) return
    try {
      const { department: updated } = await updateDepartment(token, departmentId, {
        name: form.name.trim(),
        type: form.section.trim() || undefined,
        managerName: form.manager.trim() || undefined,
        phone: form.phone.trim() || undefined,
        email: form.email.trim() || undefined,
        description: form.description.trim() || undefined,
      })
      setDepartment(updated)
      setEditOpen(false)
      setBanner('success')
    } catch {
      setEditOpen(false)
      setBanner('error')
    }
  }

  const handleDelete = async () => {
    const token = getOrgToken()
    if (!token || !departmentId) return
    setDeleting(true)
    try {
      await deleteDepartment(token, departmentId)
      navigate('/org/departments', { state: { notice: 'deleted' } })
    } catch (err) {
      setBanner('error')
      if (err instanceof ApiError) setError(err.message)
      setDeleteOpen(false)
    } finally {
      setDeleting(false)
    }
  }

  if (!loading && !department) {
    return (
      <div className="dashboard-page department-detail-exact" dir="rtl">
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, minHeight: '60vh', textAlign: 'center' }}>
          <p style={{ margin: 0, color: 'var(--dd-muted-foreground)', fontWeight: 600 }}>
            {error || 'هذه الإدارة غير موجودة أو تم حذفها.'}
          </p>
          <button type="button" className="department-detail-edit" onClick={() => navigate('/org/departments')}>
            العودة إلى الإدارات
          </button>
        </div>
      </div>
    )
  }

  const progress = averageProgress(projects)
  const outputs = projects.reduce((sum, project) => sum + (project._count?.deliverables ?? 0), 0)

  return (
    <div className="dashboard-page department-detail-exact" dir="rtl">
      <div className="department-detail-header">
        <SubpageHeader
          parent="الإدارات"
          title={department?.name ?? 'الإدارات'}
          onBack={() => navigate('/org/departments')}
          actions={
            <div className="department-detail-header__actions">
              {canEdit ? (
                <button type="button" className="department-detail-edit" onClick={() => setEditOpen(true)}>
                  تعديل
                </button>
              ) : null}
              {canDelete ? (
                <button type="button" className="department-detail-delete" onClick={() => setDeleteOpen(true)}>
                  حذف
                </button>
              ) : null}
            </div>
          }
        />
      </div>

      {banner ? (
        <FeedbackBanner className="department-detail-banner" tone={banner} onClose={() => setBanner(null)}>
          {banner === 'success' ? 'تم حفظ التغييرات بنجاح' : 'حدث خطأ ما ، يرجى المحاولة مرة أخرى'}
        </FeedbackBanner>
      ) : null}

      <div className="department-detail-content">
        {loading ? <p className="departments-empty">جاري التحميل...</p> : null}
        {department ? (
          <>
            <TrendKpiRow
              stats={[
                { label: 'عدد المشاريع', value: `${projects.length}`, delta: `${employees.length} موظف`, up: true },
                { label: 'متوسط التقدم', value: `${progress}%`, delta: department.isActive ? 'نشط' : 'غير نشط', up: progress >= 50 },
                { label: 'عدد المخرجات', value: `${outputs}`, delta: `${department.employeeCount ?? employees.length}`, up: outputs > 0 },
              ]}
            />

            <section className="department-detail-card">
              <div className="department-detail-card__intro">
                <span className="department-detail-card__icon">
                  <img src={departmentsAssets.department} alt="" width={28} height={28} />
                </span>
                <div>
                  <h1>{department.name}</h1>
                  <p>{department.description || '—'}</p>
                </div>
              </div>

              <div className="department-detail-info-grid department-detail-info-grid--first">
                <InfoItem icon={<Briefcase />} label="القسم" value={department.type || '—'} />
                <InfoItem icon={<ClipboardList />} label="الأداء" value={department.isActive ? 'نشط' : 'غير نشط'} />
                <InfoItem icon={<ClipboardList />} label="القطاع" value="—" />
              </div>
              <div className="department-detail-info-grid department-detail-info-grid--second">
                <InfoItem icon={<User />} label="الشخص المسؤول" value={department.managerName || '—'} />
                <InfoItem icon={<Phone />} label="الهاتف" value={department.phone || '—'} ltr />
                <InfoItem icon={<Mail />} label="البريد الإلكتروني" value={department.email || '—'} ltr />
              </div>
            </section>

            <section className="department-detail-workspace">
              <div className="department-detail-tabs">
                {tabs.map((item) => (
                  <button key={item} type="button" className={tab === item ? 'is-active' : ''} onClick={() => setTab(item)}>
                    {item}
                  </button>
                ))}
              </div>

              {tab === 'المشاريع' ? (
                <>
                  <div className="department-detail-toolbar">
                    <button type="button" className="department-detail-outline">
                      <Download />
                      تصدير
                    </button>
                    <button type="button" className="department-detail-outline">
                      <ListFilter />
                      حفظ
                    </button>
                  </div>
                  <table className="department-detail-project-table">
                    <thead>
                      <tr>
                        <th>اسم المشروع</th>
                        <th>نسبة التقدم</th>
                        <th>الحالة</th>
                        <th aria-label="فتح" />
                      </tr>
                    </thead>
                    <tbody>
                      {projects.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="department-detail-empty">
                            لا توجد مشاريع مرتبطة بهذه الإدارة
                          </td>
                        </tr>
                      ) : null}
                      {projects.map((project) => {
                        const status = projectStatusClass(project.status)
                        const meta = { label: STATUS_META[status], barClass: `is-${status === 'delay' ? 'late' : status === 'blocked' ? 'risk' : status === 'done' ? 'done' : 'track'}`, className: status === 'delay' ? 'is-late' : status === 'blocked' ? 'is-risk' : status === 'done' ? 'is-done' : 'is-track' }
                        return (
                          <tr key={project.id} onClick={() => navigate(`/org/projects/${project.id}`)}>
                            <td>{project.name}</td>
                            <td>
                              <div className="department-detail-progress">
                                <span>{project.progressPct || 0}%</span>
                                <span dir="ltr" className="department-detail-progress__track">
                                  <span className={`department-detail-progress__bar ${meta.barClass}`} style={{ width: `${project.progressPct || 0}%` }} />
                                </span>
                              </div>
                            </td>
                            <td>
                              <span className={`department-detail-status ${meta.className}`}>
                                {meta.label}
                                <HelpCircle className="department-detail-status__icon" />
                              </span>
                            </td>
                            <td>
                              <ChevronLeft className="department-detail-row-chevron" />
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </>
              ) : null}

              {tab === 'التقارير' ? (
                <p className="department-detail-empty">لا توجد تقارير متاحة لهذه الإدارة حالياً.</p>
              ) : null}

              {tab === 'الموظفين' ? (
                <ul className="department-detail-team">
                  {employees.length === 0 ? <li className="department-detail-empty">لا يوجد موظفون مضافون بعد</li> : null}
                  {employees.map((member) => (
                    <li key={member.id}>
                      <span className="department-detail-team__avatar">{member.name.charAt(0)}</span>
                      <div>
                        <strong>{member.name}</strong>
                        <p>
                          {member.role || '—'}
                          {member.email ? ` · ${member.email}` : ''}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : null}
            </section>
          </>
        ) : null}
      </div>

      {editOpen && department ? (
        <EditDialog initial={department} onClose={() => setEditOpen(false)} onSave={(form) => void saveDepartment(form)} />
      ) : null}

      {deleteOpen ? (
        <ConfirmDialog
          loading={deleting}
          onCancel={() => setDeleteOpen(false)}
          onConfirm={() => void handleDelete()}
        />
      ) : null}
    </div>
  )
}

function InfoItem({ icon, label, value, ltr }: { icon: ReactNode; label: string; value: string; ltr?: boolean }) {
  return (
    <div className="department-detail-info-item">
      <span className="department-detail-info-item__icon">{icon}</span>
      <div>
        <p>{label}</p>
        <strong dir={ltr ? 'ltr' : undefined}>{value}</strong>
      </div>
    </div>
  )
}

type EditForm = {
  name: string
  section: string
  manager: string
  phone: string
  email: string
  description: string
}

function EditDialog({
  initial,
  onClose,
  onSave,
}: {
  initial: Department
  onClose: () => void
  onSave: (form: EditForm) => void
}) {
  const [form, setForm] = useState<EditForm>({
    name: initial.name,
    section: initial.type ?? '',
    manager: initial.managerName ?? '',
    phone: initial.phone ?? '',
    email: initial.email ?? '',
    description: initial.description ?? '',
  })
  const set = (key: keyof EditForm) => (e: { target: { value: string } }) =>
    setForm((current) => ({ ...current, [key]: e.target.value }))

  return (
    <div className="department-detail-overlay">
      <div className="department-detail-dialog" role="dialog" aria-modal="true">
        <div className="department-detail-dialog__heading">
          <h2>تعديل بيانات الإدارة</h2>
          <span>
            <ClipboardList />
          </span>
        </div>
        <div className="department-detail-dialog__grid">
          <Field label="اسم الإدارة" value={form.name} onChange={set('name')} />
          <Field label="القسم" value={form.section} onChange={set('section')} />
          <Field label="مدير الإدارة" value={form.manager} onChange={set('manager')} />
          <Field label="الهاتف" value={form.phone} onChange={set('phone')} ltr />
          <Field label="البريد الإلكتروني" value={form.email} onChange={set('email')} ltr />
          <div className="department-detail-dialog__full">
            <label>وصف الإدارة</label>
            <textarea value={form.description} onChange={set('description')} rows={4} />
          </div>
        </div>
        <div className="department-detail-dialog__actions">
          <button type="button" className="department-detail-dialog__save" onClick={() => onSave(form)}>
            حفظ الإدارة
          </button>
          <button type="button" className="department-detail-dialog__cancel" onClick={onClose}>
            إلغاء
          </button>
        </div>
      </div>
    </div>
  )
}

function Field({
  label,
  value,
  onChange,
  ltr,
}: {
  label: string
  value: string
  onChange: (e: { target: { value: string } }) => void
  ltr?: boolean
}) {
  return (
    <div>
      <label>{label}</label>
      <input dir={ltr ? 'ltr' : undefined} value={value} onChange={onChange} className={ltr ? 'is-ltr' : ''} />
    </div>
  )
}

function ConfirmDialog({
  onCancel,
  onConfirm,
  loading,
}: {
  onCancel: () => void
  onConfirm: () => void
  loading: boolean
}) {
  return (
    <div className="department-detail-overlay">
      <div className="department-detail-dialog department-detail-confirm" role="alertdialog" aria-modal="true">
        <div className="department-detail-dialog__heading">
          <h2>تأكيد الإجراء</h2>
          <span className="is-danger">
            <Trash2 />
          </span>
        </div>
        <p>هل أنت متأكد من هذا الإجراء</p>
        <div className="department-detail-dialog__confirm-actions">
          <button type="button" className="department-detail-dialog__delete" onClick={onConfirm} disabled={loading}>
            {loading ? 'جاري الحذف...' : 'حذف'}
          </button>
          <button type="button" className="department-detail-dialog__cancel" onClick={onCancel}>
            إلغاء
          </button>
        </div>
      </div>
    </div>
  )
}
