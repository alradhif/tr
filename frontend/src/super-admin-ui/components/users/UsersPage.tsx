import { useEffect, useMemo, useState } from 'react'
import { Copy, Plus, Check } from 'lucide-react'
import { PageHeader } from '../layout/PageHeader'
import { getSuperAdminToken } from '../../../auth/superAdminAuth'
import { ApiError } from '../../../api/client'
import {
  createPlatformUser,
  getAccounts,
  getPlatformUsers,
  type ClientAccount,
  type OrgAccount,
  type PlatformUser,
} from '../../../api/superAdmin'
import '../layout/layout.css'
import '../tenants/tenants.css'
import '../tenants/tenant-form.css'
import './users.css'

type PortalType = 'CLIENT' | 'ORG' | 'JODAYN'
type AccessLevel = 'UPPER' | 'DATA_ENTRY'
type View = 'list' | 'form' | 'created'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

const PORTAL_LABEL: Record<PortalType, string> = {
  CLIENT: 'Client',
  ORG: 'Organization',
  JODAYN: 'Jodayn',
}

const ACCESS_LABEL: Record<AccessLevel, string> = {
  UPPER: 'Management / Upper',
  DATA_ENTRY: 'Data Entry',
}

type FormState = {
  name: string
  email: string
  portalType: PortalType | ''
  accessLevel: AccessLevel | ''
  orgId: string
  clientId: string
  password: string
}

type FormErrors = Partial<Record<keyof FormState, string>> & { submit?: string }

const BLANK: FormState = {
  name: '',
  email: '',
  portalType: '',
  accessLevel: '',
  orgId: '',
  clientId: '',
  password: '',
}

function portalLoginHint(portal: PortalType) {
  if (portal === 'CLIENT') return '/login'
  if (portal === 'ORG') return '/login'
  return '/login'
}

