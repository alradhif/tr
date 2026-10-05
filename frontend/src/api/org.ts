import { apiRequest } from './client'
import type { LiveDashboardData } from '../features/portal/DashboardLiveContext'

export type OrgDashboard = LiveDashboardData & {
  totalProjects: number
  activeProjects: number
  completedProjects: number
  onHoldProjects: number
  pendingRequests: number
}

export type OrgUser = {
  id: string
  name: string
  email: string
  role: string
  isActive: boolean
  pendingActivation?: boolean
  activatedAt?: string | null
  createdAt?: string | null
}

export type CreatePortalUserResult = {
  success: boolean
  user: OrgUser
  inviteUrl: string
  inviteExpiresAt: string
}

export function createOrgUser(
  token: string,
  data: { name: string; email: string; accessLevel: 'UPPER' | 'DATA_ENTRY' },
) {
  return apiRequest<CreatePortalUserResult>('/org/users', {
    method: 'POST',
    token,
    body: JSON.stringify(data),
  })
}

export type Department = {
  id: string
  name: string
  type?: string | null
  managerName?: string | null
  email?: string | null
  phone?: string | null
  employeeCount: number
  description?: string | null
  isActive: boolean
  createdAt?: string
  employees?: unknown[]
}

export type ExecutingCompany = {
  id: string
  name: string
  registrationNo?: string | null
  managerName?: string | null
  email?: string | null
  phone?: string | null
  teamCount: number
  description?: string | null
  isActive: boolean
}

export function getOrgDashboard(token: string) {
  return apiRequest<OrgDashboard>('/org/dashboard', { method: 'GET', token })
}

export function getOrgUsers(token: string) {
  return apiRequest<{ users: OrgUser[] }>('/org/users', { method: 'GET', token })
}

export function toggleOrgUser(token: string, id: string) {
  return apiRequest<{ success: boolean; isActive: boolean }>(`/org/users/${id}/toggle`, {
    method: 'PATCH',
    token,
  })
}

export function getDepartments(token: string) {
  return apiRequest<{ departments: Department[] }>('/org/departments', {
    method: 'GET',
    token,
  })
}

export type DepartmentEmployee = {
  id: string
  name: string
  email?: string | null
  role?: string | null
}

export type DepartmentPayload = {
  name: string
  type?: string
  managerName?: string
  email?: string
  phone?: string
  description?: string
}

export function createDepartment(token: string, data: DepartmentPayload) {
  return apiRequest<{ success: boolean; department: Department }>('/org/departments', {
    method: 'POST',
    token,
    body: JSON.stringify(data),
  })
}

export function getDepartmentById(token: string, id: string) {
  return apiRequest<{ department: Department }>(`/org/departments/${id}`, {
    method: 'GET',
    token,
  })
}

export function updateDepartment(token: string, id: string, data: Partial<DepartmentPayload>) {
  return apiRequest<{ success: boolean; department: Department }>(`/org/departments/${id}`, {
    method: 'PATCH',
    token,
    body: JSON.stringify(data),
  })
}

export function deleteDepartment(token: string, id: string) {
  return apiRequest<{ success: boolean }>(`/org/departments/${id}`, {
    method: 'DELETE',
    token,
  })
}

export function getDepartmentEmployees(token: string, id: string) {
  return apiRequest<{ employees: DepartmentEmployee[] }>(`/org/departments/${id}/employees`, {
    method: 'GET',
    token,
  })
}

export function createDepartmentEmployee(
  token: string,
  id: string,
  data: { name: string; email?: string; role?: string },
) {
  return apiRequest<{ success: boolean; employee: DepartmentEmployee }>(
    `/org/departments/${id}/employees`,
    { method: 'POST', token, body: JSON.stringify(data) },
  )
}

export function deleteDepartmentEmployee(token: string, id: string, empId: string) {
  return apiRequest<{ success: boolean }>(`/org/departments/${id}/employees/${empId}`, {
    method: 'DELETE',
    token,
  })
}

export function getCompanies(token: string) {
  return apiRequest<{ companies: ExecutingCompany[] }>('/org/companies', {
    method: 'GET',
    token,
  })
}

export type CompanyTeamMember = {
  id: string
  name: string
  email?: string | null
  role?: string | null
}

export type CompanyPayload = {
  name: string
  registrationNo?: string
  managerName?: string
  email?: string
  phone?: string
  description?: string
  teamCount?: number
}

export function createCompany(token: string, data: CompanyPayload) {
  return apiRequest<{ success: boolean; company: ExecutingCompany }>('/org/companies', {
    method: 'POST',
    token,
    body: JSON.stringify(data),
  })
}

export function getCompanyById(token: string, id: string) {
  return apiRequest<{ company: ExecutingCompany & { team?: CompanyTeamMember[] } }>(
    `/org/companies/${id}`,
    { method: 'GET', token },
  )
}

export function updateCompany(token: string, id: string, data: Partial<CompanyPayload>) {
  return apiRequest<{ success: boolean; company: ExecutingCompany }>(`/org/companies/${id}`, {
    method: 'PATCH',
    token,
    body: JSON.stringify(data),
  })
}

export function deleteCompany(token: string, id: string) {
  return apiRequest<{ success: boolean }>(`/org/companies/${id}`, {
    method: 'DELETE',
    token,
  })
}

export function getCompanyTeam(token: string, id: string) {
  return apiRequest<{ team: CompanyTeamMember[] }>(`/org/companies/${id}/team`, {
    method: 'GET',
    token,
  })
}

export function createCompanyTeamMember(
  token: string,
  id: string,
  data: { name: string; email?: string; role?: string },
) {
  return apiRequest<{ success: boolean; member: CompanyTeamMember }>(`/org/companies/${id}/team`, {
    method: 'POST',
    token,
    body: JSON.stringify(data),
  })
}

export function deleteCompanyTeamMember(token: string, id: string, memberId: string) {
  return apiRequest<{ success: boolean }>(`/org/companies/${id}/team/${memberId}`, {
    method: 'DELETE',
    token,
  })
}

export function reissueOrgInvite(token: string, id: string) {
  return apiRequest<{ success: boolean; inviteUrl: string; inviteExpiresAt: string }>(`/org/users/${id}/invite`, {
    method: 'POST',
    token,
  })
}
