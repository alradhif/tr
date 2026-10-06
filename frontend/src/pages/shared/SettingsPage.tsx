import { useCallback, useEffect, useMemo, useState } from 'react'
import { useLocation, useOutletContext } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { KeyRound, UserCheck, UserX, Users } from 'lucide-react'
import { ApiError } from '../../api/client'
import { createClientUser, getClientUsers, resetClientUserCredentials, toggleClientUser, type ClientUser } from '../../api/clientPortal'
import { createJodaynUser, getJodaynUsers, resetJodaynUserCredentials, toggleJodaynUser, type JodaynUser } from '../../api/jodayn'
import { createOrgUser, getOrgUsers, resetOrgUserCredentials, toggleOrgUser, type OrgUser } from '../../api/org'
import { changePassword, getProfile, updateProfile, type Profile, type UserPreferences } from '../../api/me'
import { updateStoredUser } from '../../auth/session'
import { getClientToken, getClientUser } from '../../auth/clientAuth'
import { getJodaynToken, getJodaynUser } from '../../auth/jodaynAuth'
import { getOrgToken, getOrgUser } from '../../auth/orgAuth'
import { getSuperAdminToken, getSuperAdminUser } from '../../auth/superAdminAuth'
import { isUpperManagement, type AppRole } from '../../auth/permissions'
import { CredentialsModal } from '../../components/settings/CredentialsModal'
import { InviteUserModal, type InviteUserPayload } from '../../components/settings/InviteUserModal'
import { PageHeader } from '../../components/ui'
import { FeedbackBanner } from '../../components/ui/FeedbackBanner'
import type { PortalKind } from '../../features/portal/PortalDashboard'
import '../../design/senior-settings.css'
import '../../design/settings-users.css'

type SettingsTab = 'profile' | 'security' | 'notifications' | 'users'
type PortalUser = OrgUser | ClientUser | JodaynUser
type CreatedCredentials = { name: string; email: string; temporaryPassword: string; reissued?: boolean }

const AVATAR_COLORS = ['#dbeafe', '#d1f0e1', '#e9d5ff', '#fde9ce', '#f4f4f5']

type SettingsPortal = PortalKind | 'superadmin'

function portalFromPath(pathname: string): SettingsPortal | null {
  if (pathname.startsWith('/super-admin')) return 'superadmin'
  if (pathname.startsWith('/org')) return 'org'
  if (pathname.startsWith('/client')) return 'client'
  if (pathname.startsWith('/jodayn')) return 'jodayn'
  return null
}

function sessionForPortal(portal: SettingsPortal | null) {
  if (portal === 'superadmin') {
    return { user: getSuperAdminUser(), token: getSuperAdminToken(), entityLabel: 'منصة TrackPlus' }
  }
  if (portal === 'org') {
    return { user: getOrgUser(), token: getOrgToken(), entityLabel: getOrgUser()?.orgName || '—' }
  }
  if (portal === 'client') {
    return { user: getClientUser(), token: getClientToken(), entityLabel: getClientUser()?.clientName || '—' }
  }
  if (portal === 'jodayn') {
    return { user: getJodaynUser(), token: getJodaynToken(), entityLabel: 'جودين' }
  }
  return { user: null, token: null, entityLabel: '—' }
}

function roleLabel(role: string) {
  if (role.endsWith('_UPPER_MGMT') || role === 'upper') return 'إدارة عليا'
  if (role.endsWith('_DATA_ENTRY') || role === 'dataEntry') return 'مدخل بيانات'
  return role || '—'
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return '—'
  return parts.slice(0, 2).map((part) => part[0]).join('')
}

function avatarColor(id: string) {
  let hash = 0
  for (const char of id) hash = (hash + char.charCodeAt(0)) % AVATAR_COLORS.length
  return AVATAR_COLORS[hash]
}

function formatJoinDate(value?: string | null) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat('ar-u-ca-gregory', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date)
}

function loginStatus(user: PortalUser) {
  if (user.isActive === false) {
    return { label: 'معلق', tone: 'suspended' as const }
  }
  if (user.pendingActivation) {
    return { label: 'غير نشط', tone: 'pending' as const }
  }
  return { label: 'نشط', tone: 'active' as const }
}

