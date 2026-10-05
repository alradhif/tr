import type { ClientAccount, JodaynAccount, OrgAccount } from '../../api/superAdmin'
import type { Tenant } from '../context/TenantContext'
import type { TenantRow, TenantRowStatus } from '../data/tenantsPage'
import { tenantTypeLabel, type TenantType } from './tenantTypes'

function statusFromActive(isActive: boolean): { status: TenantRowStatus; statusLabel: string } {
  if (isActive) return { status: 'active', statusLabel: 'نشط' }
  return { status: 'suspended', statusLabel: 'معلق' }
}

function formatJoin(createdAt?: string) {
  if (!createdAt) return '—'
  const d = new Date(createdAt)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('ar-SA')
}

function formatDate(value?: string | null) {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('ar-SA')
}

function packageLabel(name?: string | null) {
  if (!name) return '—'
  const labels: Record<string, string> = {
    FREE: 'Free',
    DEMO: 'Demo',
    BASIC: 'Basic',
    PREMIUM: 'Premium',
    ENTERPRISE: 'Enterprise',
  }
  return labels[name] ?? name
}

function mapSubscription(sub?: OrgAccount['subscription'] | null) {
  const pkg = sub?.package
  const price = pkg?.price != null ? `${pkg.price} ر.س` : '—'
  return {
    name: packageLabel(pkg?.name),
    features: [] as string[],
    monthlyCost: price,
    renewalDate: formatDate(sub?.endDate),
  }
}

function dash(value?: string | null) {
  const v = value?.trim()
  return v ? v : '—'
}

function portalType(value: string | undefined, fallback: TenantType): TenantType {
  if (value === 'ORG' || value === 'CLIENT' || value === 'JODAYN') return value
  return fallback
}

export function orgToTenant(org: OrgAccount): Tenant {
  const { status, statusLabel } = statusFromActive(org.isActive)
  const tenantType = portalType(org.tenantType, 'ORG')
  return {
    id: `org-${org.id}`,
    name: org.name,
    status,
    statusLabel,
    joinDuration: formatJoin(org.createdAt),
    lastActivity: '—',
    entityName: org.name,
    crNumber: dash(org.crNumber),
    sector: dash(org.sector?.name ?? org.sectorId),
    adminName: dash(org.adminName),
    phone: dash(org.phone),
    email: dash(org.adminEmail ?? org.domain),
    joinDate: formatJoin(org.createdAt),
    tenantType,
    accountType: tenantTypeLabel(tenantType),
    entityType: dash(org.entityType),
    region: dash(org.region ?? org.branch),
    usedStorage: '—',
    storageLimit: '—',
    activeUsers: 0,
    userLimit: org.subscription?.package?.maxUsers ?? 0,
    package: mapSubscription(org.subscription),
    users: [],
  }
}

export function clientToTenant(client: ClientAccount): Tenant {
  const { status, statusLabel } = statusFromActive(client.isActive)
  const tenantType = portalType(client.tenantType, 'CLIENT')
  return {
    id: `client-${client.id}`,
    name: client.name,
    status,
    statusLabel,
    joinDuration: formatJoin(client.createdAt),
    lastActivity: '—',
    entityName: client.name,
    crNumber: dash(client.crNumber),
    sector: dash(client.sector?.name ?? client.sectorId),
    adminName: dash(client.adminName ?? client.managerName),
    phone: dash(client.phone),
    email: dash(client.adminEmail),
    joinDate: formatJoin(client.createdAt),
    tenantType,
    accountType: tenantTypeLabel(tenantType),
    entityType: dash(client.entityType),
    region: dash(client.region ?? client.branch),
    usedStorage: '—',
    storageLimit: '—',
    activeUsers: 0,
    userLimit: client.subscription?.package?.maxUsers ?? 0,
    package: mapSubscription(client.subscription),
    users: [],
  }
}

export function jodaynToTenant(user: JodaynAccount): Tenant {
  const { status, statusLabel } = statusFromActive(user.isActive)
  const tenantType = portalType(user.tenantType, 'JODAYN')
  return {
    id: `jodayn-${user.id}`,
    name: user.name,
    status,
    statusLabel,
    joinDuration: formatJoin(user.createdAt),
    lastActivity: '—',
    entityName: user.name,
    crNumber: '—',
    sector: '—',
    adminName: dash(user.adminName ?? user.name),
    phone: '—',
    email: dash(user.adminEmail ?? user.email),
    joinDate: formatJoin(user.createdAt),
    tenantType,
    accountType: tenantTypeLabel(tenantType),
    entityType: '—',
    region: '—',
    usedStorage: '—',
    storageLimit: '—',
    activeUsers: 1,
    userLimit: user.subscription?.package?.maxUsers ?? 0,
    package: mapSubscription(user.subscription),
    users: [],
  }
}

export function tenantToRow(tenant: Tenant): TenantRow {
  return {
    id: tenant.id,
    name: tenant.name,
    tenantType: tenant.tenantType,
    typeLabel: tenant.accountType,
    status: tenant.status,
    statusLabel: tenant.statusLabel,
    plan: tenant.package.name,
    users: tenant.activeUsers || tenant.userLimit,
    expiresAt: tenant.package.renewalDate,
  }
}

export function mapAccountsToTenants(
  orgs: OrgAccount[],
  clients: ClientAccount[],
  jodaynUsers: JodaynAccount[] = [],
): Tenant[] {
  return [
    ...orgs.map(orgToTenant),
    ...clients.map(clientToTenant),
    ...jodaynUsers.map(jodaynToTenant),
  ]
}
