import type { AuthUser } from '../api/auth'
import { setClientSession } from './clientAuth'
import {
  destinationForPortal,
  mappedRoleForLogin,
  type PortalKind,
} from './resolveLogin'
import { setJodaynSession } from './jodaynAuth'
import { setOrgSession } from './orgAuth'
import { setSuperAdminSession } from './superAdminAuth'

const KEY = 'trackplus.pendingLogin'

export type PendingLogin = {
  portal: PortalKind
  token: string
  user: AuthUser
}

export function setPendingLogin(pending: PendingLogin) {
  sessionStorage.setItem(KEY, JSON.stringify(pending))
}

export function getPendingLogin(): PendingLogin | null {
  const raw = sessionStorage.getItem(KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as PendingLogin
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

/** Commits the pending session after OTP and returns the destination path. */
export function commitPendingLogin(): string | null {
  const pending = getPendingLogin()
  if (!pending) return null

  if (pending.portal === 'super-admin') {
    setSuperAdminSession(pending.token, pending.user)
    clearPendingLogin()
    return destinationForPortal('super-admin')
  }

  const role = mappedRoleForLogin(pending.portal, pending.user.role)
  if (!role) {
    clearPendingLogin()
    return null
  }

  if (pending.portal === 'jodayn') {
    setJodaynSession(role, pending.token, pending.user)
  } else if (pending.portal === 'org') {
    setOrgSession(role, pending.token, pending.user)
  } else {
    setClientSession(role, pending.token, pending.user)
  }

  clearPendingLogin()
  return destinationForPortal(pending.portal)
}
