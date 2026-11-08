import { apiRequest } from './client'

export type PaymentDirection = 'PAY' | 'COLLECT'

export type OrgPayment = {
  id: string
  title: string
  invoiceNumber?: string | null
  amount: number | string
  dueDate: string
  paidAt?: string | null
  paymentReference?: string | null
  recordedByName?: string | null
  project: { id: string; name: string }
  company?: { id: string; name: string } | null
}

export type OrgPaymentPayload = {
  projectId: string
  title: string
  amount: number
  dueDate: string
  invoiceNumber?: string
}

export function getOrgPayments(token: string) {
  return apiRequest<{ entityType: string | null; direction: PaymentDirection; payments: OrgPayment[] }>(
    '/org/payments',
    { method: 'GET', token },
  )
}

export function createOrgPayment(token: string, data: OrgPaymentPayload) {
  return apiRequest<{ success: boolean; payment: OrgPayment }>('/org/payments', {
    method: 'POST',
    token,
    body: JSON.stringify(data),
  })
}

export function recordOrgPayment(token: string, id: string, data: { paidAt: string; reference: string }) {
  return apiRequest<{ success: boolean; payment: OrgPayment }>(`/org/payments/${id}/record`, {
    method: 'POST',
    token,
    body: JSON.stringify(data),
  })
}

export function deleteOrgPayment(token: string, id: string) {
  return apiRequest<{ success: boolean }>(`/org/payments/${id}`, { method: 'DELETE', token })
}