type ProfileDraft = { name: string; jobTitle: string; phone: string }
type NotificationDraft = Pick<UserPreferences, 'notifyEmail' | 'notifyInApp' | 'notifyProduct'>

const EMPTY_PROFILE: ProfileDraft = { name: '', jobTitle: '', phone: '' }
const DEFAULT_NOTIFICATIONS: NotificationDraft = { notifyEmail: true, notifyInApp: true, notifyProduct: false }

const NOTIFICATION_ROWS: Array<{ key: keyof NotificationDraft; title: string; description: string }> = [
  { key: 'notifyEmail', title: 'إشعارات البريد الالكتروني', description: 'تحديثات ومهام عبر البريد' },
  { key: 'notifyInApp', title: 'الإشعارات الفورية', description: 'تنبيهات طلبات المصادقة' },
  { key: 'notifyProduct', title: 'تحديثات المنتج والميزات الجديدة', description: 'أخبار المنصة والتحسينات' },
]

function profileDraftFrom(profile: Profile): ProfileDraft {
  return {
    name: profile.name || '',
    jobTitle: profile.preferences?.jobTitle || '',
    phone: profile.preferences?.phone || '',
  }
}

function notificationsFrom(preferences?: UserPreferences | null): NotificationDraft {
  if (!preferences) return DEFAULT_NOTIFICATIONS
  return {
    notifyEmail: preferences.notifyEmail,
    notifyInApp: preferences.notifyInApp,
    notifyProduct: preferences.notifyProduct,
  }
}

function SettingsField({
  label,
  value,
  onChange,
  type = 'text',
  dir,
  readOnly,
  autoComplete,
}: {
  label: string
  value: string
  onChange?: (value: string) => void
  type?: string
  dir?: 'ltr' | 'rtl'
  readOnly?: boolean
  autoComplete?: string
}) {
  return (
    <label className="senior-settings__field">
      <span className="senior-settings__field-label">{label}</span>
      <input
        type={type}
        dir={dir}
        placeholder={label}
        value={value}
        readOnly={readOnly}
        autoComplete={autoComplete}
        onChange={(event) => onChange?.(event.target.value)}
      />
    </label>
  )
}

