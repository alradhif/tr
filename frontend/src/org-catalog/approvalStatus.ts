import type { BadgeVariant } from '../components/ui'

export type ApprovalStatus = 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED' | string

export function approvalLabelKey(status?: string | null) {
  const value = String(status ?? '').toUpperCase()
  if (value === 'PENDING') return 'approvalStatusPending'
  if (value === 'APPROVED') return 'approvalStatusApproved'
  if (value === 'REJECTED') return 'approvalStatusRejected'
  return 'approvalStatusDraft'
}

export function approvalBadgeVariant(status?: string | null): BadgeVariant {
  const value = String(status ?? '').toUpperCase()
  if (value === 'PENDING') return 'warning'
  if (value === 'APPROVED') return 'success'
  if (value === 'REJECTED') return 'danger'
  return 'neutral'
}

export function isDraftOrRejected(status?: string | null) {
  const value = String(status ?? '').toUpperCase()
  return value === 'DRAFT' || value === 'REJECTED' || !status
}

export function isPendingApproval(status?: string | null) {
  return String(status ?? '').toUpperCase() === 'PENDING'
}
