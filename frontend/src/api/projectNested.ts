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
