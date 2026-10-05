import { apiRequest } from './client'
import type { LiveDashboardData } from '../features/portal/DashboardLiveContext'

export type JodaynDashboard = LiveDashboardData & {
  sectorCount: number
  orgAccounts: number
  clientAccounts: number
  pendingInvoices: number
}

export function getJodaynDashboard(token: string) {
  return apiRequest<JodaynDashboard>('/jodayn/dashboard', { method: 'GET', token })
}

export type JodaynUser = {
  id: string
  name: string
  email: string
  role: string
  isActive: boolean
  activatedAt?: string | null
  createdAt?: string | null
}

export function getJodaynUsers(token: string) {
  return apiRequest<{ users: JodaynUser[] }>('/jodayn/users', { method: 'GET', token })
}

export function createJodaynUser(
  token: string,
  data: { name: string; email: string; accessLevel: 'UPPER' | 'DATA_ENTRY' },
) {
  return apiRequest<{ success: boolean; user: JodaynUser; temporaryPassword: string }>('/jodayn/users', {
    method: 'POST',
    token,
    body: JSON.stringify(data),
  })
}

export type Invoice = {
  id: string
  invoiceNumber: string
  amount: number | string
  remainingAmount: number | string
  vatRate: number | string
  vatAmount: number | string
  totalWithVat: number | string
  clientName: string
  contractReference?: string | null
  projectName?: string | null
  issueDate: string
  dueDate: string
  status: string
}

export type RevenueForecast = {
  id: string
  quarter: string
  year: number
  optimisticValue: number | string
  pessimisticValue: number | string
  conservativeValue: number | string
  branchFilter?: string | null
}

export type FinancialReport = {
  id: string
  type: string
  totalContractsValue: number | string
  netProfit: number | string
  netCashFlow?: number | string | null
  period?: string | null
}

export function getInvoices(token: string) {
  return apiRequest<{ invoices: Invoice[] }>('/jodayn/invoices', { method: 'GET', token })
}

export function createInvoice(token: string, data: Record<string, unknown>) {
  return apiRequest<{ success: boolean; invoice: Invoice }>('/jodayn/invoices', {
    method: 'POST',
    token,
    body: JSON.stringify(data),
  })
}

export function getForecasts(token: string) {
  return apiRequest<{ forecasts: RevenueForecast[] }>('/jodayn/forecasts', {
    method: 'GET',
    token,
  })
}

export function createForecast(token: string, data: Record<string, unknown>) {
  return apiRequest<{ success: boolean; forecast: RevenueForecast }>('/jodayn/forecasts', {
    method: 'POST',
    token,
    body: JSON.stringify(data),
  })
}

export function getReports(token: string) {
  return apiRequest<{ reports: FinancialReport[] }>('/jodayn/reports', {
    method: 'GET',
    token,
  })
}

export function createReport(token: string, data: Record<string, unknown>) {
  return apiRequest<{ success: boolean; report: FinancialReport }>('/jodayn/reports', {
    method: 'POST',
    token,
    body: JSON.stringify(data),
  })
}
