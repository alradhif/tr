import { apiRequest } from './client'

export type ProjectAttachment = {
  id: string
  fileUrl: string
  fileName: string
  fileType?: string | null
  fileSize?: number | null
  downloadPath?: string
}

export type OrgProject = {
  id: string
  name: string
  type?: string | null
  classification?: string | null
  description?: string | null
  status: string
  approvalStatus: string
  rejectionReason?: string | null
  approvedBy?: string | null
  approvedAt?: string | null
  approvedByUser?: { id: string; name: string; email: string } | null
  createdAt?: string
  updatedAt?: string
  org?: { id: string; name: string } | null
  startDate: string
  endDate: string
  budget: number | string
  profitMargin?: number | string
  progressPct: number
  orgId: string
  managerId: string
  departmentId?: string | null
  executingCompanyId?: string | null
  orgProjectManagerName?: string | null
  clientProjectManagerName?: string | null
  orgEmail?: string | null
  clientEmail?: string | null
  orgPhone?: string | null
  clientPhone?: string | null
  scopeMain?: string | null
  scopeExcluded?: string | null
  assumptions?: string | null
  constraints?: string | null
  manager?: { id: string; name: string; email: string }
  department?: { id: string; name: string } | null
  executingCompany?: { id: string; name: string } | null
  _count?: { deliverables?: number }
  phases?: unknown[]
  teamMembers?: unknown[]
  risks?: unknown[]
  deliverables?: unknown[]
  contracts?: unknown[]
  attachments?: ProjectAttachment[]
  changeRequests?: unknown[]
  scenarioAnalyses?: unknown[]
}

