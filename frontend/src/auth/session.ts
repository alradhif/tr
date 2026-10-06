import { clearClientSession } from './clientAuth'
import { clearJodaynSession } from './jodaynAuth'
import { clearOrgSession } from './orgAuth'
import { clearPendingLogin } from './pendingLogin'
import { clearSuperAdminSession } from './superAdminAuth'

/** Drops every portal session, e.g. when the server no longer accepts the stored token. */
export function clearAllSessions() {
  clearOrgSession()
  clearClientSession()
  clearJodaynSession()
  clearSuperAdminSession()
  clearPendingLogin()
}

const USER_KEYS = {
  org: 'trackplus.org.user',
  client: 'trackplus.client.user',
  jodayn: 'trackplus.jodayn.user',
  superadmin: 'trackplus.superAdmin.user',
} as const

/** Keeps the cached session user in sync after a profile change saved on the server. */
export function updateStoredUser(portal: keyof typeof USER_KEYS, changes: Record<string, unknown>) {
  const key = USER_KEYS[portal]
  try {
    const current = JSON.parse(sessionStorage.getItem(key) || 'null')
    if (current) sessionStorage.setItem(key, JSON.stringify({ ...current, ...changes }))
  } catch {
    // ignore malformed cache; the next sign-in rewrites it
  }
}
