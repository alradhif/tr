import { apiRequest } from './client'

export type AccountPackage = {
  id: string
  name: string
  price?: number | string
  duration?: number
  maxUsers?: number
  maxProjects?: number
}

export type AccountSubscription = {
  id: string
  packageId: string
  startDate?: string
  endDate?: string
  status?: string
  package?: AccountPackage | null
}

export type TenantType = 'ORG' | 'CLIENT' | 'JODAYN'

export type OrgAccount = {
  id: string
  name: string
  domain?: string | null
  branch?: string | null
  entityType?: string | null
  region?: string | null
  phone?: string | null
  crNumber?: string | null
  isActive: boolean
  contractStatus?: string
  contractDuration?: number | string | null
  sectorId?: string | null
  sector?: { id: string; name: string } | null
  adminName?: string | null
  adminEmail?: string | null
  tenantType?: TenantType
  subscription?: AccountSubscription | null
  createdAt?: string
}

export type ClientAccount = {
  id: string
  name: string
  managerName?: string | null
  branch?: string | null
  entityType?: string | null
  region?: string | null
  phone?: string | null
  crNumber?: string | null
  isActive: boolean
  contractStatus?: string
  sectorId?: string | null
  sector?: { id: string; name: string } | null
  adminName?: string | null
  adminEmail?: string | null
  tenantType?: TenantType
  subscription?: AccountSubscription | null
  createdAt?: string
}

export type JodaynAccount = {
  id: string
  name: string
  email: string
  role: string
  isActive: boolean
  tenantType?: TenantType
  adminName?: string | null
  adminEmail?: string | null
  subscription?: AccountSubscription | null
  createdAt?: string
}

export type Sector = {
  id: string
  name: string
  managerName: string
  budget?: number | string | null
  profit?: number | string | null
  employeeCount?: number | null
  departmentCount?: number | null
  annualRevenue?: number | string | null
}

export type PlatformPackage = {
  id: string
  name: string
  price: number | string
  duration: number
  maxUsers: number
  maxProjects: number
  isActive?: boolean
}

export type AccountsResponse = {
  orgs: OrgAccount[]
  clients: ClientAccount[]
  jodaynUsers: JodaynAccount[]
}

export function getAccounts(token: string) {
  return apiRequest<AccountsResponse>('/super-admin/accounts', {
    method: 'GET',
    token,
  })
}

export function getSuperAdminDashboard(token: string) {
  return apiRequest<import('../features/portal/DashboardLiveContext').LiveDashboardData>(
    '/super-admin/dashboard',
    { method: 'GET', token },
  )
}

export function getPackages(token: string) {
  return apiRequest<{ packages: PlatformPackage[] }>('/super-admin/packages', {
    method: 'GET',
    token,
  })
}

export function createOrgAccount(
  token: string,
  data: {
    name: string
    domain?: string
    branch?: string
    entityType?: string
    region?: string
    phone?: string
    crNumber?: string
    sectorId?: string
    contractDuration?: number
    packageId?: string
  },
) {
  return apiRequest<{ success: boolean; org: OrgAccount }>('/super-admin/org', {
    method: 'POST',
    token,
    body: JSON.stringify(data),
  })
}

export function createTenant(
  token: string,
  data: {
    tenantType: TenantType
    name: string
    domain?: string
    branch?: string
    entityType?: string
    region?: string
    phone?: string
    crNumber?: string
    sectorId?: string
    contractDuration?: number
    packageId?: string
    managerName?: string
    managerEmail?: string
  },
) {
  return apiRequest<{
    success: boolean
    tenantType: TenantType
    org?: OrgAccount
    client?: ClientAccount
    jodaynUser?: JodaynAccount
    temporaryPassword?: string | null
  }>('/super-admin/tenants', {
    method: 'POST',
    token,
    body: JSON.stringify(data),
  })
}

export function createClientAccount(
  token: string,
  data: {
    name: string
    managerName?: string
    sectorId?: string
    branch?: string
    entityType?: string
    region?: string
    phone?: string
    crNumber?: string
    packageId?: string
  },
) {
  return apiRequest<{ success: boolean; client: ClientAccount }>('/super-admin/client', {
    method: 'POST',
    token,
    body: JSON.stringify(data),
  })
}

export function toggleAccount(token: string, type: 'org' | 'client' | 'jodayn', id: string) {
  return apiRequest<{ success: boolean; updated: unknown }>(
    `/super-admin/accounts/${type}/${id}/toggle`,
    { method: 'PATCH', token },
  )
}

export function getSectors(token: string) {
  return apiRequest<{ sectors: Sector[] }>('/super-admin/sectors', {
    method: 'GET',
    token,
  })
}

export function createSector(
  token: string,
  data: {
    name: string
    managerName: string
    budget?: number
    profit?: number
    employeeCount?: number
    departmentCount?: number
    annualRevenue?: number
  },
) {
  return apiRequest<{ success: boolean; sector: Sector }>('/super-admin/sectors', {
    method: 'POST',
    token,
    body: JSON.stringify(data),
  })
}

export function createPlatformUser(
  token: string,
  data: {
    name: string
    email: string
    portalType: 'CLIENT' | 'ORG' | 'JODAYN'
    accessLevel: 'UPPER' | 'DATA_ENTRY'
    orgId?: string
    clientId?: string
    password?: string
  },
) {
  return apiRequest<{
    success: boolean
    message?: string
    user: PlatformUser
    temporaryPassword: string
  }>('/super-admin/users', {
    method: 'POST',
    token,
    body: JSON.stringify(data),
  })
}

export function getPlatformUsers(token: string) {
  return apiRequest<{ count: number; users: PlatformUser[] }>('/super-admin/users', {
    method: 'GET',
    token,
  })
}

export type PlatformUser = {
  id: string
  name: string
  email: string
  role: string
  isActive: boolean
  portalType: 'CLIENT' | 'ORG' | 'JODAYN' | string
  accessLevel: 'UPPER' | 'DATA_ENTRY' | string
  orgId?: string | null
  clientId?: string | null
  accountName?: string | null
  createdAt?: string | null
}

export function getAuditLogs(token: string) {
  return apiRequest<{ logs: Array<Record<string, unknown>> }>('/audit-logs', {
    method: 'GET',
    token,
  })
}

/** Map Super Admin UI local package ids → backend PackageName enum */
export const UI_PLAN_TO_PACKAGE_NAME: Record<string, string> = {
  'pkg-free': 'FREE',
  'pkg-demo': 'DEMO',
  'pkg-basic': 'BASIC',
  'pkg-premium': 'PREMIUM',
  'pkg-enterprise': 'ENTERPRISE',
  free: 'FREE',
  demo: 'DEMO',
  basic: 'BASIC',
  premium: 'PREMIUM',
  enterprise: 'ENTERPRISE',
}

export function resolveBackendPackageId(
  packages: PlatformPackage[],
  planId: string,
): string | undefined {
  if (!planId) return undefined
  const direct = packages.find((p) => p.id === planId)
  if (direct) return direct.id
  const name = UI_PLAN_TO_PACKAGE_NAME[planId.toLowerCase()] ?? planId.toUpperCase()
  return packages.find((p) => p.name === name)?.id
}
