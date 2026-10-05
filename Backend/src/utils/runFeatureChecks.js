// End-to-end API checks for the feature pass: workflows, permissions and persistence that
// demo:check does not cover. Runs against the local API and refuses any database except trackplus_demo.
const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '../../.env') })
const { getDatabaseName } = require('../lib/demoSafety')

const BASE = process.env.CHECK_API_URL || 'http://localhost:5001/api'
const SUPER_ADMIN = { email: 'admin@trackplus.com', password: process.env.CHECK_SUPER_ADMIN_PASSWORD || 'admin123456' }
const stamp = Date.now()
let failures = 0

function expect(condition, label, detail) {
  if (!condition) {
    failures += 1
    console.error(`FAIL: ${label}${detail !== undefined ? ` (${JSON.stringify(detail).slice(0, 200)})` : ''}`)
    return false
  }
  console.log(`PASS: ${label}`)
  return true
}

async function request(pathname, options = {}, token) {
  const headers = { ...(options.headers || {}) }
  const isForm = typeof FormData !== 'undefined' && options.body instanceof FormData
  if (options.body && !isForm && !headers['Content-Type']) headers['Content-Type'] = 'application/json'
  if (token) headers.Authorization = `Bearer ${token}`
  const response = await fetch(`${BASE}${pathname}`, { ...options, headers })
  const text = await response.text()
  let data = {}
  try {
    data = text ? JSON.parse(text) : {}
  } catch {
    data = { raw: text }
  }
  return { status: response.status, data, headers: response.headers }
}

const json = (method, body) => ({ method, body: JSON.stringify(body) })

async function passwordLogin(email, password) {
  const started = await request('/auth/login', json('POST', { email, password }))
  if (started.status !== 200 || !started.data.challengeId) return started
  return request('/auth/login/verify', json('POST', { challengeId: started.data.challengeId, code: started.data.demoCode }))
}

async function demoLogin(role) {
  const result = await request('/auth/demo/login', json('POST', { role }))
  if (result.status !== 200) throw new Error(`demo login ${role} failed: ${result.status}`)
  return result.data
}

async function unread(token) {
  const result = await request('/notifications', {}, token)
  return result.data.notifications || []
}

