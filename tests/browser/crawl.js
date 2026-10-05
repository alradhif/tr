// Crawl every portal route per demo role, record failing API calls and console errors.
const { chromium } = require('playwright')
const BASE = process.env.BASE || 'http://localhost:5001'
const OUT = process.env.SHOTS_DIR || require('path').join(__dirname, 'shots')
require('fs').mkdirSync(OUT, { recursive: true })

const ROLES = [
  ['ORG_UPPER_MGMT', 'الدخول كجهة - إدارة عليا', 'org'],
  ['ORG_DATA_ENTRY', 'الدخول كجهة - مدخل بيانات', 'org'],
  ['CLIENT_UPPER_MGMT', 'الدخول كعميل - إدارة عليا', 'client'],
  ['CLIENT_DATA_ENTRY', 'الدخول كعميل - مدخل بيانات', 'client'],
  ['JODAYN_UPPER_MGMT', 'الدخول لحساب جودين - إدارة عليا', 'jodayn'],
  ['JODAYN_DATA_ENTRY', 'الدخول لحساب جودين - مدخل بيانات', 'jodayn'],
]
const ROUTES = {
  org: ['dashboard', 'goals', 'goals/new', 'projects', 'projects/new', 'companies', 'companies/new', 'departments', 'departments/new', 'settings'],
  client: ['dashboard', 'goals', 'goals/new', 'projects', 'projects/new', 'settings'],
  jodayn: ['dashboard', 'sectors', 'sectors/new', 'org-accounts', 'client-accounts', 'invoices', 'invoices/new', 'forecasts', 'forecasts/new', 'reports', 'reports/new', 'settings'],
  sa: ['', 'tenants', 'tenants/new', 'users', 'subscriptions', 'subscriptions/new', 'audit-log', 'settings'],
}

async function run() {
  const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {})
  const only = process.argv[2]
  const list = [...ROLES, ['SUPER_ADMIN', null, 'sa']].filter((r) => !only || r[0] === only)
  for (const [role, label, portal] of list) {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: 'ar' })
    const page = await ctx.newPage()
    const issues = []
    page.on('response', (r) => {
      if (r.url().includes('/api/') && r.status() >= 400) issues.push(`HTTP ${r.status()} ${r.request().method()} ${r.url().replace(BASE, '')}`)
    })
    page.on('console', (m) => { if (m.type() === 'error') issues.push(`console: ${m.text().slice(0, 200)}`) })
    page.on('pageerror', (e) => issues.push(`pageerror: ${e.message.slice(0, 200)}`))
    await page.goto(`${BASE}/login`)
    if (label) {
      await page.getByText(label).click()
    } else {
      await page.fill('#login-email', 'admin@trackplus.com')
      await page.fill('#login-password', 'admin123456')
      await page.click('button[type=submit]')
      await page.waitForURL('**/otp')
      const code = await page.evaluate(() => JSON.parse(sessionStorage.getItem('trackplus.pendingLogin')).demoCode)
      const inputs = page.locator('input')
      const n = await inputs.count()
      if (n >= 6) { for (let i = 0; i < 6; i++) await inputs.nth(i).fill(code[i]) } else await inputs.first().fill(code)
      await page.locator('button.auth-form__submit, button:has-text("تحقق")').first().click().catch(() => {})
    }
    await page.waitForTimeout(3500)
    console.log(`\n=== ${role} landed at ${page.url().replace(BASE, '')}`)
    const prefix = portal === 'sa' ? '/super-admin' : `/${portal}`
    for (const r of ROUTES[portal]) {
      issues.length = 0
      await page.goto(`${BASE}${prefix}/${r}`)
      await page.waitForTimeout(1800)
      const url = page.url().replace(BASE, '')
      await page.screenshot({ path: `${OUT}/${role}_${r.replace(/\//g, '_') || 'home'}.png` })
      console.log(`${prefix}/${r} -> ${url}${issues.length ? '\n   ' + [...new Set(issues)].join('\n   ') : ''}`)
    }
    await ctx.close()
  }
  await browser.close()
}
run().catch((e) => { console.error(e); process.exit(1) })
