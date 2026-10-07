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

const PERIOD_NAME: Record<string, string> = {
  Q1: 'الربع الأول',
  Q2: 'الربع الثاني',
  Q3: 'الربع الثالث',
  Q4: 'الربع الرابع',
  H1: 'النصف الأول',
  H2: 'النصف الثاني',
}

/** Arabic name of a quarter / half code (Q1 → الربع الأول), or the code itself. */
export function periodName(code: string) {
  return PERIOD_NAME[code] ?? code
}

/** Period column text: quarters stay as "Q1 2026", halves read "النصف الثاني 2026". */
export function periodLabel(code: string, year: number | string) {
  return code.startsWith('H') ? `${periodName(code)} ${year}` : `${code} ${year}`
}
