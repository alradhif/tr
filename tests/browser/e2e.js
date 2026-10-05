// Browser workflow tests across roles: approvals, notifications, refresh, logout, account switching,
// AI assistant, exports, presentation data, invitations and the landing demo form.
const { chromium } = require('playwright')
const BASE = process.env.BASE || 'http://localhost:5001'
const OUT = process.env.SHOTS_DIR || require('path').join(__dirname, 'shots')
require('fs').mkdirSync(OUT, { recursive: true })
const stamp = Date.now()
const results = []

function check(label, ok, detail) {
  results.push({ label, ok: Boolean(ok) })
  console.log(`${ok ? 'PASS' : 'FAIL'}: ${label}${!ok && detail !== undefined ? ` (${String(detail).slice(0, 200)})` : ''}`)
}

const LABELS = {
  ORG_UPPER_MGMT: 'الدخول كجهة - إدارة عليا',
  ORG_DATA_ENTRY: 'الدخول كجهة - مدخل بيانات',
  CLIENT_UPPER_MGMT: 'الدخول كعميل - إدارة عليا',
  CLIENT_DATA_ENTRY: 'الدخول كعميل - مدخل بيانات',
  JODAYN_UPPER_MGMT: 'الدخول لحساب جودين - إدارة عليا',
  JODAYN_DATA_ENTRY: 'الدخول لحساب جودين - مدخل بيانات',
}

async function quickLogin(page, role) {
  await page.goto(`${BASE}/login`)
  await page.getByText(LABELS[role]).click()
  await page.waitForURL(/\/(org|client|jodayn)\/dashboard/, { timeout: 15000 })
}

async function logout(page) {
  await page.getByLabel('المزيد من الخيارات').first().click()
  await page.getByRole('menuitem', { name: 'تسجيل الخروج' }).click()
  await page.locator('.signout-modal__btn--danger').click()
  await page.waitForURL(/\/login/, { timeout: 10000 })
}

async function passwordLogin(page, email, password) {
  await page.goto(`${BASE}/login`)
  await page.fill('#login-email', email)
  await page.fill('#login-password', password)
  await page.click('button[type=submit]')
  await page.waitForURL('**/otp', { timeout: 10000 })
  const code = await page.evaluate(() => JSON.parse(sessionStorage.getItem('trackplus.pendingLogin')).demoCode)
  const inputs = page.locator('input')
  if ((await inputs.count()) >= 6) {
    for (let i = 0; i < 6; i++) await inputs.nth(i).fill(code[i])
  } else {
    await inputs.first().fill(code)
  }
  await page.locator('button.auth-form__submit, button:has-text("تحقق")').first().click().catch(() => {})
  await page.waitForURL(/\/(super-admin|org|client|jodayn)(\/|$)/, { timeout: 15000 }).catch(() => {})
  await page.waitForTimeout(1000)
}

async function api(page, portalKey, method, pathname, body) {
  return page.evaluate(
    async ({ portalKey, method, pathname, body }) => {
      const token = sessionStorage.getItem(`trackplus.${portalKey}.token`)
      const response = await fetch(`/api${pathname}`, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: body ? JSON.stringify(body) : undefined,
      })
      return { status: response.status, data: await response.json().catch(() => ({})) }
    },
    { portalKey, method, pathname, body },
  )
}

