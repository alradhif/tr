import type { AuthUser, LoginResponse } from '../api/auth'
import { loginClient, loginJodayn, loginOrg, loginSuperAdmin } from '../api/auth'
import { mapClientRole, mapJodaynRole, mapOrgRole } from '../api/roles'

export type PortalKind = 'super-admin' | 'jodayn' | 'org' | 'client'

export type ResolvedLogin = LoginResponse & {
  portal: PortalKind
}

export function destinationForPortal(portal: PortalKind) {
  if (portal === 'super-admin') return '/super-admin'
  if (portal === 'jodayn') return '/jodayn/dashboard'
  if (portal === 'org') return '/org/dashboard'
  return '/client/dashboard'
}

export function mappedRoleForLogin(portal: PortalKind, backendRole: string): 'upper' | 'dataEntry' | null {
  if (portal === 'jodayn') return mapJodaynRole(backendRole)
  if (portal === 'org') return mapOrgRole(backendRole)
  if (portal === 'client') return mapClientRole(backendRole)
  return null
}

/**
 * The backend has separate login tables. Try each portal and let the first
 * successful credential check determine the authenticated area.
 */
export async function loginWithCredentials(email: string, password: string): Promise<ResolvedLogin> {
  const attempts: Array<{ portal: PortalKind; run: () => Promise<LoginResponse> }> = [
    { portal: 'super-admin', run: () => loginSuperAdmin(email, password) },
    { portal: 'jodayn', run: () => loginJodayn(email, password) },
    { portal: 'org', run: () => loginOrg(email, password) },
    { portal: 'client', run: () => loginClient(email, password) },
  ]

  const results = await Promise.allSettled(attempts.map((item) => item.run()))
  for (let index = 0; index < results.length; index += 1) {
    const result = results[index]
    if (result.status === 'fulfilled' && result.value?.token && result.value.user) {
      return { ...result.value, portal: attempts[index].portal }
    }
  }

  throw new Error('INVALID_CREDENTIALS')
}

export function assertMappedRole(portal: PortalKind, user: AuthUser) {
  if (portal === 'super-admin') return true
  return Boolean(mappedRoleForLogin(portal, user.role))
}