export type CreateProjectPayload = {
  name: string
  type?: string
  classification?: string
  description?: string
  startDate: string
  endDate: string
  budget?: number
  profitMargin?: number
  managerId: string
  departmentId?: string
  executingCompanyId?: string
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

export function getPendingProjects(token: string) {
  return apiRequest<{ count: number; projects: OrgProject[] }>('/org/projects/pending', {
    method: 'GET',
    token,
  })
}

export function submitProject(token: string, id: string) {
  return apiRequest<{ success: boolean; project: OrgProject; message?: string }>(
    `/org/projects/${id}/submit`,
    { method: 'POST', token },
  )
}

export function getProjects(token: string, params?: { status?: string; approvalStatus?: string }) {
  const qs = new URLSearchParams()
  if (params?.status) qs.set('status', params.status)
  if (params?.approvalStatus) qs.set('approvalStatus', params.approvalStatus)
  const query = qs.toString()
  return apiRequest<{ count: number; projects: OrgProject[] }>(
    `/org/projects${query ? `?${query}` : ''}`,
    { method: 'GET', token },
  )
}

export function getProjectById(token: string, id: string) {
  return apiRequest<{ project: OrgProject }>(`/org/projects/${id}`, {
    method: 'GET',
    token,
  })
}

export function createProject(token: string, data: CreateProjectPayload) {
  return apiRequest<{ success: boolean; project: OrgProject; message?: string }>('/org/projects', {
    method: 'POST',
    token,
    body: JSON.stringify(data),
  })
}

export function updateProject(token: string, id: string, data: Partial<CreateProjectPayload>) {
  return apiRequest<{ success: boolean; project: OrgProject }>(`/org/projects/${id}`, {
    method: 'PUT',
    token,
    body: JSON.stringify(data),
  })
}

export function approveProject(token: string, id: string) {
  return apiRequest<{ success: boolean; project: OrgProject }>(`/org/projects/${id}/approve`, {
    method: 'PATCH',
    token,
  })
}

export function rejectProject(token: string, id: string, reason: string) {
  return apiRequest<{ success: boolean; project: OrgProject }>(`/org/projects/${id}/reject`, {
    method: 'PATCH',
    token,
    body: JSON.stringify({ reason }),
  })
}

export function deleteProject(token: string, id: string) {
  return apiRequest<{ success: boolean }>(`/org/projects/${id}`, {
    method: 'DELETE',
    token,
  })
}

// Nested helpers
export function getProjectPhases(token: string, projectId: string) {
  return apiRequest<{ phases: Array<Record<string, unknown>> }>(
    `/org/projects/${projectId}/phases`,
    { method: 'GET', token },
  )
}

export function createProjectPhase(
  token: string,
  projectId: string,
  data: Record<string, unknown>,
) {
  return apiRequest(`/org/projects/${projectId}/phases`, {
    method: 'POST',
    token,
    body: JSON.stringify(data),
  })
}

export function updateProjectPhase(
  token: string,
  projectId: string,
  phaseId: string,
  data: Record<string, unknown>,
) {
  return apiRequest(`/org/projects/${projectId}/phases/${phaseId}`, {
    method: 'PATCH',
    token,
    body: JSON.stringify(data),
  })
}

export function getProjectTeam(token: string, projectId: string) {
  return apiRequest<{ teamMembers: Array<Record<string, unknown>> }>(
    `/org/projects/${projectId}/team`,
    { method: 'GET', token },
  )
}

export function createProjectTeamMember(
  token: string,
  projectId: string,
  data: Record<string, unknown>,
) {
  return apiRequest(`/org/projects/${projectId}/team`, {
    method: 'POST',
    token,
    body: JSON.stringify(data),
  })
}

export function getProjectContracts(token: string, projectId: string) {
  return apiRequest<{ contracts: Array<Record<string, unknown>> }>(
    `/org/projects/${projectId}/contracts`,
    { method: 'GET', token },
  )
}

export function createProjectContract(
  token: string,
  projectId: string,
  data: Record<string, unknown>,
) {
  return apiRequest(`/org/projects/${projectId}/contracts`, {
    method: 'POST',
    token,
    body: JSON.stringify(data),
  })
}

export function getProjectRisks(token: string, projectId: string) {
  return apiRequest<{ risks: Array<Record<string, unknown>> }>(
    `/org/projects/${projectId}/risks`,
    { method: 'GET', token },
  )
}

export function createProjectRisk(
  token: string,
  projectId: string,
  data: Record<string, unknown>,
) {
  return apiRequest(`/org/projects/${projectId}/risks`, {
    method: 'POST',
    token,
    body: JSON.stringify(data),
  })
}

export function getProjectDeliverables(token: string, projectId: string) {
  return apiRequest<{ deliverables: Array<Record<string, unknown>> }>(
    `/org/projects/${projectId}/deliverables`,
    { method: 'GET', token },
  )
}

export function createProjectDeliverable(
  token: string,
  projectId: string,
  data: Record<string, unknown>,
) {
  return apiRequest(`/org/projects/${projectId}/deliverables`, {
    method: 'POST',
    token,
    body: JSON.stringify(data),
  })
}

export function updateProjectDeliverable(
  token: string,
  projectId: string,
  id: string,
  data: Record<string, unknown>,
) {
  return apiRequest(`/org/projects/${projectId}/deliverables/${id}`, {
    method: 'PATCH',
    token,
    body: JSON.stringify(data),
  })
}

export function getProjectAttachments(token: string, projectId: string) {
  return apiRequest<{ count: number; attachments: ProjectAttachment[] }>(
    `/org/projects/${projectId}/attachments`,
    { method: 'GET', token },
  )
}

export function uploadProjectAttachments(token: string, projectId: string, files: File[]) {
  const body = new FormData()
  files.forEach((file) => body.append('files', file))
  return apiRequest<{ success: boolean; attachments: ProjectAttachment[] }>(
    `/org/projects/${projectId}/attachments`,
    { method: 'POST', token, body },
  )
}

export function deleteProjectAttachment(token: string, projectId: string, id: string) {
  return apiRequest<{ success: boolean }>(`/org/projects/${projectId}/attachments/${id}`, {
    method: 'DELETE',
    token,
  })
}

export function getProjectChangeRequests(token: string, projectId: string) {
  return apiRequest<{ changeRequests: Array<Record<string, unknown>> }>(
    `/org/projects/${projectId}/change-requests`,
    { method: 'GET', token },
  )
}

export function createProjectChangeRequest(
  token: string,
  projectId: string,
  data: Record<string, unknown>,
) {
  return apiRequest(`/org/projects/${projectId}/change-requests`, {
    method: 'POST',
    token,
    body: JSON.stringify(data),
  })
}

export function getProjectScenarios(token: string, projectId: string) {
  return apiRequest<{ scenarios: Array<Record<string, unknown>> }>(
    `/org/projects/${projectId}/scenarios`,
    { method: 'GET', token },
  )
}

export function createProjectScenario(
  token: string,
  projectId: string,
  data: Record<string, unknown>,
) {
  return apiRequest(`/org/projects/${projectId}/scenarios`, {
    method: 'POST',
    token,
    body: JSON.stringify(data),
  })
}