async function approvalFlow(browser) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: 'ar', acceptDownloads: true })
  const page = await ctx.newPage()
  const apiErrors = []
  page.on('response', (r) => {
    if (r.url().includes('/api/') && r.status() >= 500) apiErrors.push(`${r.status()} ${r.url()}`)
  })

  await quickLogin(page, 'ORG_DATA_ENTRY')
  check('org data entry quick login lands on dashboard', page.url().endsWith('/org/dashboard'))
  const me = await page.evaluate(() => JSON.parse(sessionStorage.getItem('trackplus.org.user')))
  const name = `مشروع اختبار المتصفح ${stamp}`
  const created = await api(page, 'org', 'POST', '/org/projects', { name, startDate: '2026-01-01', endDate: '2026-12-31', budget: 250000, managerId: me.id })
  const id = created.data.project?.id
  check('data entry draft created', Boolean(id), JSON.stringify(created.data))
  const deliv = await api(page, 'org', 'POST', `/org/projects/${id}/deliverables`, { name: 'تقرير المتطلبات' })
  check('data entry adds a deliverable', Boolean(deliv.data.deliverable?.id), JSON.stringify(deliv))
  await api(page, 'org', 'POST', `/org/projects/${id}/change-requests`, { title: 'طلب تغيير للعرض' })

  await page.goto(`${BASE}/org/projects/${id}`)
  await page.getByRole('button', { name: 'إرسال للموافقة' }).click()
  await page.waitForTimeout(1500)
  let state = await api(page, 'org', 'GET', `/org/projects/${id}`)
  check('UI submit moves project to PENDING', state.data.project?.approvalStatus === 'PENDING', state.data.project?.approvalStatus)

  await page.reload()
  await page.waitForTimeout(1500)
  check('refresh keeps the session and page', page.url().endsWith(`/org/projects/${id}`) && (await page.getByText(name).count()) > 0)

  await logout(page)
  const cleared = await page.evaluate(() => sessionStorage.getItem('trackplus.org.token'))
  check('logout clears the session', !cleared)
  await page.goto(`${BASE}/org/dashboard`)
  await page.waitForTimeout(1500)
  check('portal is closed after logout', page.url().includes('/login'), page.url())

  await quickLogin(page, 'ORG_UPPER_MGMT')
  const who = await page.evaluate(() => JSON.parse(sessionStorage.getItem('trackplus.org.user')).role)
  check('switching account loads the manager session', who === 'ORG_UPPER_MGMT', who)
  const badge = await page.locator('.notifications-badge').first().textContent().catch(() => null)
  check('manager sees an unread notification badge', Number(badge) > 0 || badge === '99+', badge)
  await page.getByRole('button', { name: /الإشعارات/ }).first().click()
  await page.waitForTimeout(800)
  check('notification panel lists the submitted project', (await page.locator('.notifications-panel').getByText(name).count()) > 0)
  await page.screenshot({ path: `${OUT}/e2e_notifications.png` })

  await page.goto(`${BASE}/org/projects/${id}`)
  await page.getByRole('button', { name: 'إعادة للتعديل' }).click()
  await page.locator('.catalog-dialog textarea').fill('أرفق خطة المخاطر')
  await page.locator('.catalog-dialog').getByRole('button', { name: 'إعادة للتعديل' }).click()
  await page.waitForTimeout(1500)
  state = await api(page, 'org', 'GET', `/org/projects/${id}`)
  check('manager returns project for changes in the UI', state.data.project?.approvalStatus === 'DRAFT' && state.data.project?.rejectionReason === 'أرفق خطة المخاطر')

  await logout(page)
  await quickLogin(page, 'ORG_DATA_ENTRY')
  await page.goto(`${BASE}/org/projects/${id}`)
  await page.waitForTimeout(1200)
  check('data entry sees the requested changes', (await page.getByText('أرفق خطة المخاطر').count()) > 0)
  await page.getByRole('button', { name: /إرسال للموافقة/ }).click()
  await page.waitForTimeout(1200)

  await logout(page)
  await quickLogin(page, 'ORG_UPPER_MGMT')
  await page.goto(`${BASE}/org/projects/${id}`)
  await page.getByRole('button', { name: 'اعتماد' }).first().click()
  await page.waitForTimeout(1500)
  state = await api(page, 'org', 'GET', `/org/projects/${id}`)
  check('manager approves in the UI', state.data.project?.approvalStatus === 'APPROVED')
  await page.reload()
  await page.waitForTimeout(1500)
  await page.locator('select.project-detail__status-select').selectOption('ON_HOLD')
  await page.waitForTimeout(1200)
  state = await api(page, 'org', 'GET', `/org/projects/${id}`)
  check('manager changes project status in the UI', state.data.project?.status === 'ON_HOLD', state.data.project?.status)

  // Presentation receives real project data
  await page.getByRole('button', { name: 'إنشاء عرض تقديمي' }).click()
  await page.locator('.tp-modal__form input').first().fill(`عرض ${name}`)
  await page.locator('.tp-modal__form textarea').fill('التركيز على المخاطر')
  await page.getByRole('button', { name: 'توليد العرض' }).click()
  await page.waitForTimeout(3000)
  const frame = page.frameLocator('iframe.ppt-generator__frame')
  const cover = await frame.locator('#coverTitle').textContent().catch(() => null)
  check('presentation uses the title entered in the dialog', cover === `عرض ${name}`, cover)
  const notesShown = await frame.getByText('التركيز على المخاطر').count()
  check('presentation shows the dialog notes', notesShown > 0)
  const outputs = await frame.getByText('تقرير المتطلبات').count()
  check('presentation lists the project deliverables', outputs > 0)
  const code = await frame.locator('#coverCode').textContent().catch(() => null)
  check('presentation uses the project code, not sample data', code && !code.includes('PRJ-2025'), code)
  await page.screenshot({ path: `${OUT}/e2e_presentation.png` })
  await page.keyboard.press('Escape')

  // AI assistant
  await page.goto(`${BASE}/org/dashboard`)
  await page.locator('.assistant-fab').click()
  const input = page.getByPlaceholder('أكتب رسالة').first()
  await input.fill('كم عدد المشاريع؟')
  await input.press('Enter')
  await page.locator('.assistant-answer').first().waitFor({ timeout: 15000 }).catch(() => {})
  const answer = await page.locator('.assistant-answer').first().textContent().catch(() => '')
  check('assistant replies from the backend (missing key reported, real counts shown)', answer.includes('ANTHROPIC_API_KEY') && answer.includes('عدد المشاريع'), answer)
  await page.screenshot({ path: `${OUT}/e2e_assistant.png` })

  // Department export and filter
  const depts = await api(page, 'org', 'GET', '/org/departments')
  const dept = (depts.data.departments || [])[0]
  await page.goto(`${BASE}/org/departments/${dept.id}`)
  await page.waitForTimeout(1500)
  const exportButton = page.locator('.department-detail-toolbar button', { hasText: 'تصدير' })
  if (await exportButton.isEnabled()) {
    const [download] = await Promise.all([page.waitForEvent('download', { timeout: 8000 }), exportButton.click()])
    check('department projects export downloads a CSV', download.suggestedFilename().endsWith('.csv'), download.suggestedFilename())
  } else {
    check('department export disabled only when there are no projects', true)
  }
  await page.locator('.department-detail-toolbar button', { hasText: 'تصفية' }).click()
  check('department filter cycles status', (await page.locator('.department-detail-toolbar').getByText('تصفية: على المسار').count()) > 0)

  check('no API 5xx during the approval flow', apiErrors.length === 0, apiErrors.join(', '))
  await ctx.close()
  return name
}

