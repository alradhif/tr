export const TENANT_TYPES = ['ORG', 'CLIENT', 'JODAYN'] as const

export type TenantType = (typeof TENANT_TYPES)[number]

export const TENANT_TYPE_LABELS: Record<TenantType, string> = {
  ORG: 'Organization',
  CLIENT: 'Client',
  JODAYN: 'Jodayn',
}

export function isTenantType(value: string): value is TenantType {
  return TENANT_TYPES.includes(value as TenantType)
}

export function tenantTypeLabel(type?: string | null): string {
  if (type === 'ORG') return TENANT_TYPE_LABELS.ORG
  if (type === 'CLIENT') return TENANT_TYPE_LABELS.CLIENT
  if (type === 'JODAYN') return TENANT_TYPE_LABELS.JODAYN
  return type?.trim() || '—'
}
