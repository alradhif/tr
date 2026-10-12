import type { AuthUser } from '../api/auth'
import { mapClientRole, mapJodaynRole, mapOrgRole } from '../api/roles'

export type PortalKind = 'super-admin' | 'jodayn' | 'org' | 'client'

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

export function portalForUserType(type: AuthUser['type']): PortalKind | null {
  if (type === 'SUPER_ADMIN') return 'super-admin'
  if (type === 'JODAYN') return 'jodayn'
  if (type === 'ORG') return 'org'
  if (type === 'CLIENT') return 'client'
  return null
}

export function assertMappedRole(portal: PortalKind, user: AuthUser) {
  if (portal === 'super-admin') return true
  return Boolean(mappedRoleForLogin(portal, user.role))
}
