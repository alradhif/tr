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