async function projectWorkflow(portal, s) {
  const upper = s[`${portal.toUpperCase()}_UPPER_MGMT`]
  const entry = s[`${portal.toUpperCase()}_DATA_ENTRY`]
  const base = `/${portal}/projects`
  const edit = portal === 'org' ? 'PATCH' : 'PUT' // nested updates: org uses PATCH, client uses PUT
  const name = `فحص سير العمل ${portal} ${stamp}`

  const created = await request(base, json('POST', { name, startDate: '2026-01-01', endDate: '2026-12-31', budget: 500000, managerId: entry.user.id }), entry.token)
  const id = created.data.project?.id
  expect(created.status === 201 || created.status === 200, `${portal}: data entry creates a draft project`, created.data)
  expect(created.data.project?.approvalStatus === 'DRAFT', `${portal}: new project starts as DRAFT`)

  const submitted = await request(`${base}/${id}/submit`, { method: 'POST' }, entry.token)
  expect(submitted.data.project?.approvalStatus === 'PENDING', `${portal}: submit moves project to PENDING`)
  const managerInbox = await unread(upper.token)
  expect(
    managerInbox.some((n) => n.type === 'APPROVAL' && n.message.includes(name)),
    `${portal}: upper management receives an approval notification`,
  )
  const lockedEdit = await request(`${base}/${id}`, json('PUT', { description: 'x' }), entry.token)
  expect(lockedEdit.status === 403, `${portal}: data entry cannot edit while pending`)

  const entryReturn = await request(`${base}/${id}/return`, json('PATCH', { reason: 'x' }), entry.token)
  expect(entryReturn.status === 403, `${portal}: data entry cannot return a project`)
  const emptyReason = await request(`${base}/${id}/return`, json('PATCH', { reason: ' ' }), upper.token)
  expect(emptyReason.status === 400, `${portal}: return requires the requested changes`)
  const returned = await request(`${base}/${id}/return`, json('PATCH', { reason: 'أضف الميزانية التفصيلية' }), upper.token)
  expect(
    returned.status === 200 && returned.data.project?.approvalStatus === 'DRAFT' && returned.data.project?.rejectionReason === 'أضف الميزانية التفصيلية',
    `${portal}: manager returns project for changes (PENDING→DRAFT with notes)`,
    returned.data,
  )
  const entryInbox = await unread(entry.token)
  expect(
    entryInbox.some((n) => n.type === 'REVIEW' && n.message.includes(name)),
    `${portal}: data entry is notified the project was returned`,
  )
  const edited = await request(`${base}/${id}`, json('PUT', { description: 'تمت إضافة الميزانية التفصيلية' }), entry.token)
  expect(edited.status === 200, `${portal}: data entry edits the returned draft`)
  const resubmitted = await request(`${base}/${id}/submit`, { method: 'POST' }, entry.token)
  expect(
    resubmitted.data.project?.approvalStatus === 'PENDING' && resubmitted.data.project?.rejectionReason === null,
    `${portal}: resubmission clears the notes and returns to PENDING`,
  )
  const approved = await request(`${base}/${id}/approve`, { method: 'PATCH' }, upper.token)
  expect(approved.data.project?.approvalStatus === 'APPROVED', `${portal}: manager approves`)
  const afterApproval = await unread(entry.token)
  expect(afterApproval.some((n) => n.type === 'APPROVAL' && n.message.includes(name)), `${portal}: data entry is notified of approval`)
  const reread = await request(`${base}/${id}`, {}, entry.token)
  expect(reread.data.project?.approvalStatus === 'APPROVED', `${portal}: approval persists on reload`)

  // Status changes are a management decision
  const entryStatus = await request(`${base}/${id}`, json('PUT', { status: 'ON_HOLD' }), entry.token)
  const stillActive = await request(`${base}/${id}`, {}, upper.token)
  expect(entryStatus.status === 403 || stillActive.data.project?.status !== 'ON_HOLD', `${portal}: data entry cannot change project status`)
  const upperStatus = await request(`${base}/${id}`, json('PUT', { status: 'ON_HOLD' }), upper.token)
  expect(upperStatus.status === 200 && upperStatus.data.project?.status === 'ON_HOLD', `${portal}: upper management changes status`)
  const badStatus = await request(`${base}/${id}`, json('PUT', { status: 'NOPE' }), upper.token)
  expect(badStatus.status === 400, `${portal}: invalid status rejected`)
  await request(`${base}/${id}`, json('PUT', { status: 'ACTIVE' }), upper.token)

  // Deliverables drive progress
  const d1 = await request(`${base}/${id}/deliverables`, json('POST', { name: 'مخرج أ', price: 1000 }), upper.token)
  const d2 = await request(`${base}/${id}/deliverables`, json('POST', { name: 'مخرج ب', price: 2000 }), upper.token)
  expect(Boolean(d1.data.deliverable?.id && d2.data.deliverable?.id), `${portal}: deliverables created`, d1.data)
  const done = await request(`${base}/${id}/deliverables/${d1.data.deliverable?.id}`, json(edit, { status: 'COMPLETED' }), upper.token)
  expect(done.status === 200, `${portal}: deliverable marked complete`)
  const progress = await request(`${base}/${id}`, {}, upper.token)
  expect(progress.data.project?.progressPct === 50, `${portal}: project progress recomputed from deliverables (50%)`, progress.data.project?.progressPct)
  const badDeliverable = await request(`${base}/${id}/deliverables/${d2.data.deliverable?.id}`, json(edit, { status: 'FINISHED' }), upper.token)
  expect(badDeliverable.status === 400, `${portal}: invalid deliverable status rejected`)
  const entryDeleteDeliverable = await request(`${base}/${id}/deliverables/${d2.data.deliverable?.id}`, { method: 'DELETE' }, entry.token)
  expect(entryDeleteDeliverable.status === 403, `${portal}: data entry cannot delete deliverables`)

  // Risks
  const risk = await request(`${base}/${id}/risks`, json('POST', { name: 'خطر تأخر التوريد', probability: 'HIGH', impact: 'HIGH' }), entry.token)
  expect(Boolean(risk.data.risk?.id), `${portal}: data entry records a risk`, risk.data)
  const closed = await request(`${base}/${id}/risks/${risk.data.risk?.id}`, json(edit, { status: 'CLOSED' }), upper.token)
  expect(closed.status === 200 && closed.data.risk?.status === 'CLOSED', `${portal}: risk closed`, closed.data)

  // Change requests
  const cr = await request(`${base}/${id}/change-requests`, json('POST', { title: 'تمديد المرحلة الثانية', priority: 'HIGH' }), entry.token)
  const crId = cr.data.changeRequest?.id
  expect(Boolean(crId), `${portal}: data entry submits a change request`, cr.data)
  const entryDecision = await request(`${base}/${id}/change-requests/${crId}/approve`, json('PATCH', {}), entry.token)
  expect(entryDecision.status === 403, `${portal}: data entry cannot decide change requests`)
  const review = await request(`${base}/${id}/change-requests/${crId}/review`, json('PATCH', { comment: 'نحتاج تفاصيل التكلفة' }), upper.token)
  expect(review.status === 200, `${portal}: manager sends change request for review`, review.data)
  const crApproved = await request(`${base}/${id}/change-requests/${crId}/approve`, json('PATCH', {}), upper.token)
  expect(crApproved.status === 200 && crApproved.data.changeRequest?.status === 'APPROVED', `${portal}: manager approves change request`, crApproved.data)
  const again = await request(`${base}/${id}/change-requests/${crId}/reject`, json('PATCH', {}), upper.token)
  expect(again.status === 400 || again.status === 409, `${portal}: decided change request cannot be decided again`, again.status)

  // Final rejection keeps the reason and stays resubmittable (existing contract)
  const second = await request(base, json('POST', { name: `${name} رفض`, startDate: '2026-01-01', endDate: '2026-06-30', managerId: entry.user.id }), entry.token)
  await request(`${base}/${second.data.project?.id}/submit`, { method: 'POST' }, entry.token)
  const rejected = await request(`${base}/${second.data.project?.id}/reject`, json('PATCH', { reason: 'خارج نطاق الخطة' }), upper.token)
  expect(rejected.data.project?.approvalStatus === 'REJECTED', `${portal}: manager rejects with a reason`)
  const rejectionInbox = await unread(entry.token)
  expect(rejectionInbox.some((n) => n.type === 'REJECTION' && n.message.includes('خارج نطاق الخطة')), `${portal}: data entry is notified of rejection`)

  return id
}

