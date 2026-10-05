import { apiRequest } from './client'
import type { LiveDashboardData } from '../features/portal/DashboardLiveContext'

export type ClientDashboard = LiveDashboardData & {
  totalProjects: number
  activeProjects: number
  completedProjects: number
  onHoldProjects: number
  pendingRequests: number
}

export type ClientProject = {
  id: string
  name: string
  type?: string | null
  classification?: string | null
  description?: string | null
  status: string
  approvalStatus?: string
  rejectionReason?: string | null
  approvedBy?: string | null
  approvedAt?: string | null
  approvedByUser?: { id: string; name: string; email: string } | null
  startDate: string
  endDate: string
  budget: number | string
  progressPct: number
  managerId: string
  manager?: { id: string; name: string; email: string }
  client?: { id: string; name: string } | null
  orgProjectManagerName?: string | null
  clientProjectManagerName?: string | null
  scopeMain?: string | null
  scopeExcluded?: string | null
  assumptions?: string | null
  constraints?: string | null
  _count?: { deliverables?: number }
  phases?: unknown[]
  teamMembers?: unknown[]
  risks?: unknown[]
  deliverables?: unknown[]
  attachments?: Array<{
    id: string
    fileUrl: string
    fileName: string
    fileType?: string | null
    fileSize?: number | null
  }>
}

export type CreateClientProjectPayload = {
  name: string
  startDate: string
  endDate: string
  managerId: string
  type?: string
  classification?: string
  description?: string
  budget?: number
  orgProjectManagerName?: string
  clientProjectManagerName?: string
  orgEmail?: string
  clientEmail?: string
  orgPhone?: string
  clientPhone?: string
  scopeMain?: string
  scopeExcluded?: string
  assumptions?: string
  constraints?: string
}

export type ClientUser = {
  id: string
  name: string
  email: string
  role: string
  isActive: boolean
  pendingActivation?: boolean
  activatedAt?: string | null
  createdAt?: string | null
}

export function createClientUser(
  token: string,
  data: { name: string; email: string; accessLevel: 'UPPER' | 'DATA_ENTRY' },
) {
  return apiRequest<{ success: boolean; user: ClientUser; inviteUrl: string; inviteExpiresAt: string }>('/client/users', {
    method: 'POST',
    token,
    body: JSON.stringify(data),
  })
}

export function getClientDashboard(token: string) {
  return apiRequest<ClientDashboard>('/client/dashboard', { method: 'GET', token })
}

export function getClientUsers(token: string) {
  return apiRequest<{ users: ClientUser[] }>('/client/users', { method: 'GET', token })
}

export function toggleClientUser(token: string, id: string) {
  return apiRequest<{ success: boolean; isActive: boolean }>(`/client/users/${id}/toggle`, {
    method: 'PATCH',
    token,
  })
}

export function getClientProjects(token: string) {
  return apiRequest<{ projects: ClientProject[] }>('/client/projects', {
    method: 'GET',
    token,
  })
}

export function getClientProjectById(token: string, id: string) {
  return apiRequest<{ project: ClientProject }>(`/client/projects/${id}`, {
    method: 'GET',
    token,
  })
}

export function createClientProject(token: string, data: CreateClientProjectPayload) {
  return apiRequest<{ success: boolean; project: ClientProject; message?: string }>('/client/projects', {
    method: 'POST',
    token,
    body: JSON.stringify(data),
  })
}

export function updateClientProject(
  token: string,
  id: string,
  data: Partial<CreateClientProjectPayload> & { status?: string },
) {
  return apiRequest<{ success: boolean; project: ClientProject }>(`/client/projects/${id}`, {
    method: 'PUT',
    token,
    body: JSON.stringify(data),
  })
}

export function submitClientProject(token: string, id: string) {
  return apiRequest<{ success: boolean; project: ClientProject; message?: string }>(
    `/client/projects/${id}/submit`,
    { method: 'POST', token },
  )
}

export function approveClientProject(token: string, id: string) {
  return apiRequest<{ success: boolean; project: ClientProject }>(`/client/projects/${id}/approve`, {
    method: 'PATCH',
    token,
  })
}

export function rejectClientProject(token: string, id: string, reason: string) {
  return apiRequest<{ success: boolean; project: ClientProject }>(`/client/projects/${id}/reject`, {
    method: 'PATCH',
    token,
    body: JSON.stringify({ reason }),
  })
}

export function deleteClientProject(token: string, id: string) {
  return apiRequest<{ success: boolean }>(`/client/projects/${id}`, {
    method: 'DELETE',
    token,
  })
}

export function createClientNested(
  token: string,
  projectId: string,
  resource: string,
  data: Record<string, unknown>,
) {
  return apiRequest(`/client/projects/${projectId}/${resource}`, {
    method: 'POST',
    token,
    body: JSON.stringify(data),
  })
}

export function getClientNested(token: string, projectId: string, resource: string) {
  return apiRequest<Record<string, unknown[]>>(`/client/projects/${projectId}/${resource}`, {
    method: 'GET',
    token,
  })
}

export function updateClientNested(
  token: string,
  projectId: string,
  resource: string,
  id: string,
  data: Record<string, unknown>,
) {
  return apiRequest(`/client/projects/${projectId}/${resource}/${id}`, {
    method: 'PUT',
    token,
    body: JSON.stringify(data),
  })
}

export function uploadClientProjectAttachments(token: string, projectId: string, files: File[]) {
  const body = new FormData()
  files.forEach((file) => body.append('files', file))
  return apiRequest<{
    success: boolean
    attachments: Array<{
      id: string
      fileUrl: string
      fileName: string
      fileType?: string | null
      fileSize?: number | null
    }>
  }>(`/client/projects/${projectId}/attachments`, {
    method: 'POST',
    token,
    body,
  })
}

export function deleteClientProjectAttachment(token: string, projectId: string, id: string) {
  return apiRequest<{ success: boolean }>(`/client/projects/${projectId}/attachments/${id}`, {
    method: 'DELETE',
    token,
  })
}

export function reissueClientInvite(token: string, id: string) {
  return apiRequest<{ success: boolean; inviteUrl: string; inviteExpiresAt: string }>(`/client/users/${id}/invite`, {
    method: 'POST',
    token,
  })
}
