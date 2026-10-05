import { apiRequest } from './client'

export type StrategyDocument = {
  id: string
  title: string
  fileUrl: string
  fileType?: string | null
  status?: string | null
  orgId: string
  createdAt?: string
}

export type GoalLinkedProject = {
  id: string
  name: string
  status?: string | null
  progressPct?: number
  endDate?: string | null
  executingCompany?: { name: string } | null
  deliverables?: Array<{ id: string; name: string; status?: string | null }>
  risks?: Array<{ id: string; probability?: string | null; impact?: string | null; status?: string | null }>
}

export type GoalProjectLink = {
  id: string
  projectId: string
  project?: GoalLinkedProject | null
}

export type StrategicGoal = {
  id: string
  documentId: string
  orgId: string
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
  projectLinks?: GoalProjectLink[]
  kpiSnapshots?: unknown[]
  createdAt?: string
  updatedAt?: string
}

export function getDocuments(token: string) {
  return apiRequest<{ count: number; documents: StrategyDocument[] }>('/org/strategy/documents', {
    method: 'GET',
    token,
  })
}

export function createDocument(
  token: string,
  data: { title: string; fileUrl: string; fileType?: string; status?: string },
) {
  return apiRequest<{ success: boolean; document: StrategyDocument }>('/org/strategy/documents', {
    method: 'POST',
    token,
    body: JSON.stringify(data),
  })
}

export function getGoals(token: string, params?: { documentId?: string }) {
  const qs = new URLSearchParams()
  if (params?.documentId) qs.set('documentId', params.documentId)
  const query = qs.toString()
  return apiRequest<{ count: number; goals: StrategicGoal[] }>(
    `/org/strategy/goals${query ? `?${query}` : ''}`,
    { method: 'GET', token },
  )
}

export function createGoal(
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
  return apiRequest<{ success: boolean; goal: StrategicGoal }>('/org/strategy/goals', {
    method: 'POST',
    token,
    body: JSON.stringify(data),
  })
}

export function getGoalById(token: string, id: string) {
  return apiRequest<{ goal: StrategicGoal }>(`/org/strategy/goals/${id}`, {
    method: 'GET',
    token,
  })
}

export function createGoalLink(token: string, goalId: string, projectId: string) {
  return apiRequest<{ success: boolean; link: GoalProjectLink }>(`/org/strategy/goals/${goalId}/links`, {
    method: 'POST',
    token,
    body: JSON.stringify({ projectId, isAiLinked: false }),
  })
}

export function updateGoal(
  token: string,
  id: string,
  data: {
    title?: string
    description?: string
    startDate?: string
    endDate?: string
    status?: string
    progressPct?: number
    achievementPct?: number
    aiSummary?: string
  },
) {
  return apiRequest<{ success: boolean; goal: StrategicGoal }>(`/org/strategy/goals/${id}`, {
    method: 'PATCH',
    token,
    body: JSON.stringify(data),
  })
}

export function deleteGoal(token: string, id: string) {
  return apiRequest<{ success: boolean }>(`/org/strategy/goals/${id}`, {
    method: 'DELETE',
    token,
  })
}