async function main() {
  if (getDatabaseName() !== 'trackplus_demo') {
    console.error('Feature checks refused: active database is not trackplus_demo')
    process.exit(1)
  }

  const roles = ['ORG_UPPER_MGMT', 'ORG_DATA_ENTRY', 'CLIENT_UPPER_MGMT', 'CLIENT_DATA_ENTRY', 'JODAYN_UPPER_MGMT', 'JODAYN_DATA_ENTRY']
  const s = {}
  for (const role of roles) s[role] = await demoLogin(role)

  // ---------- Super Admin ----------
  const quickSuper = await request('/auth/demo/login', json('POST', { role: 'SUPER_ADMIN' }))
  expect(quickSuper.status !== 200 || !quickSuper.data.token, 'super admin has no quick-login button session')
  const sa = await passwordLogin(SUPER_ADMIN.email, SUPER_ADMIN.password)
  expect(sa.status === 200 && Boolean(sa.data.token), 'super admin signs in with password + code')
  const saToken = sa.data.token

  const dash = await request('/super-admin/dashboard', {}, saToken)
  expect(dash.status === 200, 'super admin dashboard loads')
  const denied = await request('/super-admin/dashboard', {}, s.ORG_UPPER_MGMT.token)
  expect(denied.status === 403, 'org manager is denied super admin APIs')

  const pkg = await request('/super-admin/packages', json('POST', { label: `باقة فحص ${stamp}`, name: `CHECK_${stamp}`, billingCycle: 'MONTHLY', userLimit: 5, storageGb: 2, price: 100 }), saToken)
  const pkgId = pkg.data.package?.id
  expect(Boolean(pkgId), 'super admin creates a package', pkg.data)
  const pkgEdit = await request(`/super-admin/packages/${pkgId}`, json('PATCH', { label: `باقة فحص معدلة ${stamp}` }), saToken)
  expect(pkgEdit.status === 200, 'super admin edits the package')

  const managerEmail = `check.manager.${stamp}@example.com`
  const tenant = await request('/super-admin/tenants', json('POST', {
    tenantType: 'ORG',
    name: `جهة الفحص ${stamp}`,
    managerName: 'مدير الفحص',
    managerEmail,
    packageId: pkgId,
    userLimit: 5,
  }), saToken)
  const orgId = tenant.data.org?.id
  const tempPassword = tenant.data.temporaryPassword
  expect(Boolean(orgId && tempPassword), 'super admin creates an org tenant with a one-time password', tenant.data)
  const duplicate = await request('/super-admin/tenants', json('POST', { tenantType: 'ORG', name: 'مكرر', managerName: 'x', managerEmail }), saToken)
  expect(duplicate.status === 400, 'duplicate manager email rejected')
  const pkgInUse = await request(`/super-admin/packages/${pkgId}`, { method: 'DELETE' }, saToken)
  expect(pkgInUse.status === 409, 'package in use cannot be deleted')

  let details = await request(`/super-admin/accounts/org/${orgId}`, {}, saToken)
  const before = (details.data.users || []).find((u) => u.email === managerEmail)
  expect(before && before.isActive && before.pendingActivation, 'new manager starts pending (غير نشط)', before)
  const firstLogin = await passwordLogin(managerEmail, tempPassword)
  expect(firstLogin.status === 200 && Boolean(firstLogin.data.token), 'new manager signs in with the temporary password')
  details = await request(`/super-admin/accounts/org/${orgId}`, {}, saToken)
  const after = (details.data.users || []).find((u) => u.email === managerEmail)
  expect(after && !after.pendingActivation, 'manager becomes active (نشط) after first login', after)
  const newToken = firstLogin.data.token

  // Tenant isolation: the new org sees none of the demo org's projects
  const otherProjects = await request('/org/projects', {}, newToken)
  expect(otherProjects.status === 200 && otherProjects.data.projects.length === 0, 'new tenant sees no other tenant projects')

  const notified = await request(`/super-admin/accounts/org/${orgId}/notify`, json('POST', { title: 'صيانة', message: 'صيانة مجدولة الليلة' }), saToken)
  expect(notified.status === 200, 'super admin notifies a tenant')
  const tenantInbox = await request('/notifications', {}, newToken)
  expect(tenantInbox.data.unreadCount >= 1, 'tenant user receives the notification', tenantInbox.data.unreadCount)
  const readAll = await request('/notifications/read-all', { method: 'PATCH' }, newToken)
  const inboxAfter = await request('/notifications', {}, newToken)
  expect(readAll.status === 200 && inboxAfter.data.unreadCount === 0, 'mark all notifications read persists')

  const exported = await fetch(`${BASE}/super-admin/accounts/org/${orgId}/export`, { headers: { Authorization: `Bearer ${saToken}` } })
  expect(exported.status === 200 && (exported.headers.get('content-type') || '').includes('csv'), 'tenant export downloads CSV')

  const suspend = await request(`/super-admin/accounts/org/${orgId}`, json('PATCH', { isActive: false }), saToken)
  expect(suspend.status === 200, 'super admin suspends the tenant')
  const blocked = await request('/org/projects', {}, newToken)
  expect(blocked.status === 401 && blocked.data.code === 'SUSPENDED', 'suspended tenant session is rejected')
  const blockedLogin = await request('/auth/login', json('POST', { email: managerEmail, password: tempPassword }))
  expect(blockedLogin.status === 403, 'suspended tenant cannot sign in')
  await request(`/super-admin/accounts/org/${orgId}`, json('PATCH', { isActive: true }), saToken)
  const restored = await request('/org/projects', {}, newToken)
  expect(restored.status === 200, 'reactivated tenant regains access')

  const noConfirm = await request(`/super-admin/accounts/org/${orgId}`, { method: 'DELETE', body: JSON.stringify({}), headers: { 'Content-Type': 'application/json' } }, saToken)
  expect(noConfirm.status === 400, 'tenant delete requires typing the name')
  const deleted = await request(`/super-admin/accounts/org/${orgId}`, json('DELETE', { confirmName: `جهة الفحص ${stamp}` }), saToken)
  expect(deleted.status === 200, 'super admin deletes the tenant')
  const goneSession = await request('/org/projects', {}, newToken)
  expect(goneSession.status === 401, 'deleted tenant session no longer works')
  const pkgDelete = await request(`/super-admin/packages/${pkgId}`, { method: 'DELETE' }, saToken)
  expect(pkgDelete.status === 200, 'unused package can be deleted')

  const platformUser = await request('/super-admin/users', json('POST', { portalType: 'JODAYN', name: 'موظف فحص', email: `check.staff.${stamp}@example.com`, accessLevel: 'DATA_ENTRY' }), saToken)
  expect(platformUser.status === 200 || platformUser.status === 201, 'super admin creates a platform user', platformUser.data)
  const audit = await request('/super-admin/audit/summary', {}, saToken)
  expect(audit.status === 200 && typeof audit.data.totalChanges === 'number', 'audit summary loads', audit.data)

  // ---------- Project workflows (both portals) ----------
  const orgProjectId = await projectWorkflow('org', s)
  await projectWorkflow('client', s)

  const crossTenant = await request(`/client/projects/${orgProjectId}`, {}, s.CLIENT_UPPER_MGMT.token)
  expect(crossTenant.status === 403 || crossTenant.status === 404, 'client cannot read an org project')

  // ---------- Search is scoped ----------
  const orgSearch = await request(`/search?q=${encodeURIComponent('فحص سير العمل org')}`, {}, s.ORG_UPPER_MGMT.token)
  expect(orgSearch.data.results?.some((r) => r.kind === 'project'), 'org search finds its own project')
  const clientSearch = await request(`/search?q=${encodeURIComponent('فحص سير العمل org')}`, {}, s.CLIENT_UPPER_MGMT.token)
  expect(clientSearch.data.results?.length === 0, 'client search does not see org projects')

  // ---------- Profile, password, dashboard layout ----------
  const entry = s.ORG_DATA_ENTRY
  const renamed = await request('/me', json('PATCH', { name: 'مدخل بيانات (فحص)' }), entry.token)
  const me = await request('/me', {}, entry.token)
  expect(renamed.status === 200 && me.data.user?.name === 'مدخل بيانات (فحص)', 'profile name saves and reloads')
  const wrongPassword = await request('/me/password', json('POST', { currentPassword: 'wrong-pass', newPassword: 'NewPass1234' }), entry.token)
  expect(wrongPassword.status === 400, 'password change requires the current password')
  const shortPassword = await request('/me/password', json('POST', { currentPassword: 'Demo1234', newPassword: '123' }), entry.token)
  expect(shortPassword.status === 400, 'short new password rejected')

  const layoutBody = { widgetIds: ['kpis', 'projects'], layout: [{ i: 'kpis', x: 0, y: 0, w: 12, h: 3 }] }
  const savedLayout = await request('/me/dashboard-layout/org', json('PUT', layoutBody), entry.token)
  const loadedLayout = await request('/me/dashboard-layout/org', {}, entry.token)
  expect(savedLayout.status === 200 && loadedLayout.data.layout?.widgetIds?.join() === 'kpis,projects', 'dashboard layout saves and reloads')
  const otherUserLayout = await request('/me/dashboard-layout/org', {}, s.ORG_UPPER_MGMT.token)
  expect(otherUserLayout.data.layout?.widgetIds?.join() !== 'kpis,projects', 'dashboard layout is per user')
  const badLayout = await request('/me/dashboard-layout/nope', json('PUT', layoutBody), entry.token)
  expect(badLayout.status === 400, 'unknown dashboard portal rejected')
  await request('/me/dashboard-layout/org', { method: 'DELETE' }, entry.token)

  // ---------- Jodayn finance ----------
  const invoice = await request('/jodayn/invoices', json('POST', {
    invoiceNumber: `INV-CHECK-${stamp}`,
    amount: 10000,
    vatRate: 15,
    remainingAmount: 11500,
    clientName: 'عميل الفحص',
    issueDate: '2026-09-01',
    dueDate: '2026-09-30',
  }), s.JODAYN_DATA_ENTRY.token)
  const invoiceId = invoice.data.invoice?.id
  expect(Boolean(invoiceId), 'jodayn data entry creates an invoice', invoice.data)
  const badInvoiceStatus = await request(`/jodayn/invoices/${invoiceId}`, json('PUT', { status: 'MAYBE' }), s.JODAYN_UPPER_MGMT.token)
  expect(badInvoiceStatus.status === 400, 'invalid invoice status rejected')
  const paid = await request(`/jodayn/invoices/${invoiceId}`, json('PUT', { status: 'PAID' }), s.JODAYN_UPPER_MGMT.token)
  expect(paid.status === 200 && Number(paid.data.invoice?.remainingAmount) === 0, 'marking an invoice paid clears the remaining amount', paid.data)
  const entryDelete = await request(`/jodayn/invoices/${invoiceId}`, { method: 'DELETE' }, s.JODAYN_DATA_ENTRY.token)
  expect(entryDelete.status === 403, 'jodayn data entry cannot delete invoices')
  const upperDelete = await request(`/jodayn/invoices/${invoiceId}`, { method: 'DELETE' }, s.JODAYN_UPPER_MGMT.token)
  expect(upperDelete.status === 200, 'jodayn upper management deletes the invoice')

  // ---------- Landing page demo requests ----------
  const badRequest = await request('/public/demo-requests', json('POST', { fullName: 'ا', phone: '123', companyName: '', businessEmail: 'x', jobTitle: '' }))
  expect(badRequest.status === 400 && Boolean(badRequest.data.errors?.phone), 'demo request validates its fields')
  const demoRequest = await request('/public/demo-requests', json('POST', {
    fullName: 'سارة الفحص',
    phone: '512345678',
    companyName: `شركة الفحص ${stamp}`,
    businessEmail: `sara.${stamp}@example.com`,
    jobTitle: 'مديرة مشاريع',
  }))
  expect(demoRequest.status === 201, 'landing page demo request is stored')
  const listed = await request('/super-admin/demo-requests', {}, saToken)
  expect(listed.data.requests?.some((r) => r.companyName === `شركة الفحص ${stamp}`), 'super admin sees the demo request')
  const saInbox = await request('/notifications', {}, saToken)
  expect(saInbox.data.notifications?.some((n) => n.message.includes(`شركة الفحص ${stamp}`)), 'super admin is notified of the demo request')
  const orgCannotList = await request('/super-admin/demo-requests', {}, s.ORG_UPPER_MGMT.token)
  expect(orgCannotList.status === 403, 'tenants cannot read demo requests')

  // ---------- AI ----------
  const aiStatus = await request('/ai/status', {}, s.ORG_UPPER_MGMT.token)
  const assistant = await request('/ai/assistant', json('POST', { message: 'كم مشروع لدي؟' }), s.ORG_UPPER_MGMT.token)
  if (aiStatus.data.configured) {
    expect(assistant.status === 200 && assistant.data.configured === true && Boolean(assistant.data.reply), 'assistant answers from account data')
  } else {
    expect(
      assistant.status === 200 && assistant.data.configured === false && assistant.data.reply.includes('ANTHROPIC_API_KEY') && assistant.data.reply.includes('عدد المشاريع'),
      'assistant reports missing AI key and returns a real data summary',
    )
    const form = new FormData()
    form.append('kind', 'project')
    form.append('file', new Blob(['اسم المشروع: تجربة'], { type: 'text/plain' }), 'contract.txt')
    const extract = await request('/ai/extract', { method: 'POST', body: form }, s.ORG_UPPER_MGMT.token)
    expect(extract.status === 503 && extract.data.configured === false, 'document extraction reports missing AI key (503)')
  }
  const noAuthAi = await request('/ai/assistant', json('POST', { message: 'x' }))
  expect(noAuthAi.status === 401, 'assistant requires a session')

  console.log(failures ? `\n${failures} feature check(s) failed` : '\nAll feature checks passed')
  process.exitCode = failures ? 1 : 0
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