export function UsersPage() {
  const [view, setView] = useState<View>('list')
  const [users, setUsers] = useState<PlatformUser[]>([])
  const [orgs, setOrgs] = useState<OrgAccount[]>([])
  const [clients, setClients] = useState<ClientAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState<FormState>(BLANK)
  const [errors, setErrors] = useState<FormErrors>({})
  const [created, setCreated] = useState<{
    portalType: PortalType
    accessLevel: AccessLevel
    email: string
    temporaryPassword: string
    name: string
  } | null>(null)
  const [copied, setCopied] = useState<'email' | 'password' | null>(null)

  const load = async () => {
    const token = getSuperAdminToken()
    if (!token) {
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const [usersRes, accounts] = await Promise.all([getPlatformUsers(token), getAccounts(token)])
      setUsers(usersRes.users ?? [])
      setOrgs(accounts.orgs ?? [])
      setClients(accounts.clients ?? [])
    } catch {
      setUsers([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  const validate = (data: FormState): FormErrors => {
    const next: FormErrors = {}
    if (!data.name.trim()) next.name = 'الاسم مطلوب'
    if (!data.email.trim()) next.email = 'البريد الإلكتروني مطلوب'
    else if (!EMAIL_RE.test(data.email.trim())) next.email = 'صيغة البريد الإلكتروني غير صحيحة'
    if (!data.portalType) next.portalType = 'نوع المستخدم مطلوب'
    if (!data.accessLevel) next.accessLevel = 'مستوى الصلاحية مطلوب'
    if (data.portalType === 'ORG' && !data.orgId) next.orgId = 'يجب ربط المستخدم بجهة'
    if (data.portalType === 'CLIENT' && !data.clientId) next.clientId = 'يجب ربط المستخدم بعميل'
    return next
  }

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((current) => ({ ...current, [key]: value }))
    setErrors((current) => ({ ...current, [key]: undefined, submit: undefined }))
  }

  const copyValue = async (kind: 'email' | 'password', value: string) => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(kind)
      window.setTimeout(() => setCopied(null), 1600)
    } catch {
      setCopied(null)
    }
  }

  const handleCreate = async () => {
    const nextErrors = validate(form)
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors)
      return
    }
    const token = getSuperAdminToken()
    if (!token) {
      setErrors({ submit: 'يجب تسجيل الدخول أولاً' })
      return
    }
    setSubmitting(true)
    try {
      const result = await createPlatformUser(token, {
        name: form.name.trim(),
        email: form.email.trim(),
        portalType: form.portalType as PortalType,
        accessLevel: form.accessLevel as AccessLevel,
        orgId: form.portalType === 'ORG' ? form.orgId : undefined,
        clientId: form.portalType === 'CLIENT' ? form.clientId : undefined,
        password: form.password.trim() || undefined,
      })
      setCreated({
        portalType: form.portalType as PortalType,
        accessLevel: form.accessLevel as AccessLevel,
        email: result.user.email,
        temporaryPassword: result.temporaryPassword,
        name: result.user.name,
      })
      setForm(BLANK)
      setErrors({})
      setView('created')
      await load()
    } catch (err) {
      setErrors({ submit: err instanceof ApiError ? err.message : 'تعذر إنشاء المستخدم' })
    } finally {
      setSubmitting(false)
    }
  }

  const counts = useMemo(
    () => ({
      all: users.length,
      client: users.filter((user) => user.portalType === 'CLIENT').length,
      org: users.filter((user) => user.portalType === 'ORG').length,
      jodayn: users.filter((user) => user.portalType === 'JODAYN').length,
    }),
    [users],
  )

  if (view === 'created' && created) {
    return (
      <div className="dashboard-page">
        <PageHeader
          title="تم إنشاء المستخدم"
          breadcrumbs={[{ label: 'المستخدمون', onClick: () => setView('list') }]}
        />
        <div className="tenants-body" dir="rtl">
          <section className="user-created-card" role="status">
            <h2>User created successfully</h2>
            <p className="user-created-card__hint">
              {created.name} — انسخ بيانات الدخول الآن. لن تظهر كلمة المرور مرة أخرى.
            </p>
            <dl>
              <div>
                <dt>Portal/User Type</dt>
                <dd>
                  {PORTAL_LABEL[created.portalType]} — {ACCESS_LABEL[created.accessLevel]}
                </dd>
              </div>
              <div>
                <dt>Email</dt>
                <dd className="user-created-card__secret" dir="ltr">
                  {created.email}
                </dd>
              </div>
              <div>
                <dt>Temporary Password</dt>
                <dd className="user-created-card__secret" dir="ltr">
                  {created.temporaryPassword}
                </dd>
              </div>
              <div>
                <dt>Login portal</dt>
                <dd dir="ltr">{portalLoginHint(created.portalType)}</dd>
              </div>
            </dl>
            <div className="user-created-card__actions">
              <button type="button" className="tenants-add-btn" onClick={() => void copyValue('email', created.email)}>
                {copied === 'email' ? <Check size={16} /> : <Copy size={16} />}
                Copy Email
              </button>
              <button
                type="button"
                className="tenants-add-btn"
                onClick={() => void copyValue('password', created.temporaryPassword)}
              >
                {copied === 'password' ? <Check size={16} /> : <Copy size={16} />}
                Copy Password
              </button>
              <button
                type="button"
                className="user-created-card__ghost"
                onClick={() => {
                  setCreated(null)
                  setView('list')
                }}
              >
                العودة إلى قائمة المستخدمين
              </button>
            </div>
          </section>
        </div>
      </div>
    )
  }

  if (view === 'form') {
    return (
      <div className="dashboard-page">
        <PageHeader
          title="إضافة مستخدم جديد"
          breadcrumbs={[{ label: 'المستخدمون', onClick: () => setView('list') }]}
        />
        <div className="tenant-form-body" dir="rtl">
          <section className="tenant-form-card">
            <div className="tenant-form-card__header">بيانات المستخدم</div>
            <div className="tenant-form-grid-2">
              <div className="tenant-form-field">
                <label htmlFor="user-name">الاسم الكامل</label>
                <input
                  id="user-name"
                  className="tenant-form-input"
                  value={form.name}
                  onChange={(event) => update('name', event.target.value)}
                />
                {errors.name ? <p className="user-form-error">{errors.name}</p> : null}
              </div>
              <div className="tenant-form-field">
                <label htmlFor="user-email">البريد الإلكتروني</label>
                <input
                  id="user-email"
                  className="tenant-form-input"
                  dir="ltr"
                  value={form.email}
                  onChange={(event) => update('email', event.target.value)}
                />
                {errors.email ? <p className="user-form-error">{errors.email}</p> : null}
              </div>
            </div>

            <div className="tenant-form-grid-2">
              <div className="tenant-form-field">
                <label htmlFor="user-portal">نوع المستخدم</label>
                <select
                  id="user-portal"
                  className="tenant-form-input"
                  value={form.portalType}
                  onChange={(event) => {
                    const portalType = event.target.value as PortalType | ''
                    setForm((current) => ({ ...current, portalType, orgId: '', clientId: '' }))
                    setErrors((current) => ({
                      ...current,
                      portalType: undefined,
                      orgId: undefined,
                      clientId: undefined,
                      submit: undefined,
                    }))
                  }}
                >
                  <option value="">اختر النوع</option>
                  <option value="CLIENT">Client</option>
                  <option value="ORG">Organization</option>
                  <option value="JODAYN">Jodayn</option>
                </select>
                {errors.portalType ? <p className="user-form-error">{errors.portalType}</p> : null}
              </div>
              <div className="tenant-form-field">
                <label htmlFor="user-access">مستوى الصلاحية</label>
                <select
                  id="user-access"
                  className="tenant-form-input"
                  value={form.accessLevel}
                  onChange={(event) => update('accessLevel', event.target.value as AccessLevel | '')}
                >
                  <option value="">اختر المستوى</option>
                  <option value="UPPER">Management / Upper</option>
                  <option value="DATA_ENTRY">Data Entry</option>
                </select>
                {errors.accessLevel ? <p className="user-form-error">{errors.accessLevel}</p> : null}
              </div>
            </div>

            {form.portalType === 'ORG' ? (
              <div className="tenant-form-field">
                <label htmlFor="user-org">الجهة</label>
                <select
                  id="user-org"
                  className="tenant-form-input"
                  value={form.orgId}
                  onChange={(event) => update('orgId', event.target.value)}
                >
                  <option value="">اختر الجهة</option>
                  {orgs.map((org) => (
                    <option key={org.id} value={org.id}>
                      {org.name}
                    </option>
                  ))}
                </select>
                {errors.orgId ? <p className="user-form-error">{errors.orgId}</p> : null}
              </div>
            ) : null}

            {form.portalType === 'CLIENT' ? (
              <div className="tenant-form-field">
                <label htmlFor="user-client">العميل</label>
                <select
                  id="user-client"
                  className="tenant-form-input"
                  value={form.clientId}
                  onChange={(event) => update('clientId', event.target.value)}
                >
                  <option value="">اختر العميل</option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.name}
                    </option>
                  ))}
                </select>
                {errors.clientId ? <p className="user-form-error">{errors.clientId}</p> : null}
              </div>
            ) : null}

            <div className="tenant-form-field">
              <label htmlFor="user-password">كلمة المرور المؤقتة (اختياري)</label>
              <input
                id="user-password"
                className="tenant-form-input"
                dir="ltr"
                type="text"
                autoComplete="new-password"
                placeholder="تُولَّد تلقائياً إذا تُركت فارغة"
                value={form.password}
                onChange={(event) => update('password', event.target.value)}
              />
            </div>

            {errors.submit ? <p className="user-form-error">{errors.submit}</p> : null}

            <div className="user-created-card__actions">
              <button type="button" className="tenants-add-btn" disabled={submitting} onClick={() => void handleCreate()}>
                {submitting ? 'جاري الحفظ...' : 'إنشاء المستخدم'}
              </button>
              <button type="button" className="user-created-card__ghost" onClick={() => setView('list')}>
                إلغاء
              </button>
            </div>
          </section>
        </div>
      </div>
    )
  }

  return (
    <div className="dashboard-page">
      <PageHeader title="المستخدمون" subtitle="إنشاء مستخدمي Client و Organization و Jodayn" />
      <div className="tenants-body" dir="rtl">
        <button type="button" className="tenants-add-btn" onClick={() => setView('form')}>
          <Plus size={16} strokeWidth={2.5} />
          إضافة مستخدم جديد
        </button>
        <div className="users-count-row">
          <span>الكل {counts.all}</span>
          <span>Client {counts.client}</span>
          <span>Organization {counts.org}</span>
          <span>Jodayn {counts.jodayn}</span>
        </div>
        <section className="tenant-form-card users-table-card">
          <div className="td-users-row td-users-row--head users-table-head">
            <span>المستخدم</span>
            <span>نوع المستخدم</span>
            <span>مستوى الصلاحية</span>
            <span>الجهة</span>
          </div>
          {users.map((user) => (
            <div className="td-users-row users-table-row" key={`${user.portalType}-${user.id}`}>
              <div>
                <p className="td-user-name">{user.name}</p>
                <p className="td-user-email" dir="ltr">
                  {user.email}
                </p>
              </div>
              <span>{PORTAL_LABEL[user.portalType as PortalType] || user.portalType}</span>
              <span>{ACCESS_LABEL[user.accessLevel as AccessLevel] || user.accessLevel}</span>
              <span>{user.accountName || '—'}</span>
            </div>
          ))}
          {loading ? <p className="users-empty">جاري التحميل...</p> : null}
          {!loading && users.length === 0 ? <p className="users-empty">لا يوجد مستخدمون بعد</p> : null}
        </section>
      </div>
    </div>
  )
}
