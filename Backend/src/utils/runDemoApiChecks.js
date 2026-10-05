const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '../../.env') })
const { getDatabaseName } = require('../lib/demoSafety')
const jwt = require('jsonwebtoken')
const prisma = require('../lib/prisma')

const BASE = 'http://localhost:5001/api'

function expect(condition, label) {
  if (!condition) {
    console.error(`FAIL: ${label}`)
    process.exitCode = 1
    return
  }
  console.log(`PASS: ${label}`)
}

async function request(path, options = {}, token) {
  const headers = { ...(options.headers || {}) }
  if (options.body && !headers['Content-Type']) headers['Content-Type'] = 'application/json'
  if (token) headers.Authorization = `Bearer ${token}`
  const response = await fetch(`${BASE}${path}`, { ...options, headers })
  const data = await response.json().catch(() => ({}))
  return { status: response.status, data }
}

async function passwordLogin(email, password) {
  const started = await request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) })
  if (started.status !== 200 || !started.data.challengeId) return started
  return request('/auth/login/verify', {
    method: 'POST',
    body: JSON.stringify({ challengeId: started.data.challengeId, code: started.data.demoCode }),
  })
}

async function main() {
  const databaseName = getDatabaseName()
  if (databaseName !== 'trackplus_demo') {
    console.error('API checks refused: active database is not trackplus_demo')
    process.exit(1)
  }

  const invalid = await request('/auth/login', { method: 'POST', body: JSON.stringify({ email: 'nobody@example.com', password: 'wrongpass' }) })
  expect(invalid.status === 400 && invalid.data.message === 'بيانات الدخول غير صحيحة', 'invalid login')

  const roles = [
    'ORG_UPPER_MGMT',
    'ORG_DATA_ENTRY',
    'CLIENT_UPPER_MGMT',
    'CLIENT_DATA_ENTRY',
    'JODAYN_UPPER_MGMT',
    'JODAYN_DATA_ENTRY',
  ]
  const sessions = {}
  for (const role of roles) {
    const result = await request('/auth/demo/login', { method: 'POST', body: JSON.stringify({ role }) })
    expect(result.status === 200 && Boolean(result.data.token) && result.data.user.role === role, `demo login ${role}`)
    sessions[role] = result.data
  }

  const started = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'seed.orguser.entry@acme.com', password: 'Demo1234' }),
  })
  expect(started.status === 200 && started.data.otpRequired === true && !started.data.token, 'password step issues no session, only a code challenge')
  const wrongCode = await request('/auth/login/verify', {
    method: 'POST',
    body: JSON.stringify({ challengeId: started.data.challengeId, code: started.data.demoCode === '000000' ? '111111' : '000000' }),
  })
  expect(wrongCode.status === 400 && !wrongCode.data.token, 'wrong login code rejected')
  const normal = await request('/auth/login/verify', {
    method: 'POST',
    body: JSON.stringify({ challengeId: started.data.challengeId, code: started.data.demoCode }),
  })
  expect(normal.status === 200 && Boolean(normal.data.token) && normal.data.user.role === 'ORG_DATA_ENTRY', 'normal login org data entry')
  const replayed = await request('/auth/login/verify', {
    method: 'POST',
    body: JSON.stringify({ challengeId: started.data.challengeId, code: started.data.demoCode }),
  })
  expect(replayed.status === 400 && !replayed.data.token, 'login code cannot be reused')

  const legacyLogin = await request('/auth/org/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'seed.orguser.entry@acme.com', password: 'Demo1234' }),
  })
  expect(legacyLogin.status === 200 && !legacyLogin.data.token && legacyLogin.data.otpRequired === true, 'per-portal login also requires the code step')

  const staleToken = jwt.sign({ userId: '00000000-0000-0000-0000-000000000000', role: 'ORG_UPPER_MGMT', orgId: sessions.ORG_UPPER_MGMT.user.orgId, type: 'ORG' }, process.env.JWT_SECRET, { expiresIn: '1h' })
  const stale = await request('/org/dashboard', {}, staleToken)
  expect(stale.status === 401, 'session for a user removed by the daily reset returns 401')

  const draftBody = {
    name: 'مشروع اعتماد تجريبي',
    startDate: '2026-01-01',
    endDate: '2026-12-31',
    budget: 1000,
    managerId: sessions.ORG_DATA_ENTRY.user.id,
  }
  const created = await request('/org/projects', {
    method: 'POST',
    body: JSON.stringify(draftBody),
  }, sessions.ORG_DATA_ENTRY.token)
  expect(created.status === 200 && created.data.project?.approvalStatus === 'DRAFT', `data entry creates DRAFT (got ${created.status} ${created.data.project?.approvalStatus || created.data.message || ''})`)
  const projectId = created.data.project?.id

  const persisted = await request(`/org/projects/${projectId}`, {}, sessions.ORG_DATA_ENTRY.token)
  expect(persisted.status === 200 && persisted.data.project?.id === projectId && persisted.data.project?.name === draftBody.name, 'created project survives refetch')

  const submitted = await request(`/org/projects/${projectId}/submit`, { method: 'POST' }, sessions.ORG_DATA_ENTRY.token)
  expect(submitted.status === 200 && submitted.data.project?.approvalStatus === 'PENDING', `data entry submit DRAFT→PENDING (got ${submitted.status} ${submitted.data.project?.approvalStatus || submitted.data.message || ''})`)

  const upperSubmit = await request(`/org/projects/${projectId}/submit`, { method: 'POST' }, sessions.ORG_UPPER_MGMT.token)
  expect(upperSubmit.status === 403, 'upper management cannot submit')

  const deApprove = await request(`/org/projects/${projectId}/approve`, { method: 'PATCH' }, sessions.ORG_DATA_ENTRY.token)
  expect(deApprove.status === 403, 'data entry cannot approve')

  const pending = await request('/org/projects/pending', {}, sessions.ORG_UPPER_MGMT.token)
  expect(pending.status === 200 && pending.data.projects.some((project) => project.id === projectId), 'upper management pending list includes submitted project')

  const approved = await request(`/org/projects/${projectId}/approve`, { method: 'PATCH' }, sessions.ORG_UPPER_MGMT.token)
  expect(
    approved.status === 200 && approved.data.project?.approvalStatus === 'APPROVED' && approved.data.project?.approvedBy === sessions.ORG_UPPER_MGMT.user.id,
    `upper management approve PENDING→APPROVED (got ${approved.status} ${approved.data.project?.approvalStatus || approved.data.message || ''})`,
  )

  const reread = await request(`/org/projects/${projectId}`, {}, sessions.ORG_DATA_ENTRY.token)
  expect(
    reread.status === 200 && reread.data.project?.approvalStatus === 'APPROVED' && reread.data.project?.approvedBy === sessions.ORG_UPPER_MGMT.user.id && Boolean(reread.data.project?.approvedAt),
    'data entry reread shows APPROVED with approver',
  )

  const second = await request('/org/projects', {
    method: 'POST',
    body: JSON.stringify({
      name: 'مشروع للرفض',
      startDate: '2026-02-01',
      endDate: '2026-11-30',
      managerId: sessions.ORG_DATA_ENTRY.user.id,
    }),
  }, sessions.ORG_DATA_ENTRY.token)
  const rejectId = second.data.project?.id
  const submittedReject = await request(`/org/projects/${rejectId}/submit`, { method: 'POST' }, sessions.ORG_DATA_ENTRY.token)
  expect(submittedReject.status === 200 && submittedReject.data.project?.approvalStatus === 'PENDING', 'second project submitted PENDING')
  const rejected = await request(`/org/projects/${rejectId}/reject`, {
    method: 'PATCH',
    body: JSON.stringify({ reason: 'نقص في البيانات' }),
  }, sessions.ORG_UPPER_MGMT.token)
  expect(
    rejected.status === 200 && rejected.data.project?.approvalStatus === 'REJECTED' && rejected.data.project?.rejectionReason === 'نقص في البيانات',
    'upper management reject PENDING→REJECTED with reason',
  )
  const resubmitted = await request(`/org/projects/${rejectId}/submit`, { method: 'POST' }, sessions.ORG_DATA_ENTRY.token)
  expect(resubmitted.status === 200 && resubmitted.data.project?.approvalStatus === 'PENDING', 'data entry resubmits REJECTED→PENDING')

  const clientUpperList = await request('/client/projects', {}, sessions.CLIENT_UPPER_MGMT.token)
  expect(clientUpperList.status === 200 && Array.isArray(clientUpperList.data.projects), 'client upper lists projects')
  const clientEntryList = await request('/client/projects', {}, sessions.CLIENT_DATA_ENTRY.token)
  expect(clientEntryList.status === 200 && Array.isArray(clientEntryList.data.projects), 'client data entry lists projects')
  const clientDraft = await request('/client/projects', {
    method: 'POST',
    body: JSON.stringify({
      name: 'مشروع عميل مسودة',
      startDate: '2026-03-01',
      endDate: '2026-09-30',
      managerId: sessions.CLIENT_DATA_ENTRY.user.id,
    }),
  }, sessions.CLIENT_DATA_ENTRY.token)
  expect(clientDraft.status === 200 && clientDraft.data.project?.approvalStatus === 'DRAFT', `client data entry creates DRAFT (got ${clientDraft.status} ${clientDraft.data.project?.approvalStatus || clientDraft.data.message || ''})`)

  const cross = await request('/org/projects', {}, sessions.CLIENT_UPPER_MGMT.token)
  expect(cross.status === 403, 'cross-tenant org access rejected')

  // Invitations: the inviter sees the initial credentials once; the account starts as
  // "غير نشط" (pendingActivation) and becomes "نشط" on its first successful login.
  const inviteEmail = `invite.${Date.now()}@acme.com`
  const invited = await request('/org/users', {
    method: 'POST',
    body: JSON.stringify({ name: 'مستخدم مدعو', email: inviteEmail, role: 'ORG_DATA_ENTRY' }),
  }, sessions.ORG_UPPER_MGMT.token)
  const initialPassword = invited.data.temporaryPassword
  expect(invited.status === 200 && typeof initialPassword === 'string' && initialPassword.length >= 12 && invited.data.user?.pendingActivation === true, 'upper management invites user and receives initial credentials once')
  const invitedRow = await prisma.orgUser.findUnique({ where: { email: inviteEmail } })
  expect(Boolean(invitedRow) && invitedRow.orgId === sessions.ORG_UPPER_MGMT.user.orgId && invitedRow.role === 'ORG_DATA_ENTRY' && invitedRow.pendingActivation === true && invitedRow.activatedAt === null, 'invited user stored as pending (غير نشط) with org link')
  expect(String(invitedRow?.password).startsWith('$2') && invitedRow?.password !== initialPassword, 'initial password stored only as a bcrypt hash')
  const listedPending = await request('/org/users', {}, sessions.ORG_UPPER_MGMT.token)
  const listedRow = listedPending.data.users?.find((user) => user.email === inviteEmail)
  expect(Boolean(listedRow) && listedRow.pendingActivation === true && listedRow.temporaryPassword === undefined && listedRow.password === undefined, 'users list shows pending status and never the password')

  const duplicate = await request('/org/users', {
    method: 'POST',
    body: JSON.stringify({ name: 'مكرر', email: inviteEmail.toUpperCase(), role: 'ORG_DATA_ENTRY' }),
  }, sessions.ORG_UPPER_MGMT.token)
  expect(duplicate.status === 400, 'duplicate email rejected')

  const deInvite = await request('/org/users', {
    method: 'POST',
    body: JSON.stringify({ name: 'غير مصرح', email: `denied.${Date.now()}@acme.com`, role: 'ORG_DATA_ENTRY' }),
  }, sessions.ORG_DATA_ENTRY.token)
  expect(deInvite.status === 403, 'data entry cannot invite')

  const pendingDemo = await request('/auth/demo/login', { method: 'POST', body: JSON.stringify({ type: 'ORG', userId: invited.data.user?.id }) })
  expect(pendingDemo.status === 404 && !pendingDemo.data.token, 'pending invitee cannot use demo login')
  const demoList = await request('/auth/demo/accounts')
  expect(demoList.status === 200 && !demoList.data.accounts.some((account) => account.email === inviteEmail), 'pending invitee not listed as a demo account')

  const reissued = await request(`/org/users/${invited.data.user?.id}/credentials`, { method: 'POST' }, sessions.ORG_UPPER_MGMT.token)
  const activationPassword = reissued.data.temporaryPassword
  expect(reissued.status === 200 && typeof activationPassword === 'string' && activationPassword !== initialPassword, 'upper management can issue new initial credentials before first login')
  const oldPassword = await request('/auth/login', { method: 'POST', body: JSON.stringify({ email: inviteEmail, password: initialPassword }) })
  expect(oldPassword.status === 400 && !oldPassword.data.challengeId, 'reissuing invalidates the previous initial password')
  const deReissue = await request(`/org/users/${invited.data.user?.id}/credentials`, { method: 'POST' }, sessions.ORG_DATA_ENTRY.token)
  expect(deReissue.status === 403, 'data entry cannot reissue credentials')
  const crossReissue = await request(`/client/users/${invited.data.user?.id}/credentials`, { method: 'POST' }, sessions.CLIENT_UPPER_MGMT.token)
  expect(crossReissue.status === 404 || crossReissue.status === 403, 'other tenant cannot reissue credentials')

  const invitedLogin = await passwordLogin(inviteEmail, activationPassword)
  expect(invitedLogin.status === 200 && invitedLogin.data.user?.role === 'ORG_DATA_ENTRY' && invitedLogin.data.user?.orgId === sessions.ORG_UPPER_MGMT.user.orgId, 'invited user signs in with initial credentials and code')
  const activatedRow = await prisma.orgUser.findUnique({ where: { email: inviteEmail } })
  expect(activatedRow?.pendingActivation === false && Boolean(activatedRow?.activatedAt) && Boolean(activatedRow?.lastLoginAt), 'first successful login activates the account (نشط)')
  const firstLoginLog = await prisma.activityLog.findFirst({ where: { userId: activatedRow?.id, action: 'FIRST_LOGIN' } })
  expect(Boolean(firstLoginLog), 'first login recorded in the activity log')
  const reissueAfter = await request(`/org/users/${invited.data.user?.id}/credentials`, { method: 'POST' }, sessions.ORG_UPPER_MGMT.token)
  expect(reissueAfter.status === 400, 'cannot reissue initial credentials for an active account')
  const invitedDashboard = await request('/org/dashboard', {}, invitedLogin.data.token)
  expect(invitedDashboard.status === 200, 'activated user session loads org data')
  const invitedPassword = activationPassword

  const selfToggle = await request(`/org/users/${sessions.ORG_UPPER_MGMT.user.id}/toggle`, { method: 'PATCH' }, sessions.ORG_UPPER_MGMT.token)
  expect(selfToggle.status === 400, 'cannot deactivate own account')

  const toggle = await request(`/org/users/${invited.data.user.id}/toggle`, { method: 'PATCH' }, sessions.ORG_UPPER_MGMT.token)
  expect(toggle.status === 200 && toggle.data.isActive === false, 'upper management can deactivate invited user')

  const inactiveLogin = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: inviteEmail, password: invitedPassword }),
  })
  expect(inactiveLogin.status === 400 && inactiveLogin.data.message === 'هذا الحساب غير نشط', 'inactive user cannot log in')
  const inactiveSession = await request('/org/dashboard', {}, invitedLogin.data.token)
  expect(inactiveSession.status === 401, 'deactivated user session is rejected with 401')

  const reactivate = await request(`/org/users/${invited.data.user.id}/toggle`, { method: 'PATCH' }, sessions.ORG_UPPER_MGMT.token)
  expect(reactivate.status === 200 && reactivate.data.isActive === true, 'upper management can reactivate invited user')
  const reactivatedLogin = await passwordLogin(inviteEmail, invitedPassword)
  expect(reactivatedLogin.status === 200 && reactivatedLogin.data.user?.role === 'ORG_DATA_ENTRY', 'reactivated user can log in')

  const pendingEmail = `pending.${Date.now()}@acme-client.com`
  const pendingInvite = await request('/client/users', {
    method: 'POST',
    body: JSON.stringify({ name: 'عميل مدعو', email: pendingEmail, accessLevel: 'UPPER' }),
  }, sessions.CLIENT_UPPER_MGMT.token)
  expect(pendingInvite.status === 200 && Boolean(pendingInvite.data.temporaryPassword) && pendingInvite.data.user?.role === 'CLIENT_UPPER_MGMT', 'client upper management invites user')
  const forgedPending = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: pendingEmail, password: 'Guess#12345' }),
  })
  expect(forgedPending.status === 400 && !forgedPending.data.challengeId, 'pending invitee cannot sign in with a wrong password')

  const jodaynInvite = await request('/jodayn/users', {
    method: 'POST',
    body: JSON.stringify({ name: 'موظف جودين', email: `j.invite.${Date.now()}@jodayn.com`, accessLevel: 'DATA_ENTRY' }),
  }, sessions.JODAYN_UPPER_MGMT.token)
  expect(jodaynInvite.status === 200 && Boolean(jodaynInvite.data.temporaryPassword) && jodaynInvite.data.user?.pendingActivation === true, 'jodayn upper management invites user')

  const users = await request('/org/users', {}, sessions.ORG_UPPER_MGMT.token)
  expect(users.status === 200 && users.data.users.some((user) => user.email === inviteEmail), 'invited user appears in users list')

  const notes = await request('/notifications', {}, sessions.ORG_UPPER_MGMT.token)
  expect(notes.status === 200 && notes.data.notifications.some((item) => item.type === 'APPROVAL'), 'approval writes a notification row')

  const report = await request('/jodayn/reports', {
    method: 'POST',
    body: JSON.stringify({ type: 'EXECUTIVE', period: '2026-Q1', totalContractsValue: 1000, netProfit: 100, netCashFlow: 100 }),
  }, sessions.JODAYN_UPPER_MGMT.token)
  expect(report.status === 200 && report.data.report?.type === 'EXECUTIVE', 'jodayn upper creates a financial report')
  const reportList = await request('/jodayn/reports', {}, sessions.JODAYN_DATA_ENTRY.token)
  expect(reportList.status === 200 && reportList.data.reports.some((item) => item.id === report.data.report?.id), 'jodayn data entry can read the new report')

  const jodaynReports = await request('/jodayn/invoices', {}, sessions.JODAYN_UPPER_MGMT.token)
  expect(jodaynReports.status === 200, 'jodayn upper can list invoices')
  const jodaynEntry = await request('/jodayn/invoices', {}, sessions.JODAYN_DATA_ENTRY.token)
  expect(jodaynEntry.status === 200, 'jodayn data entry can list invoices')
  const jodaynInviteDenied = await request('/jodayn/users', {
    method: 'POST',
    body: JSON.stringify({ name: 'x', email: `j.${Date.now()}@jodayn.com`, role: 'JODAYN_DATA_ENTRY' }),
  }, sessions.JODAYN_DATA_ENTRY.token)
  expect(jodaynInviteDenied.status === 403, 'jodayn data entry cannot invite')

  if (process.exitCode) process.exit(1)
  console.log('API checks finished')
}

main()
  .catch((error) => {
    console.error(error.message)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
    if (process.exitCode) process.exit(process.exitCode)
  })
