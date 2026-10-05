import { apiRequest } from './client'

export type AuthUser = {
  id: string
  name: string
  email: string
  role: string
  orgId?: string
  clientId?: string
  orgName?: string | null
  clientName?: string | null
}

export type LoginResponse = {
  token: string
  user: AuthUser
}

export function loginSuperAdmin(email: string, password: string) {
  return apiRequest<LoginResponse>('/auth/super-admin/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
}

export function loginOrg(email: string, password: string) {
  return apiRequest<LoginResponse>('/auth/org/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
}

export function loginClient(email: string, password: string) {
  return apiRequest<LoginResponse>('/auth/client/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
}

export function loginJodayn(email: string, password: string) {
  return apiRequest<LoginResponse>('/auth/jodayn/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
}

export type ForgotPasswordType = 'SUPER_ADMIN' | 'JODAYN' | 'ORG' | 'CLIENT'

export function requestPasswordReset(email: string, type: ForgotPasswordType) {
  return apiRequest<{ success: boolean; token?: string }>('/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email, type }),
  })
}

export function resetPassword(token: string, newPassword: string) {
  return apiRequest<{ success: boolean; message?: string }>('/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({ token, newPassword }),
  })
}