export function SettingsPage() {
  const { t } = useTranslation()
  const location = useLocation()
  const { role } = useOutletContext<{ role?: AppRole } | undefined>() ?? {}
  const portal = portalFromPath(location.pathname)
  const canManageUsers = Boolean(portal && portal !== 'superadmin' && role && isUpperManagement(role))
  const [tab, setTab] = useState<SettingsTab>('profile')
  const [users, setUsers] = useState<PortalUser[]>([])
  const [usersLoading, setUsersLoading] = useState(false)
  const [usersError, setUsersError] = useState<string | null>(null)
  const [inviteOpen, setInviteOpen] = useState(false)
  const [inviteSubmitting, setInviteSubmitting] = useState(false)
  const [inviteError, setInviteError] = useState<string | null>(null)
  const [credentials, setCredentials] = useState<CreatedCredentials | null>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)

  const showActions = true
  const { user: sessionUser, token, entityLabel } = useMemo(() => sessionForPortal(portal), [portal, location.pathname])
  const [profile, setProfile] = useState<Profile | null>(null)
  const user = profile ?? sessionUser
  const [profileDraft, setProfileDraft] = useState<ProfileDraft>(EMPTY_PROFILE)
  const [notificationsDraft, setNotificationsDraft] = useState<NotificationDraft>(DEFAULT_NOTIFICATIONS)
  const [passwordForm, setPasswordForm] = useState({ current: '', next: '', confirm: '' })
  const [saving, setSaving] = useState(false)
  const [banner, setBanner] = useState<{ tone: 'success' | 'error'; text: string } | null>(null)
  const initial = user?.name?.trim()?.charAt(0) || '—'

  const applyProfile = useCallback((fresh: Profile) => {
    setProfile(fresh)
    setProfileDraft(profileDraftFrom(fresh))
    setNotificationsDraft(notificationsFrom(fresh.preferences))
  }, [])

  useEffect(() => {
    if (!token) return
    let cancelled = false
    getProfile(token)
      .then(({ user: fresh }) => {
        if (!cancelled) applyProfile(fresh)
      })
      .catch(() => {
        if (!cancelled) setProfileDraft((draft) => ({ ...draft, name: sessionUser?.name || '' }))
      })
    return () => {
      cancelled = true
    }
  }, [token, sessionUser?.name, applyProfile])

  useEffect(() => {
    if (!banner) return
    const timeoutId = window.setTimeout(() => setBanner(null), 5000)
    return () => window.clearTimeout(timeoutId)
  }, [banner])

  /** Saves every changed field across the profile, security and notification tabs. */
  async function handleSave() {
    if (!token || !portal) return
    const saved = profile ? profileDraftFrom(profile) : EMPTY_PROFILE
    const savedNotifications = notificationsFrom(profile?.preferences)
    const changes: Partial<UserPreferences> & { name?: string } = {}
    if (profileDraft.name.trim() !== saved.name) changes.name = profileDraft.name.trim()
    if (profileDraft.jobTitle.trim() !== saved.jobTitle) changes.jobTitle = profileDraft.jobTitle.trim()
    if (profileDraft.phone.trim() !== saved.phone) changes.phone = profileDraft.phone.trim()
    ;(Object.keys(notificationsDraft) as Array<keyof NotificationDraft>).forEach((key) => {
      if (notificationsDraft[key] !== savedNotifications[key]) changes[key] = notificationsDraft[key]
    })
    const wantsPassword = Boolean(passwordForm.current || passwordForm.next || passwordForm.confirm)

    if (changes.name !== undefined && !changes.name) {
      setBanner({ tone: 'error', text: 'الاسم مطلوب' })
      return
    }
    if (wantsPassword) {
      if (!passwordForm.current || !passwordForm.next) {
        setTab('security')
        setBanner({ tone: 'error', text: 'أدخل كلمة المرور الحالية والجديدة' })
        return
      }
      if (passwordForm.next !== passwordForm.confirm) {
        setTab('security')
        setBanner({ tone: 'error', text: 'كلمتا المرور غير متطابقتين' })
        return
      }
    }
    if (!Object.keys(changes).length && !wantsPassword) {
      setBanner({ tone: 'success', text: 'لا توجد تغييرات للحفظ' })
      return
    }

    setSaving(true)
    try {
      if (Object.keys(changes).length) {
        const { user: fresh } = await updateProfile(token, changes)
        applyProfile(fresh)
        if (changes.name) updateStoredUser(portal, { name: fresh.name })
      }
      if (wantsPassword) {
        await changePassword(token, { currentPassword: passwordForm.current, newPassword: passwordForm.next })
        setPasswordForm({ current: '', next: '', confirm: '' })
      }
      setBanner({ tone: 'success', text: 'تم حفظ التغييرات بنجاح' })
    } catch (error) {
      setBanner({ tone: 'error', text: error instanceof ApiError ? error.message : 'حدث خطأ ما ، يرجى المحاولة مرة أخرى' })
    } finally {
      setSaving(false)
    }
  }

  function handleCancel() {
    setProfileDraft(profile ? profileDraftFrom(profile) : { ...EMPTY_PROFILE, name: sessionUser?.name || '' })
    setNotificationsDraft(notificationsFrom(profile?.preferences))
    setPasswordForm({ current: '', next: '', confirm: '' })
    setBanner({ tone: 'error', text: 'تم إلغاء التغييرات' })
  }

  const tabs = useMemo(() => {
    const items: Array<[SettingsTab, string]> = [
      ['profile', 'الملف الشخصي'],
      ['security', 'الامان'],
      ['notifications', 'الاشعارات'],
    ]
    if (canManageUsers) items.push(['users', 'المستخدمون وإدارة الوصول'])
    return items
  }, [canManageUsers])

  const loadUsers = useCallback(async () => {
    if (!canManageUsers || !token || !portal) return
    setUsersLoading(true)
    setUsersError(null)
    try {
      if (portal === 'org') {
        const data = await getOrgUsers(token)
        setUsers(data.users)
      } else if (portal === 'client') {
        const data = await getClientUsers(token)
        setUsers(data.users)
      } else {
        const data = await getJodaynUsers(token)
        setUsers(data.users)
      }
    } catch (error) {
      setUsersError(error instanceof ApiError ? error.message : 'تعذر تحميل المستخدمين')
    } finally {
      setUsersLoading(false)
    }
  }, [canManageUsers, portal, token])

  useEffect(() => {
    if (tab === 'users') void loadUsers()
  }, [tab, loadUsers])

  useEffect(() => {
    if (!canManageUsers && tab === 'users') setTab('profile')
  }, [canManageUsers, tab])

  async function handleInvite(payload: InviteUserPayload) {
    if (!token || !portal) return
    setInviteSubmitting(true)
    setInviteError(null)
    try {
      const body = { name: payload.name, email: payload.email, accessLevel: payload.accessLevel }
      const result =
        portal === 'org'
          ? await createOrgUser(token, body)
          : portal === 'client'
            ? await createClientUser(token, body)
            : await createJodaynUser(token, body)
      setInviteOpen(false)
      setCredentials({
        name: result.user.name,
        email: result.user.email,
        temporaryPassword: result.temporaryPassword,
      })
      await loadUsers()
    } catch (error) {
      setInviteError(error instanceof ApiError ? error.message : 'تعذر إنشاء المستخدم')
    } finally {
      setInviteSubmitting(false)
    }
  }

  async function handleReissueInvite(row: PortalUser) {
    if (!token || !portal) return
    setTogglingId(row.id)
    setUsersError(null)
    try {
      const result =
        portal === 'org'
          ? await resetOrgUserCredentials(token, row.id)
          : portal === 'client'
            ? await resetClientUserCredentials(token, row.id)
            : await resetJodaynUserCredentials(token, row.id)
      setCredentials({
        name: row.name,
        email: row.email,
        temporaryPassword: result.temporaryPassword,
        reissued: true,
      })
    } catch (error) {
      setUsersError(error instanceof ApiError ? error.message : 'تعذر إصدار بيانات دخول جديدة')
    } finally {
      setTogglingId(null)
    }
  }

  async function handleToggle(id: string) {
    if (!token || !portal) return
    setTogglingId(id)
    try {
      if (portal === 'org') await toggleOrgUser(token, id)
      else if (portal === 'client') await toggleClientUser(token, id)
      else await toggleJodaynUser(token, id)
      await loadUsers()
    } catch (error) {
      setUsersError(error instanceof ApiError ? error.message : 'تعذر تحديث حالة الحساب')
    } finally {
      setTogglingId(null)
    }
  }

  return (
    <div className="dashboard-page senior-settings">
      <PageHeader className="page-header--senior" title={t('settings')} />
      {banner ? (
        <FeedbackBanner tone={banner.tone} onClose={() => setBanner(null)}>
          {banner.text}
        </FeedbackBanner>
      ) : null}
      <div className="tenants-body senior-settings__content" dir="rtl">
        <div className="senior-settings__tabs" role="tablist" aria-label={t('settings')}>
          {tabs.map(([id, label], index) => (
            <div className="senior-settings__tab-slot" key={id}>
              {index > 0 ? <span className="senior-settings__tab-divider" aria-hidden /> : null}
              <button
                type="button"
                role="tab"
                aria-selected={tab === id}
                className={`senior-settings__tab ${tab === id ? 'senior-settings__tab--active' : ''}`}
                onClick={() => setTab(id)}
              >
                {label}
              </button>
            </div>
          ))}
        </div>

        {tab === 'profile' ? (
          <section className="senior-settings__card senior-settings__card--profile" aria-labelledby="profile-heading">
            <div className="senior-settings__card-title" id="profile-heading">المعلومات الشخصية</div>
            <div className="senior-settings__separator" />
            <div className="senior-settings__identity">
              <div className="senior-settings__avatar-image" aria-hidden>
                <span className="app-sidebar__avatar">{initial}</span>
              </div>
              <div className="senior-settings__identity-copy">
                <span className="senior-settings__identity-name">{user?.name || '—'}</span>
                <span className="senior-settings__identity-email">
                  {user?.email || '—'} · {roleLabel(user?.role || role || '')} · {entityLabel}
                </span>
              </div>
            </div>
            <div className="senior-settings__profile-grid">
              <SettingsField
                label="المسمى الوظيفي"
                value={profileDraft.jobTitle}
                onChange={(value) => setProfileDraft((draft) => ({ ...draft, jobTitle: value }))}
              />
              <SettingsField
                label="الاسم الكامل"
                value={profileDraft.name}
                onChange={(value) => setProfileDraft((draft) => ({ ...draft, name: value }))}
              />
              <SettingsField
                label="رقم الجوال"
                value={profileDraft.phone}
                dir="ltr"
                type="tel"
                onChange={(value) => setProfileDraft((draft) => ({ ...draft, phone: value }))}
              />
              <SettingsField label="البريد الالكتروني" value={user?.email || ''} dir="ltr" readOnly />
            </div>
          </section>
        ) : null}

        {tab === 'security' ? (
          <section className="senior-settings__card senior-settings__card--security" aria-labelledby="security-heading">
            <div className="senior-settings__card-title" id="security-heading">إعادة تعيين كلمة المرور</div>
            <div className="senior-settings__separator" />
            <SettingsField
              label="كلمة المرور الحالية"
              type="password"
              dir="ltr"
              autoComplete="current-password"
              value={passwordForm.current}
              onChange={(value) => setPasswordForm((prev) => ({ ...prev, current: value }))}
            />
            <SettingsField
              label="كلمة المرور الجديدة"
              type="password"
              dir="ltr"
              autoComplete="new-password"
              value={passwordForm.next}
              onChange={(value) => setPasswordForm((prev) => ({ ...prev, next: value }))}
            />
            <SettingsField
              label="تأكيد كلمة المرور الجديدة"
              type="password"
              dir="ltr"
              autoComplete="new-password"
              value={passwordForm.confirm}
              onChange={(value) => setPasswordForm((prev) => ({ ...prev, confirm: value }))}
            />
          </section>
        ) : null}

        {tab === 'notifications' ? (
          <section className="senior-settings__card" aria-labelledby="notifications-heading">
            <div className="senior-settings__card-title" id="notifications-heading">الاشعارات</div>
            <div className="senior-settings__separator" />
            {NOTIFICATION_ROWS.map(({ key, title, description }) => (
              <div className="senior-settings__notification-row" key={key}>
                <button
                  type="button"
                  role="switch"
                  aria-checked={notificationsDraft[key]}
                  aria-label={title}
                  className={`senior-settings__toggle ${notificationsDraft[key] ? 'senior-settings__toggle--on' : ''}`}
                  onClick={() => setNotificationsDraft((draft) => ({ ...draft, [key]: !draft[key] }))}
                >
                  <span className="senior-settings__toggle-dot" />
                </button>
                <div className="senior-settings__notification-copy">
                  <span className="senior-settings__field-value senior-settings__field-value--dark">{title}</span>
                  <span className="senior-settings__field-value senior-settings__field-value--muted">{description}</span>
                </div>
              </div>
            ))}
            <div className="senior-settings__separator" />
          </section>
        ) : null}

        {tab !== 'users' ? (
          <div className="senior-settings__actions">
            <button
              type="button"
              className="senior-settings__button senior-settings__button--cancel"
              disabled={saving}
              onClick={handleCancel}
            >
              الغاء
            </button>
            <button
              type="button"
              className="senior-settings__button senior-settings__button--save"
              disabled={saving}
              onClick={() => void handleSave()}
            >
              {saving ? 'جاري الحفظ...' : 'حفظ التغييرات'}
            </button>
          </div>
        ) : null}

        {tab === 'users' && canManageUsers ? (
          <section className="senior-settings__card senior-settings__card--users">
            <div className="senior-settings__users-toolbar">
              <h3 className="senior-settings__users-title">
                <Users size={15} strokeWidth={2} />
                المستخدمون وإدارة الوصول
                <span className="td-section__title-count">{users.length}</span>
              </h3>
              <button type="button" className="td-add-user-btn" onClick={() => { setInviteError(null); setInviteOpen(true) }}>
                <span>دعوة مستخدم</span>
                <span className="td-add-user-btn__plus" aria-hidden>+</span>
              </button>
            </div>
            <div className="senior-settings__separator" />
            {usersError ? <p className="td-add-user-error">{usersError}</p> : null}
            <div className={`td-users-table senior-settings__users-table`}>
              <div className={`td-users-row td-users-row--head ${showActions ? '' : 'td-users-row--no-actions'}`}>
                <span className="td-users-head-cell">المستخدم</span>
                <span className="td-users-head-cell">الصلاحية / الدور</span>
                <span className="td-users-head-cell">الحالة</span>
                <span className="td-users-head-cell">تاريخ الانضمام</span>
                {showActions ? <span className="td-users-head-cell">إجراءات</span> : null}
              </div>
              {usersLoading ? (
                <div style={{ padding: '24px 0', color: '#a1a1aa', fontSize: 13, fontWeight: 600, textAlign: 'center' }}>
                  جاري التحميل...
                </div>
              ) : null}
              {!usersLoading &&
                users.map((row) => {
                  const status = loginStatus(row)
                  const showInviteLink = Boolean(row.pendingActivation) && row.isActive !== false
                  return (
                    <div
                      className={`td-users-row ${showActions ? '' : 'td-users-row--no-actions'}`}
                      key={row.id}
                    >
                      <div className="td-user-identity">
                        <div className="td-user-avatar" style={{ background: avatarColor(row.id) }}>
                          {initials(row.name)}
                        </div>
                        <div>
                          <p className="td-user-name">{row.name}</p>
                          <p className="td-user-email">{row.email}</p>
                        </div>
                      </div>
                      <span
                        className={`td-role-badge ${
                          row.role.endsWith('_UPPER_MGMT') ? 'td-role-badge--admin' : 'td-role-badge--user'
                        }`}
                      >
                        {roleLabel(row.role)}
                      </span>
                      <span className={`td-user-status td-user-status--${status.tone}`}>
                        <span className="td-status-dot" />
                        {status.label}
                      </span>
                      <span className="td-user-joined">{formatJoinDate(row.createdAt)}</span>
                      {showActions ? (
                        <div className="td-user-actions">
                          {showInviteLink ? (
                            <button
                              type="button"
                              className="td-user-btn td-user-btn--activate"
                              disabled={togglingId === row.id}
                              onClick={() => void handleReissueInvite(row)}
                            >
                              <KeyRound size={11} strokeWidth={2.5} /> بيانات دخول جديدة
                            </button>
                          ) : null}
                          {row.id !== user?.id ? (
                          <button
                            type="button"
                            className={`td-user-btn ${row.isActive === false ? 'td-user-btn--activate' : 'td-user-btn--danger'}`}
                            disabled={togglingId === row.id}
                            onClick={() => void handleToggle(row.id)}
                          >
                            {row.isActive === false ? (
                              <>
                                <UserCheck size={11} strokeWidth={2.5} /> تفعيل
                              </>
                            ) : (
                              <>
                                <UserX size={11} strokeWidth={2.5} /> تعليق
                              </>
                            )}
                          </button>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                  )
                })}
              {!usersLoading && users.length === 0 ? (
                <div style={{ padding: '24px 0', color: '#a1a1aa', fontSize: 13, fontWeight: 600, textAlign: 'center' }}>
                  لا يوجد مستخدمون مضافون بعد
                </div>
              ) : null}
            </div>
          </section>
        ) : null}
      </div>

      {inviteOpen && portal ? (
        <InviteUserModal
          portal={portal as PortalKind}
          submitting={inviteSubmitting}
          error={inviteError}
          onClose={() => !inviteSubmitting && setInviteOpen(false)}
          onSubmit={(payload) => void handleInvite(payload)}
        />
      ) : null}

      {credentials ? (
        <CredentialsModal
          name={credentials.name}
          email={credentials.email}
          temporaryPassword={credentials.temporaryPassword}
          reissued={credentials.reissued}
          onClose={() => setCredentials(null)}
        />
      ) : null}
    </div>
  )
}
