import { clearAllSessions } from '../auth/session'

const API_URL = import.meta.env.VITE_API_URL ?? '/api'

export class ApiError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

type ApiRequestOptions = RequestInit & {
  token?: string
}

export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const { token, headers, ...rest } = options
  const isFormData = typeof FormData !== 'undefined' && rest.body instanceof FormData

  const response = await fetch(`${API_URL}${path}`, {
    ...rest,
    headers: {
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
  })

  const raw = await response.text()
  let data: unknown = {}
  if (raw) {
    try {
      data = JSON.parse(raw)
    } catch {
      data = { message: raw.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 180) }
    }
  }

  if (response.status === 401 && token) {
    handleExpiredSession()
  }

  if (!response.ok) {
    const message =
      typeof data === 'object' && data !== null && 'message' in data && String((data as { message: unknown }).message).trim()
        ? String((data as { message: unknown }).message)
        : `Request failed (${response.status})`
    throw new ApiError(response.status, message)
  }

  return data as T
}

/**
 * The server rejected a stored session (expired token, deactivated account, or a user
 * removed by the daily demo reset). Drop local sessions and send the user back to sign in.
 */
function handleExpiredSession() {
  clearAllSessions()
  if (typeof window === 'undefined' || window.location.pathname === '/login') return
  window.location.assign('/login?expired=1')
}

export function getApiUrl() {
  return API_URL
}
