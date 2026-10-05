import type { AuthUser } from '../api/auth'

export type JodaynRole = 'upper' | 'dataEntry'

const ROLE_KEY = 'trackplus.jodayn.role'
const TOKEN_KEY = 'trackplus.jodayn.token'
const USER_KEY = 'trackplus.jodayn.user'
const AUTH_KEY = 'trackplus.jodayn.auth'

export function setJodaynSession(role: JodaynRole, token: string, user: AuthUser) {
  sessionStorage.setItem(ROLE_KEY, role)
  sessionStorage.setItem(TOKEN_KEY, token)
  sessionStorage.setItem(USER_KEY, JSON.stringify(user))
  sessionStorage.setItem(AUTH_KEY, '1')
}

export function clearJodaynSession() {
  sessionStorage.removeItem(ROLE_KEY)
  sessionStorage.removeItem(TOKEN_KEY)
  sessionStorage.removeItem(USER_KEY)
  sessionStorage.removeItem(AUTH_KEY)
}

export function getJodaynRole(): JodaynRole | null {
  const role = sessionStorage.getItem(ROLE_KEY)
  if (role === 'upper' || role === 'dataEntry') return role
  return null
}

export function getJodaynToken() {
  return sessionStorage.getItem(TOKEN_KEY)
}

export function getJodaynUser(): AuthUser | null {
  const raw = sessionStorage.getItem(USER_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as AuthUser
  } catch {
    return null
  }
}

export function isJodaynAuthenticated() {
  return sessionStorage.getItem(AUTH_KEY) === '1' && getJodaynRole() !== null && !!getJodaynToken()
}

export function jodaynRoleLabel(role: JodaynRole) {
  return role === 'upper' ? 'الإدارة العليا - جودين' : 'مدخل البيانات - جودين'
}
