import { useCallback, useEffect, useMemo, useState } from 'react'
import { useLocation, useOutletContext } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Link2, UserCheck, UserX, Users } from 'lucide-react'
import { ApiError } from '../../api/client'
import { createClientUser, getClientUsers, reissueClientInvite, toggleClientUser, type ClientUser } from '../../api/clientPortal'
import { createJodaynUser, getJodaynUsers, reissueJodaynInvite, type JodaynUser } from '../../api/jodayn'
import { createOrgUser, getOrgUsers, reissueOrgInvite, toggleOrgUser, type OrgUser } from '../../api/org'
import { getClientToken, getClientUser } from '../../auth/clientAuth'
import { getJodaynToken, getJodaynUser } from '../../auth/jodaynAuth'
import { getOrgToken, getOrgUser } from '../../auth/orgAuth'
import { isUpperManagement, type AppRole } from '../../auth/permissions'
import { CredentialsModal } from '../../components/settings/CredentialsModal'
import { InviteUserModal, type InviteUserPayload } from '../../components/settings/InviteUserModal'
import { PageHeader } from '../../components/ui'
import type { PortalKind } from '../../features/portal/PortalDashboard'
import '../../design/senior-settings.css'
import '../../design/settings-users.css'

type SettingsTab = 'profile' | 'users'
type PortalUser = OrgUser | ClientUser | JodaynUser
type CreatedCredentials = { name: string; email: string; inviteUrl: string; inviteExpiresAt?: string; reissued?: boolean }

const AVATAR_COLORS = ['#dbeafe', '#d1f0e1', '#e9d5ff', '#fde9ce', '#f4f4f5']

function portalFromPath(pathname: string): PortalKind | null {
  if (pathname.startsWith('/org')) return 'org'
  if (pathname.startsWith('/client')) return 'client'
  if (pathname.startsWith('/jodayn')) return 'jodayn'
  return null
}

function sessionForPortal(portal: PortalKind | null) {
  if (portal === 'org') {
    return { user: getOrgUser(), token: getOrgToken(), entityLabel: getOrgUser()?.orgName || '—' }
  }
  if (portal === 'client') {
    return { user: getClientUser(), token: getClientToken(), entityLabel: getClientUser()?.clientName || '—' }
  }
  if (portal === 'jodayn') {
    return { user: getJodaynUser(), token: getJodaynToken(), entityLabel: 'جدين' }
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
    return { label: 'بانتظار التفعيل', tone: 'pending' as const }
  }
  return { label: 'نشط', tone: 'active' as const }
}

export function SettingsPage() {
  const { t } = useTranslation()
  const location = useLocation()
  const { role } = useOutletContext<{ role?: AppRole }>()
  const portal = portalFromPath(location.pathname)
  const canManageUsers = Boolean(portal && role && isUpperManagement(role))
  const [tab, setTab] = useState<SettingsTab>('profile')
  const [users, setUsers] = useState<PortalUser[]>([])
  const [usersLoading, setUsersLoading] = useState(false)
  const [usersError, setUsersError] = useState<string | null>(null)
  const [inviteOpen, setInviteOpen] = useState(false)
  const [inviteSubmitting, setInviteSubmitting] = useState(false)
  const [inviteError, setInviteError] = useState<string | null>(null)
  const [credentials, setCredentials] = useState<CreatedCredentials | null>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)

  const showActions = portal !== 'jodayn' || users.some((row) => row.pendingActivation)
  const { user, token, entityLabel } = useMemo(() => sessionForPortal(portal), [portal, location.pathname])
  const initial = user?.name?.trim()?.charAt(0) || '—'

  const tabs = useMemo(() => {
    const items: Array<[SettingsTab, string]> = [['profile', 'الملف الشخصي']]
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
        inviteUrl: result.inviteUrl,
        inviteExpiresAt: result.inviteExpiresAt,
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
          ? await reissueOrgInvite(token, row.id)
          : portal === 'client'
            ? await reissueClientInvite(token, row.id)
            : await reissueJodaynInvite(token, row.id)
      setCredentials({
        name: row.name,
        email: row.email,
        inviteUrl: result.inviteUrl,
        inviteExpiresAt: result.inviteExpiresAt,
        reissued: true,
      })
    } catch (error) {
      setUsersError(error instanceof ApiError ? error.message : 'تعذر إصدار رابط الدعوة')
    } finally {
      setTogglingId(null)
    }
  }

  async function handleToggle(id: string) {
    if (!token || !portal || portal === 'jodayn') return
    setTogglingId(id)
    try {
      if (portal === 'org') await toggleOrgUser(token, id)
      else await toggleClientUser(token, id)
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
          <section className="senior-settings__card senior-settings__card--profile">
            <div className="senior-settings__card-title">المعلومات الشخصية</div>
            <div className="senior-settings__separator" />
            <div className="senior-settings__identity">
              <div className="senior-settings__avatar-image" aria-hidden>
                <span className="app-sidebar__avatar">{initial}</span>
              </div>
              <div className="senior-settings__identity-copy">
                <span className="senior-settings__identity-name">{user?.name || '—'}</span>
                <span className="senior-settings__identity-email">{user?.email || '—'}</span>
              </div>
            </div>
            <div className="senior-settings__profile-grid">
              <label className="senior-settings__field">
                <span className="senior-settings__field-label">الاسم</span>
                <input value={user?.name || ''} readOnly />
              </label>
              <label className="senior-settings__field">
                <span className="senior-settings__field-label">البريد الإلكتروني</span>
                <input dir="ltr" value={user?.email || ''} readOnly />
              </label>
              <label className="senior-settings__field">
                <span className="senior-settings__field-label">الجهة</span>
                <input value={entityLabel} readOnly />
              </label>
              <label className="senior-settings__field">
                <span className="senior-settings__field-label">الدور</span>
                <input value={roleLabel(user?.role || role || '')} readOnly />
              </label>
            </div>
          </section>
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
                              <Link2 size={11} strokeWidth={2.5} /> رابط الدعوة
                            </button>
                          ) : null}
                          {portal !== 'jodayn' && !showInviteLink ? (
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
          portal={portal}
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
          inviteUrl={credentials.inviteUrl}
          inviteExpiresAt={credentials.inviteExpiresAt}
          reissued={credentials.reissued}
          onClose={() => setCredentials(null)}
        />
      ) : null}
    </div>
  )
}
