import type { AuthUser } from '../api/auth'

export type OrgRole = 'upper' | 'dataEntry'

const ROLE_KEY = 'trackplus.org.role'
const TOKEN_KEY = 'trackplus.org.token'
const USER_KEY = 'trackplus.org.user'
const AUTH_KEY = 'trackplus.org.auth'

export function setOrgSession(role: OrgRole, token: string, user: AuthUser) {
  sessionStorage.setItem(ROLE_KEY, role)
  sessionStorage.setItem(TOKEN_KEY, token)
  sessionStorage.setItem(USER_KEY, JSON.stringify(user))
  sessionStorage.setItem(AUTH_KEY, '1')
}

export function clearOrgSession() {
  sessionStorage.removeItem(ROLE_KEY)
  sessionStorage.removeItem(TOKEN_KEY)
  sessionStorage.removeItem(USER_KEY)
  sessionStorage.removeItem(AUTH_KEY)
}

export function getOrgRole(): OrgRole | null {
  const role = sessionStorage.getItem(ROLE_KEY)
  if (role === 'upper' || role === 'dataEntry') return role
  return null
}

export function getOrgToken() {
  return sessionStorage.getItem(TOKEN_KEY)
}

export function getOrgUser(): AuthUser | null {
  const raw = sessionStorage.getItem(USER_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as AuthUser
  } catch {
    return null
  }
}

export function isOrgAuthenticated() {
  return sessionStorage.getItem(AUTH_KEY) === '1' && getOrgRole() !== null && !!getOrgToken()
}

export function orgRoleLabel(role: OrgRole) {
  return role === 'upper' ? 'مدير النظام للجهة' : 'مدخل البيانات'
}
