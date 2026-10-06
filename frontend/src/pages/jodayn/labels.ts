import type { BadgeVariant } from '../../components/ui/Badge'

const CONTRACT_STATUS: Record<string, { label: string; variant: BadgeVariant }> = {
  ACTIVE: { label: 'ساري', variant: 'success' },
  UPCOMING: { label: 'قادم', variant: 'info' },
  EXPIRED: { label: 'منتهي', variant: 'neutral' },
  CANCELLED: { label: 'ملغى', variant: 'danger' },
}

export function contractStatusBadge(status?: string | null): { label: string; variant: BadgeVariant } {
  if (!status) return { label: '—', variant: 'neutral' }
  return CONTRACT_STATUS[status] ?? { label: status, variant: 'neutral' }
}

const REPORT_TYPE_KEY: Record<string, string> = {
  EXECUTIVE: 'reportExecutive',
  PROFIT_LOSS: 'reportProfitLoss',
  RISK: 'reportRisk',
}

export function reportTypeLabel(type: string, t: (key: string) => string) {
  return REPORT_TYPE_KEY[type] ? t(REPORT_TYPE_KEY[type]) : type
}
