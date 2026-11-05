import type { AuthUser, LoginChallenge } from '../api/auth'
import { setClientSession } from './clientAuth'
import {
  destinationForPortal,
  mappedRoleForLogin,
  portalForUserType,
  type PortalKind,
} from './resolveLogin'
import { setJodaynSession } from './jodaynAuth'
import { setOrgSession } from './orgAuth'
import { setSuperAdminSession } from './superAdminAuth'

const KEY = 'trackplus.pendingLogin'
const PASSWORD_CHANGE_KEY = 'trackplus.pendingPasswordChange'

/** A password check that passed and is waiting for its one-time code. No session exists yet. */
export type PendingLogin = Omit<LoginChallenge, 'otpRequired'> & {
  email: string
}

export function setPendingLogin(pending: PendingLogin) {
  sessionStorage.setItem(KEY, JSON.stringify(pending))
}

export function getPendingLogin(): PendingLogin | null {
  const raw = sessionStorage.getItem(KEY)
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as PendingLogin
    if (!parsed?.challengeId) throw new Error('stale pending login')
    return parsed
  } catch {
    clearPendingLogin()
    return null
  }
}

export function clearPendingLogin() {
  sessionStorage.removeItem(KEY)
}

export function hasPendingLogin() {
  return Boolean(getPendingLogin())
}

/** A verified sign-in held back from the portal until the temporary password is changed. */
export type PendingPasswordChange = { token: string; user: AuthUser }

export function setPendingPasswordChange(pending: PendingPasswordChange) {
  clearPendingLogin()
  sessionStorage.setItem(PASSWORD_CHANGE_KEY, JSON.stringify(pending))
}

export function getPendingPasswordChange(): PendingPasswordChange | null {
  const raw = sessionStorage.getItem(PASSWORD_CHANGE_KEY)
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as PendingPasswordChange
    if (!parsed?.token) throw new Error('stale pending password change')
    return parsed
  } catch {
    clearPendingPasswordChange()
    return null
  }
}

export function clearPendingPasswordChange() {
  sessionStorage.removeItem(PASSWORD_CHANGE_KEY)
}

/** Stores a server-issued session for the user's portal and returns the destination path. */
export function commitSession(token: string, user: AuthUser, portalHint?: PortalKind): string | null {
  clearPendingLogin()
  const portal = portalForUserType(user.type) ?? portalHint
  if (!portal) return null

  if (portal === 'super-admin') {
    setSuperAdminSession(token, user)
    return destinationForPortal('super-admin')
  }

  const role = mappedRoleForLogin(portal, user.role)
  if (!role) return null

  if (portal === 'jodayn') {
    setJodaynSession(role, token, user)
  } else if (portal === 'org') {
    setOrgSession(role, token, user)
  } else {
    setClientSession(role, token, user)
  }

  return destinationForPortal(portal)
}
