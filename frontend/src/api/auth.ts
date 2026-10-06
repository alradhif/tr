import { apiRequest } from './client'

export type AuthUser = {
  id: string
  name: string
  email: string
  role: string
  orgId?: string
  clientId?: string
  type?: 'SUPER_ADMIN' | 'JODAYN' | 'ORG' | 'CLIENT'
  orgName?: string | null
  clientName?: string | null
}

export type LoginResponse = {
  token: string
  user: AuthUser
}

export type LoginChallenge = {
  otpRequired: true
  challengeId: string
  expiresAt: string
  resendAfterSeconds: number
  /** Only returned by demo / non-production servers, which have no mail delivery. */
  demoCode?: string
}

export function startLogin(email: string, password: string) {
  return apiRequest<LoginChallenge>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
}

export function verifyLoginCode(challengeId: string, code: string) {
  return apiRequest<LoginResponse>('/auth/login/verify', {
    method: 'POST',
    body: JSON.stringify({ challengeId, code }),
  })
}

export function resendLoginCode(challengeId: string) {
  return apiRequest<LoginChallenge>('/auth/login/resend', {
    method: 'POST',
    body: JSON.stringify({ challengeId }),
  })
}

export type InvitePreview = {
  name: string
  email: string
  role: string
  type: 'JODAYN' | 'ORG' | 'CLIENT'
  orgName?: string | null
  clientName?: string | null
  expiresAt: string
}

export function getInvite(token: string) {
  return apiRequest<InvitePreview>(`/auth/invite/${encodeURIComponent(token)}`, { method: 'GET' })
}

export function activateAccount(token: string, password: string) {
  return apiRequest<{ success: boolean; email: string }>('/auth/activate', {
    method: 'POST',
    body: JSON.stringify({ token, password }),
  })
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