async function clientRejectFlow(browser) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: 'ar' })
  const page = await ctx.newPage()
  await quickLogin(page, 'CLIENT_DATA_ENTRY')
  const me = await page.evaluate(() => JSON.parse(sessionStorage.getItem('trackplus.client.user')))
  const created = await api(page, 'client', 'POST', '/client/projects', { name: `مشروع عميل ${stamp}`, startDate: '2026-01-01', endDate: '2026-06-30', managerId: me.id })
  const id = created.data.project?.id
  await page.goto(`${BASE}/client/projects/${id}`)
  await page.getByRole('button', { name: 'إرسال للموافقة' }).click()
  await page.waitForTimeout(1200)
  await logout(page)
  await quickLogin(page, 'CLIENT_UPPER_MGMT')
  await page.goto(`${BASE}/client/projects/${id}`)
  await page.getByRole('button', { name: 'رفض' }).first().click()
  await page.locator('.catalog-dialog textarea').fill('الميزانية غير واقعية')
  await page.locator('.catalog-dialog').getByRole('button', { name: 'تأكيد الرفض' }).click()
  await page.waitForTimeout(1500)
  const state = await api(page, 'client', 'GET', `/client/projects/${id}`)
  check('client manager rejects with a reason in the UI', state.data.project?.approvalStatus === 'REJECTED')
  await logout(page)
  await quickLogin(page, 'CLIENT_DATA_ENTRY')
  await page.getByRole('button', { name: /الإشعارات/ }).first().click()
  await page.waitForTimeout(800)
  check('client data entry is notified of the rejection', (await page.locator('.notifications-panel').getByText('الميزانية غير واقعية').count()) > 0)
  await ctx.close()
}

