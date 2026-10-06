import { apiRequest } from './client'

export type Profile = {
  id: string
  name: string
  email: string
  role: string
  type: string
  orgName?: string | null
  clientName?: string | null
  createdAt?: string | null
  activatedAt?: string | null
  lastLoginAt?: string | null
  preferences?: UserPreferences
}

export type UserPreferences = {
  jobTitle: string | null
  phone: string | null
  notifyEmail: boolean
  notifyInApp: boolean
  notifyProduct: boolean
}

export function getProfile(token: string) {
  return apiRequest<{ user: Profile }>('/me', { method: 'GET', token })
}

export function updateProfile(token: string, data: { name?: string } & Partial<UserPreferences>) {
  return apiRequest<{ success: boolean; user: Profile }>('/me', { method: 'PATCH', token, body: JSON.stringify(data) })
}

export function changePassword(token: string, data: { currentPassword: string; newPassword: string }) {
  return apiRequest<{ success: boolean }>('/me/password', { method: 'POST', token, body: JSON.stringify(data) })
}

export type DashboardPortal = 'org' | 'client' | 'jodayn' | 'superadmin'
export type SavedLayout = { widgetIds: string[]; layout: unknown[]; updatedAt?: string }

export function getDashboardLayout(token: string, portal: DashboardPortal) {
  return apiRequest<{ layout: SavedLayout | null }>(`/me/dashboard-layout/${portal}`, { method: 'GET', token })
}

export function saveDashboardLayout(token: string, portal: DashboardPortal, data: { widgetIds: string[]; layout: unknown[] }) {
  return apiRequest<{ success: boolean; layout: SavedLayout }>(`/me/dashboard-layout/${portal}`, {
    method: 'PUT',
    token,
    body: JSON.stringify(data),
  })
}

export function resetDashboardLayout(token: string, portal: DashboardPortal) {
  return apiRequest<{ success: boolean }>(`/me/dashboard-layout/${portal}`, { method: 'DELETE', token })
}

export type SearchResult = { kind: string; label: string; link: string }

export function searchPortal(token: string, q: string) {
  return apiRequest<{ results: SearchResult[] }>(`/search?q=${encodeURIComponent(q)}`, { method: 'GET', token })
}

export type AppNotification = {
  id: string
  title: string
  message: string
  type: 'APPROVAL' | 'REJECTION' | 'REVIEW' | 'SYSTEM'
  link?: string | null
  isRead: boolean
  createdAt: string
}

export function getNotifications(token: string) {
  return apiRequest<{ count: number; unreadCount: number; notifications: AppNotification[] }>('/notifications', {
    method: 'GET',
    token,
  })
}

export function markNotificationRead(token: string, id: string) {
  return apiRequest<{ success: boolean }>(`/notifications/${id}/read`, { method: 'PATCH', token })
}

export function markAllNotificationsRead(token: string) {
  return apiRequest<{ success: boolean }>('/notifications/read-all', { method: 'PATCH', token })
}

export function askAssistant(token: string, message: string, file?: File | null) {
  let body: BodyInit = JSON.stringify({ message })
  if (file) {
    const form = new FormData()
    form.append('message', message)
    form.append('file', file)
    body = form
  }
  return apiRequest<{ configured: boolean; reply: string }>('/ai/assistant', { method: 'POST', token, body })
}

export function extractFromDocument(token: string, kind: 'project' | 'goal' | 'scenario' | 'contract', file: File) {
  const body = new FormData()
  body.append('kind', kind)
  body.append('file', file)
  return apiRequest<{ configured: boolean; fields: Record<string, unknown> }>('/ai/extract', { method: 'POST', token, body })
}

/** Downloads an authenticated file (CSV export etc.) and saves it in the browser. */
export async function downloadWithToken(path: string, token: string, filename: string) {
  const { getApiUrl } = await import('./client')
  const response = await fetch(`${getApiUrl()}${path}`, { headers: { Authorization: `Bearer ${token}` } })
  if (!response.ok) {
    const data = await response.json().catch(() => ({}))
    throw new Error((data as { message?: string }).message || `Download failed (${response.status})`)
  }
  saveBlob(await response.blob(), filename)
}

/** Filenames stay ASCII: some browsers drop non-Latin download names and save the file as "download". */
export function saveBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/** Builds a UTF-8 CSV (with BOM so Excel shows Arabic correctly) and downloads it. */
export function downloadCsv(filename: string, columns: Array<[string, string]>, rows: Array<Record<string, unknown>>) {
  const cell = (value: unknown) => {
    const text = value === null || value === undefined ? '' : String(value)
    return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
  }
  const csv = [columns.map(([, label]) => cell(label)).join(','), ...rows.map((row) => columns.map(([key]) => cell(row[key])).join(','))].join('\n')
  saveBlob(new Blob([`﻿${csv}`], { type: 'text/csv;charset=utf-8' }), filename)
}

/** Every signed-in portal keeps its token in session storage under its own key. */
export function tokenForPath(pathname: string): string | null {
  const key = pathname.startsWith('/org')
    ? 'trackplus.org.token'
    : pathname.startsWith('/client')
      ? 'trackplus.client.token'
      : pathname.startsWith('/jodayn')
        ? 'trackplus.jodayn.token'
        : pathname.startsWith('/super-admin')
          ? 'trackplus.superAdmin.token'
          : null
  return key ? sessionStorage.getItem(key) : null
}
