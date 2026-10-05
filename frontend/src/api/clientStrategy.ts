import { apiRequest } from './client'

export type ClientStrategyDocument = {
  id: string
  title: string
  fileUrl: string
  fileType?: string | null
  status?: string | null
  clientId: string
  createdAt?: string
}

export type ClientGoalLinkedProject = {
  id: string
  name: string
  status?: string | null
  progressPct?: number
  endDate?: string | null
}

export type ClientGoalProjectLink = {
  id: string
  projectId: string
  project?: ClientGoalLinkedProject | null
}

export type ClientStrategicGoal = {
  id: string
  documentId: string
  clientId: string
  title: string
  description?: string | null
  requiredOutputsCount?: number
  startDate?: string | null
  endDate?: string | null
  status?: string | null
  progressPct?: number
  achievementPct?: number
  isAiExtracted?: boolean
  aiSummary?: string | null
  stages?: unknown[]
  projectLinks?: ClientGoalProjectLink[]
  kpiSnapshots?: unknown[]
  createdAt?: string
  updatedAt?: string
}

export function getClientDocuments(token: string) {
  return apiRequest<{ count: number; documents: ClientStrategyDocument[] }>(
    '/client/strategy/documents',
    { method: 'GET', token },
  )
}

export function createClientDocument(
  token: string,
  data: { title: string; fileUrl: string; fileType?: string; status?: string },
) {
  return apiRequest<{ success: boolean; document: ClientStrategyDocument }>(
    '/client/strategy/documents',
    {
      method: 'POST',
      token,
      body: JSON.stringify(data),
    },
  )
}

export function getClientGoals(token: string, params?: { documentId?: string; status?: string }) {
  const qs = new URLSearchParams()
  if (params?.documentId) qs.set('documentId', params.documentId)
  if (params?.status) qs.set('status', params.status)
  const query = qs.toString()
  return apiRequest<{ count: number; goals: ClientStrategicGoal[] }>(
    `/client/strategy/goals${query ? `?${query}` : ''}`,
    { method: 'GET', token },
  )
}

export function getClientGoalById(token: string, id: string) {
  return apiRequest<{ goal: ClientStrategicGoal }>(`/client/strategy/goals/${id}`, {
    method: 'GET',
    token,
  })
}

export function createClientGoalLink(token: string, goalId: string, projectId: string) {
  return apiRequest<{ success: boolean; link: ClientGoalProjectLink }>(
    `/client/strategy/goals/${goalId}/links`,
    {
      method: 'POST',
      token,
      body: JSON.stringify({ projectId, isAiLinked: false }),
    },
  )
}

export function createClientGoal(
  token: string,
  data: {
    documentId: string
    title: string
    description?: string
    requiredOutputsCount?: number
    startDate?: string
    endDate?: string
    status?: string
    progressPct?: number
    achievementPct?: number
    isAiExtracted?: boolean
    aiSummary?: string
  },
) {
  return apiRequest<{ success: boolean; goal: ClientStrategicGoal }>('/client/strategy/goals', {
    method: 'POST',
    token,
    body: JSON.stringify(data),
  })
}
