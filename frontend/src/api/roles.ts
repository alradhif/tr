import type { ClientRole } from '../auth/clientAuth'
import type { JodaynRole } from '../auth/jodaynAuth'
import type { OrgRole } from '../auth/orgAuth'

export function mapOrgRole(backendRole: string): OrgRole | null {
  if (backendRole === 'ORG_UPPER_MGMT') return 'upper'
  if (backendRole === 'ORG_DATA_ENTRY') return 'dataEntry'
  return null
}

export function mapClientRole(backendRole: string): ClientRole | null {
  if (backendRole === 'CLIENT_UPPER_MGMT') return 'upper'
  if (backendRole === 'CLIENT_DATA_ENTRY') return 'dataEntry'
  return null
}

export function mapJodaynRole(backendRole: string): JodaynRole | null {
  if (backendRole === 'JODAYN_UPPER_MGMT') return 'upper'
  if (backendRole === 'JODAYN_DATA_ENTRY') return 'dataEntry'
  return null
}

export function orgRoleMatches(selected: OrgRole, backendRole: string) {
  return mapOrgRole(backendRole) === selected
}

export function clientRoleMatches(selected: ClientRole, backendRole: string) {
  return mapClientRole(backendRole) === selected
}

export function jodaynRoleMatches(selected: JodaynRole, backendRole: string) {
  return mapJodaynRole(backendRole) === selected
}