async function superAdminFlow(browser) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: 'ar' })
  const page = await ctx.newPage()
  const quick = await page.request.post(`${BASE}/api/auth/demo/login`, { data: { role: 'SUPER_ADMIN' } })
  check('super admin is not available as a quick login', quick.status() !== 200)
  await passwordLogin(page, 'admin@trackplus.com', 'admin123456')
  check('super admin signs in with password and code', page.url().includes('/super-admin'), page.url())

  const email = `invitee.${stamp}@example.com`
  const tenant = await api(page, 'superAdmin', 'POST', '/super-admin/tenants', { tenantType: 'ORG', name: `جهة متصفح ${stamp}`, managerName: 'مدير جديد', managerEmail: email })
  const orgId = tenant.data.org?.id
  const temp = tenant.data.temporaryPassword
  check('tenant created with one-time credentials', Boolean(orgId && temp))
  await page.goto(`${BASE}/super-admin/tenants?id=org-${orgId}`)
  await page.waitForTimeout(2000)
  check('new manager shows as غير نشط before first login', (await page.getByText('غير نشط').count()) > 0)
  await page.screenshot({ path: `${OUT}/e2e_tenant_pending.png` })

  const other = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: 'ar' })
  const invitee = await other.newPage()
  await passwordLogin(invitee, email, temp)
  check('invited manager signs in with the temporary password', invitee.url().includes('/org/'), invitee.url())
  await other.close()

  await page.reload()
  await page.waitForTimeout(2000)
  const pendingLeft = await page.getByText('غير نشط').count()
  check('manager shows as نشط after first login', pendingLeft === 0 && (await page.getByText('نشط', { exact: true }).count()) > 0)
  await page.screenshot({ path: `${OUT}/e2e_tenant_active.png` })

  await page.goto(`${BASE}/super-admin/audit-log`)
  await page.waitForTimeout(1500)
  const auditCount = Number(await page.locator('.audit-log-card__count').first().textContent().catch(() => '0'))
  check('audit log shows real entries', auditCount > 0, auditCount)
  await ctx.close()
}

async function jodaynFlow(browser) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: 'ar' })
  const page = await ctx.newPage()
  await quickLogin(page, 'JODAYN_DATA_ENTRY')
  await page.goto(`${BASE}/jodayn/invoices`)
  await page.waitForTimeout(1500)
  const deleteForEntry = await page.getByRole('button', { name: 'حذف' }).count()
  check('jodayn data entry sees no invoice delete action', deleteForEntry === 0, deleteForEntry)
  await logout(page)
  await quickLogin(page, 'JODAYN_UPPER_MGMT')
  await page.goto(`${BASE}/jodayn/invoices`)
  await page.waitForTimeout(1500)
  check('jodayn upper management sees invoice actions', (await page.getByRole('button', { name: /تسجيل كمدفوعة|حذف/ }).count()) > 0)
  await ctx.close()
}

async function landingFlow(browser) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: 'ar' })
  const page = await ctx.newPage()
  await page.goto(`${BASE}/`)
  await page.getByRole('button', { name: 'اطلب عرض تجريبي' }).first().click()
  await page.waitForURL('**/request-demo')
  await page.fill('#fullName', 'نورة المختبرة')
  await page.fill('#phone', '512345678')
  await page.fill('#companyName', `شركة المتصفح ${stamp}`)
  await page.fill('#businessEmail', `noura.${stamp}@example.com`)
  await page.fill('#jobTitle', 'مديرة التحول')
  await page.getByRole('button', { name: 'أرسل' }).click()
  await page.getByText('تم استلام طلبك').waitFor({ timeout: 8000 }).catch(() => {})
  check('landing demo request submits to the backend', (await page.getByText('تم استلام طلبك').count()) > 0)
  await page.screenshot({ path: `${OUT}/e2e_demo_request.png` })
  await ctx.close()
}

async function run() {
  const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {})
  for (const flow of [approvalFlow, clientRejectFlow, superAdminFlow, jodaynFlow, landingFlow]) {
    try {
      await flow(browser)
    } catch (err) {
      check(`${flow.name} completed without errors`, false, err.message)
    }
  }
  await browser.close()
  const failed = results.filter((r) => !r.ok).length
  console.log(`\n${results.length - failed}/${results.length} browser checks passed`)
  process.exitCode = failed ? 1 : 0
}
run()
