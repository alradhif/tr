import type { AuthUser } from '../api/auth'

const TOKEN_KEY = 'trackplus.superAdmin.token'
const USER_KEY = 'trackplus.superAdmin.user'
const AUTH_KEY = 'trackplus.superAdmin.auth'
const PENDING_TOKEN_KEY = 'trackplus.superAdmin.pendingToken'
const PENDING_USER_KEY = 'trackplus.superAdmin.pendingUser'

export function setSuperAdminSession(token: string, user: AuthUser) {
  sessionStorage.setItem(TOKEN_KEY, token)
  sessionStorage.setItem(USER_KEY, JSON.stringify(user))
  sessionStorage.setItem(AUTH_KEY, '1')
  clearSuperAdminPending()
}

export function setSuperAdminPending(token: string, user: AuthUser) {
  sessionStorage.setItem(PENDING_TOKEN_KEY, token)
  sessionStorage.setItem(PENDING_USER_KEY, JSON.stringify(user))
}

export function commitSuperAdminPending() {
  const token = sessionStorage.getItem(PENDING_TOKEN_KEY)
  const raw = sessionStorage.getItem(PENDING_USER_KEY)
  if (!token || !raw) return false
  try {
    setSuperAdminSession(token, JSON.parse(raw) as AuthUser)
    return true
  } catch {
    clearSuperAdminPending()
    return false
  }
}

export function clearSuperAdminPending() {
  sessionStorage.removeItem(PENDING_TOKEN_KEY)
  sessionStorage.removeItem(PENDING_USER_KEY)
}

export function hasSuperAdminPending() {
  return Boolean(sessionStorage.getItem(PENDING_TOKEN_KEY))
}

export function clearSuperAdminSession() {
  sessionStorage.removeItem(TOKEN_KEY)
  sessionStorage.removeItem(USER_KEY)
  sessionStorage.removeItem(AUTH_KEY)
  clearSuperAdminPending()
}

export function getSuperAdminToken() {
  return sessionStorage.getItem(TOKEN_KEY)
}

export function getSuperAdminUser(): AuthUser | null {
  const raw = sessionStorage.getItem(USER_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as AuthUser
  } catch {
    return null
  }
}

export function isSuperAdminAuthenticated() {
  return sessionStorage.getItem(AUTH_KEY) === '1' && !!getSuperAdminToken()
}
