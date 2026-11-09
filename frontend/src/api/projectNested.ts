import { apiRequest } from './client'

export type ProjectPortal = 'org' | 'client'

// Org nested routes use PATCH and /team; client nested routes use PUT and /team-members.
function resourcePath(portal: ProjectPortal, resource: string) {
  if (resource === 'team') return portal === 'org' ? 'team' : 'team-members'
  return resource
}

export function updateNested(
  portal: ProjectPortal,
  token: string,
  projectId: string,
  resource: string,
  id: string,
  data: Record<string, unknown>,
) {
  return apiRequest(`/${portal}/projects/${projectId}/${resourcePath(portal, resource)}/${id}`, {
    method: portal === 'org' ? 'PATCH' : 'PUT',
    token,
    body: JSON.stringify(data),
  })
}

export function deleteNested(portal: ProjectPortal, token: string, projectId: string, resource: string, id: string) {
  return apiRequest(`/${portal}/projects/${projectId}/${resourcePath(portal, resource)}/${id}`, {
    method: 'DELETE',
    token,
  })
}

export function listNested(portal: ProjectPortal, token: string, projectId: string, resource: string) {
  return apiRequest<Record<string, unknown>>(`/${portal}/projects/${projectId}/${resourcePath(portal, resource)}`, {
    method: 'GET',
    token,
  })
}

export function decideChangeRequest(
  portal: ProjectPortal,
  token: string,
  projectId: string,
  id: string,
  decision: 'approve' | 'reject' | 'review',
  comment?: string,
) {
  return apiRequest(`/${portal}/projects/${projectId}/change-requests/${id}/${decision}`, {
    method: 'PATCH',
    token,
    body: JSON.stringify({ comment }),
  })
}

export function updateProjectStatus(portal: ProjectPortal, token: string, projectId: string, status: string) {
  return apiRequest(`/${portal}/projects/${projectId}`, {
    method: 'PUT',
    token,
    body: JSON.stringify({ status }),
  })
}

/** Sends a pending project back to Data Entry as a draft with the manager's requested changes. */
export function returnProjectForChanges(portal: 'org' | 'client', token: string, projectId: string, reason: string) {
  return apiRequest<{ success: boolean }>(`/${portal}/projects/${projectId}/return`, {
    method: 'PATCH',
    token,
    body: JSON.stringify({ reason }),
  })
}

export type DeliverableReview = {
  id: string
  name: string
  description?: string | null
  reviewStatus: 'NOT_SUBMITTED' | 'PENDING' | 'CHANGES_REQUESTED' | 'APPROVED'
  version: number
  submittedAt?: string | null
  submittedByName?: string | null
  reviewedAt?: string | null
  reviewedByName?: string | null
  reviewNote?: string | null
  attachments: Array<{ id: string; fileName: string; fileUrl: string; fileSize?: number | null; createdAt: string }>
  comments: RecordComment[]
}

export function getOrgDeliverable(token: string, projectId: string, id: string) {
  return apiRequest<{ deliverable: DeliverableReview; project: { id: string; name: string; progressPct: number } }>(
    `/org/projects/${projectId}/deliverables/${id}`,
    { method: 'GET', token },
  )
}

export function submitOrgDeliverable(token: string, projectId: string, id: string) {
  return apiRequest(`/org/projects/${projectId}/deliverables/${id}/submit`, { method: 'POST', token })
}

export function approveOrgDeliverable(token: string, projectId: string, id: string) {
  return apiRequest(`/org/projects/${projectId}/deliverables/${id}/approve`, { method: 'POST', token })
}

export function requestOrgDeliverableChanges(token: string, projectId: string, id: string, reason: string) {
  return apiRequest(`/org/projects/${projectId}/deliverables/${id}/request-changes`, {
    method: 'POST',
    token,
    body: JSON.stringify({ reason }),
  })
}

export type RecordComment = {
  id: string
  content: string
  createdAt: string
  author?: { id: string; name: string; role?: string } | null
}

export type OrgRiskDetail = {
  id: string
  name: string
  description?: string | null
  probability: string
  impact: string
  status: string
  responsibleName?: string | null
  responsiblePhone?: string | null
  responsibleEmail?: string | null
  actions: Array<{ id: string; action: string; responsibleName?: string | null }>
}

export type OrgChangeRequestDetail = {
  id: string
  title: string
  description?: string | null
  priority: string
  status: string
  impactOnCost?: string | null
  impactOnSchedule?: string | null
  submittedBy?: string | null
  submittedDate?: string | null
  createdAt: string
  requester?: { name: string; email: string } | null
}

export function getOrgRisk(token: string, projectId: string, id: string) {
  return apiRequest<{ risk: OrgRiskDetail; comments: RecordComment[]; project: { id: string; name: string } }>(
    `/org/projects/${projectId}/risks/${id}`,
    { method: 'GET', token },
  )
}

export function getOrgChangeRequest(token: string, projectId: string, id: string) {
  return apiRequest<{ request: OrgChangeRequestDetail; comments: RecordComment[]; project: { id: string; name: string } }>(
    `/org/projects/${projectId}/change-requests/${id}`,
    { method: 'GET', token },
  )
}

export function addOrgRecordComment(
  token: string,
  projectId: string,
  kind: 'risks' | 'change-requests',
  id: string,
  content: string,
) {
  return apiRequest(`/org/projects/${projectId}/${kind}/${id}/comments`, {
    method: 'POST',
    token,
    body: JSON.stringify({ content }),
  })
}

export function addOrgDeliverableComment(token: string, projectId: string, id: string, content: string) {
  return apiRequest(`/org/projects/${projectId}/deliverables/${id}/comments`, {
    method: 'POST',
    token,
    body: JSON.stringify({ content }),
  })
}
