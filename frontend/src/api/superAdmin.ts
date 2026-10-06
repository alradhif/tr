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
  userLimit?: number | null
  storageLimitGb?: number | null
  package?: (AccountPackage & { storageGb?: number; label?: string | null; features?: string[] | null }) | null
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
  userCount?: number
  activeUsers?: number
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
  userCount?: number
  activeUsers?: number
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
  label?: string | null
  packageType?: string | null
  billingCycle?: 'MONTHLY' | 'YEARLY' | string
  storageGb?: number
  features?: string[] | null
  price: number | string
  duration: number
  maxUsers: number
  maxProjects: number
  isActive?: boolean
  tenants?: number
}

export type PackageInput = {
  label?: string
  packageType?: string
  billingCycle?: 'MONTHLY' | 'YEARLY'
  storageGb?: number
  features?: string[]
  price?: number
  maxUsers?: number
  maxProjects?: number
  isActive?: boolean
}

export function getAllPackages(token: string) {
  return apiRequest<{ packages: PlatformPackage[] }>('/super-admin/packages/all', { method: 'GET', token })
}

export function createPackage(token: string, data: PackageInput) {
  return apiRequest<{ success: boolean; package: PlatformPackage }>('/super-admin/packages', {
    method: 'POST',
    token,
    body: JSON.stringify(data),
  })
}

export function updatePackage(token: string, id: string, data: PackageInput) {
  return apiRequest<{ success: boolean; package: PlatformPackage }>(`/super-admin/packages/${id}`, {
    method: 'PATCH',
    token,
    body: JSON.stringify(data),
  })
}

export function deletePackage(token: string, id: string) {
  return apiRequest<{ success: boolean }>(`/super-admin/packages/${id}`, { method: 'DELETE', token })
}

export type AccountKind = 'org' | 'client'

export type TenantDetails = {
  account: (OrgAccount | ClientAccount) & { tenantType: TenantType; subscription?: AccountSubscription | null }
  users: Array<{
    id: string
    name: string
    email: string
    role: string
    isActive: boolean
    pendingActivation: boolean
    accessLevel: 'UPPER' | 'DATA_ENTRY'
    status: 'active' | 'pending' | 'suspended'
    statusLabel: string
    createdAt?: string
    lastLoginAt?: string | null
  }>
  usage: {
    projects: number
    activeUsers: number
    totalUsers: number
    userLimit: number | null
    storageBytes: number
    storageLimitGb: number | null
  }
  lastActivityAt: string | null
}

export function getTenantDetails(token: string, type: AccountKind, id: string) {
  return apiRequest<TenantDetails>(`/super-admin/accounts/${type}/${id}`, { method: 'GET', token })
}

export function updateTenantAccount(token: string, type: AccountKind, id: string, data: Record<string, unknown>) {
  return apiRequest<{ success: boolean }>(`/super-admin/accounts/${type}/${id}`, {
    method: 'PATCH',
    token,
    body: JSON.stringify(data),
  })
}

export function deleteTenantAccount(token: string, type: AccountKind, id: string, confirmName: string) {
  return apiRequest<{ success: boolean; deleted: { projects: number; users: number } }>(`/super-admin/accounts/${type}/${id}`, {
    method: 'DELETE',
    token,
    body: JSON.stringify({ confirmName }),
  })
}

export function notifyTenant(token: string, type: AccountKind, id: string, data: { title: string; message: string }) {
  return apiRequest<{ success: boolean; recipients: number }>(`/super-admin/accounts/${type}/${id}/notify`, {
    method: 'POST',
    token,
    body: JSON.stringify(data),
  })
}

export function updatePlatformUser(
  token: string,
  portal: 'org' | 'client' | 'jodayn',
  id: string,
  data: { accessLevel?: 'UPPER' | 'DATA_ENTRY'; isActive?: boolean; name?: string },
) {
  return apiRequest<{ success: boolean; user: PlatformUser }>(`/super-admin/users/${portal}/${id}`, {
    method: 'PATCH',
    token,
    body: JSON.stringify(data),
  })
}

export function resetPlatformUserCredentials(token: string, portal: 'org' | 'client' | 'jodayn', id: string) {
  return apiRequest<{ success: boolean; user: { id: string; name: string; email: string }; temporaryPassword: string }>(
    `/super-admin/users/${portal}/${id}/credentials`,
    { method: 'POST', token },
  )
}

export type AuditSummary = {
  periodDays: number
  failedLogins: number
  totalChanges: number
  mostActive: { userId: string; name: string | null; count: number } | null
  recentFailures: Array<{ id: string; userId: string; actorType: string; details: string | null; createdAt: string; name: string | null }>
}

export function getAuditSummary(token: string) {
  return apiRequest<AuditSummary>('/super-admin/audit/summary', { method: 'GET', token })
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
    userLimit?: number
    storageLimitGb?: number
    subscriptionStart?: string
  },
) {
  return apiRequest<{
    success: boolean
    tenantType: TenantType
    org?: OrgAccount
    client?: ClientAccount
    jodaynUser?: JodaynAccount
      temporaryPassword?: string | null
    manager?: { id: string; name: string; email: string }
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
  pendingActivation?: boolean
  status?: 'active' | 'pending' | 'suspended'
  statusLabel?: string
  lastLoginAt?: string | null
}

export function getAuditLogs(token: string) {
  return apiRequest<{ logs: Array<Record<string, unknown>> }>('/audit-logs?limit=500', {
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
