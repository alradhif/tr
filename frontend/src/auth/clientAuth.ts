import type { AuthUser } from '../api/auth'

export type ClientRole = 'upper' | 'dataEntry'

const ROLE_KEY = 'trackplus.client.role'
const TOKEN_KEY = 'trackplus.client.token'
const USER_KEY = 'trackplus.client.user'
const AUTH_KEY = 'trackplus.client.auth'

export function setClientSession(role: ClientRole, token: string, user: AuthUser) {
  sessionStorage.setItem(ROLE_KEY, role)
  sessionStorage.setItem(TOKEN_KEY, token)
  sessionStorage.setItem(USER_KEY, JSON.stringify(user))
  sessionStorage.setItem(AUTH_KEY, '1')
}

export function clearClientSession() {
  sessionStorage.removeItem(ROLE_KEY)
  sessionStorage.removeItem(TOKEN_KEY)
  sessionStorage.removeItem(USER_KEY)
  sessionStorage.removeItem(AUTH_KEY)
}

export function getClientRole(): ClientRole | null {
  const role = sessionStorage.getItem(ROLE_KEY)
  if (role === 'upper' || role === 'dataEntry') return role
  return null
}

export function getClientToken() {
  return sessionStorage.getItem(TOKEN_KEY)
}

export function getClientUser(): AuthUser | null {
  const raw = sessionStorage.getItem(USER_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as AuthUser
  } catch {
    return null
  }
}

export function isClientAuthenticated() {
  return sessionStorage.getItem(AUTH_KEY) === '1' && getClientRole() !== null && !!getClientToken()
}

export function clientRoleLabel(role: ClientRole) {
  return role === 'upper' ? 'الإدارة العليا' : 'مدخل البيانات'
}
