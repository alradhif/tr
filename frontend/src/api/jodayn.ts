import type { StrategicGoal } from './orgStrategy'
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
  pendingActivation?: boolean
  activatedAt?: string | null
  lastLoginAt?: string | null
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
  region?: string | null
  billingCycle?: 'MONTHLY' | 'ANNUAL' | null
  autoRenew?: boolean
  assetOwner?: string | null
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
  actualValue?: number | string
  optimisticProbability?: number | string
  conservativeProbability?: number | string
  pessimisticProbability?: number | string
  dateRangeStart?: string | null
  dateRangeEnd?: string | null
  branchFilter?: string | null
}

export type FinancialReport = {
  id: string
  type: string
  totalContractsValue: number | string
  netProfit: number | string
  netCashFlow?: number | string | null
  period?: string | null
  budgetVariance?: number | string | null
  cashFlowIn?: number | string | null
  cashFlowOut?: number | string | null
  profitTrend?: string | null
  revenueTrend?: string | null
  sectorRevenueComparison?: string | null
}

export function getInvoices(token: string) {
  return apiRequest<{ invoices: Invoice[] }>('/jodayn/invoices', { method: 'GET', token })
}

export function getInvoice(token: string, id: string) {
  return apiRequest<{ invoice: Invoice }>(`/jodayn/invoices/${id}`, { method: 'GET', token })
}

export function createInvoice(token: string, data: Record<string, unknown>) {
  return apiRequest<{ success: boolean; invoice: Invoice }>('/jodayn/invoices', {
    method: 'POST',
    token,
    body: JSON.stringify(data),
  })
}

export function getForecast(token: string, id: string) {
  return apiRequest<{ forecast: RevenueForecast }>(`/jodayn/forecasts/${id}`, { method: 'GET', token })
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

export function getReport(token: string, id: string) {
  return apiRequest<{ report: FinancialReport }>(`/jodayn/reports/${id}`, { method: 'GET', token })
}

export function createReport(token: string, data: Record<string, unknown>) {
  return apiRequest<{ success: boolean; report: FinancialReport }>('/jodayn/reports', {
    method: 'POST',
    token,
    body: JSON.stringify(data),
  })
}

/** New one-time initial password for an invited user who has not signed in yet. */
export function resetJodaynUserCredentials(token: string, id: string) {
  return apiRequest<{ success: boolean; user: { id: string; name: string; email: string }; temporaryPassword: string }>(
    `/jodayn/users/${id}/credentials`,
    { method: 'POST', token },
  )
}

export function toggleJodaynUser(token: string, id: string) {
  return apiRequest<{ success: boolean; isActive: boolean }>(`/jodayn/users/${id}/toggle`, {
    method: 'PATCH',
    token,
  })
}

export function updateInvoice(token: string, id: string, data: Record<string, unknown>) {
  return apiRequest<{ success: boolean; invoice: Invoice }>(`/jodayn/invoices/${id}`, {
    method: 'PUT',
    token,
    body: JSON.stringify(data),
  })
}

export function deleteJodaynRecord(token: string, kind: 'invoices' | 'forecasts' | 'reports', id: string) {
  return apiRequest<{ success: boolean }>(`/jodayn/${kind}/${id}`, { method: 'DELETE', token })
}

export type JodaynOwner = { ownerType: 'org' | 'client'; ownerName: string | null }

export type JodaynGoal = StrategicGoal & JodaynOwner

export type JodaynProject = JodaynOwner & {
  id: string
  name: string
  status: string
  approvalStatus: string
  progressPct: number
  startDate: string
  endDate: string
  budget: number | string
  _count?: { deliverables?: number }
}

/** Every organization's and client's strategic goals (read-only). */
export function getJodaynGoals(token: string) {
  return apiRequest<{ count: number; goals: JodaynGoal[] }>('/jodayn/goals', { method: 'GET', token })
}

/** Every organization's and client's projects (read-only). */
export function getJodaynProjects(token: string) {
  return apiRequest<{ count: number; projects: JodaynProject[] }>('/jodayn/projects', { method: 'GET', token })
}

export type JodaynClientDetail = {
  client: {
    id: string
    name: string
    managerName?: string | null
    sectorName?: string | null
    sector?: { name: string } | null
    region?: string | null
    phone?: string | null
    crNumber?: string | null
    description?: string | null
    isActive: boolean
  }
  projects: Omit<JodaynProject, 'ownerType' | 'ownerName'>[]
  users: { id: string; name: string; email: string; role: string; isActive: boolean }[]
  reports: { id: string; type: string; period?: string | null; totalContractsValue: number | string; netProfit: number | string }[]
}

/** One client account with its projects, users and financial reports. */
export function getJodaynClient(token: string, id: string) {
  return apiRequest<JodaynClientDetail>(`/jodayn/clients/${id}`, { method: 'GET', token })
}

/** One account's project with what its page shows, read-only. */
export async function getJodaynProjectDetails(token: string, kind: 'org' | 'client', id: string) {
  const path = `/jodayn/projects/${kind}/${id}`
  const [{ project }, { contracts }, { changeRequests }, { scenarios }] = await Promise.all([
    apiRequest<{ project: unknown }>(path, { method: 'GET', token }),
    apiRequest<{ contracts?: unknown[] }>(`${path}/contracts`, { method: 'GET', token }),
    apiRequest<{ changeRequests?: unknown[] }>(`${path}/change-requests`, { method: 'GET', token }),
    apiRequest<{ scenarios?: unknown[] }>(`${path}/scenarios`, { method: 'GET', token }),
  ])
  return { project, contracts: contracts ?? [], changeRequests: changeRequests ?? [], scenarios: scenarios ?? [] }
}
