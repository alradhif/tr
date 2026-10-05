const jwt = require('jsonwebtoken')
const prisma = require('../lib/prisma')
const { seedDatabase } = require('../utils/seed')
const { assertDemoResetAllowed, isDemoEnvironment } = require('../lib/demoSafety')

const RESET_INTERVAL_MS = 24 * 60 * 60 * 1000
const BASELINE_EMAILS = new Set([
  'admin@trackplus.com',
  'fai@jodayn.com',
  'fai.entry@jodayn.com',
  'seed.orguser@acme.com',
  'seed.orguser.entry@acme.com',
  'seed.clientuser.mgmt@acme-client.com',
  'seed.clientuser.entry@acme-client.com',
])

let resetPromise = null

function assertDemoMode() {
  if (!isDemoEnvironment()) {
    const error = new Error('Demo access is disabled')
    error.status = 404
    throw error
  }
}

async function ensureDemoStateTable() {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS demo_state (
      id INTEGER PRIMARY KEY,
      last_reset TIMESTAMPTZ NOT NULL
    )
  `)
  await prisma.$executeRawUnsafe(`
    INSERT INTO demo_state (id, last_reset)
    VALUES (1, NOW())
    ON CONFLICT (id) DO NOTHING
  `)
}

async function resetDemoDatabase() {
  assertDemoMode()
  assertDemoResetAllowed()
  await ensureDemoStateTable()
  const tables = await prisma.$queryRawUnsafe(`
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public'
      AND tablename NOT IN ('_prisma_migrations', 'demo_state')
  `)

  if (tables.length) {
    const quoted = tables.map(({ tablename }) => `"${String(tablename).replaceAll('"', '""')}"`)
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${quoted.join(', ')} RESTART IDENTITY CASCADE`)
  }

  await seedDatabase()
  await prisma.$executeRawUnsafe('UPDATE demo_state SET last_reset = NOW() WHERE id = 1')
}

async function ensureFreshDemo() {
  if (process.env.DEMO_MODE !== 'true') return
  if (resetPromise) return resetPromise

  resetPromise = (async () => {
    await ensureDemoStateTable()
    const [state] = await prisma.$queryRawUnsafe('SELECT last_reset FROM demo_state WHERE id = 1')
    const lastReset = new Date(state.last_reset).getTime()
    if (Date.now() - lastReset >= RESET_INTERVAL_MS) {
      await resetDemoDatabase()
      return
    }
    const orgProjectCount = await prisma.orgProject.count()
    if (orgProjectCount === 0) {
      assertDemoResetAllowed()
      await seedDatabase()
    }
  })()

  try {
    await resetPromise
  } finally {
    resetPromise = null
  }
}

function publicUser(user, type) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: type === 'SUPER_ADMIN' ? 'SUPER_ADMIN' : user.role,
    type,
    orgId: user.orgId,
    clientId: user.clientId,
    orgName: user.org?.name || null,
    clientName: user.client?.name || null,
    isSeed: BASELINE_EMAILS.has(user.email),
  }
}

async function listDemoAccounts() {
  assertDemoMode()
  const [admins, jodayn, orgs, clients, stateRows] = await Promise.all([
    prisma.superAdmin.findMany({ where: { isActive: true }, orderBy: { createdAt: 'asc' } }),
    prisma.jodaynUser.findMany({ where: { isActive: true, pendingActivation: false }, orderBy: { createdAt: 'asc' } }),
    prisma.orgUser.findMany({ where: { isActive: true, pendingActivation: false }, orderBy: { createdAt: 'asc' } }),
    prisma.clientUser.findMany({ where: { isActive: true, pendingActivation: false }, orderBy: { createdAt: 'asc' } }),
    prisma.$queryRawUnsafe('SELECT last_reset FROM demo_state WHERE id = 1'),
  ])

  const accounts = [
    ...admins.map((user) => publicUser(user, 'SUPER_ADMIN')),
    ...jodayn.map((user) => publicUser(user, 'JODAYN')),
    ...orgs.map((user) => publicUser(user, 'ORG')),
    ...clients.map((user) => publicUser(user, 'CLIENT')),
  ]
  const lastReset = new Date(stateRows[0].last_reset)
  return { accounts, resetsAt: new Date(lastReset.getTime() + RESET_INTERVAL_MS).toISOString() }
}

const DEMO_ROLE_EMAILS = {
  SUPER_ADMIN: 'admin@trackplus.com',
  JODAYN_UPPER_MGMT: 'fai@jodayn.com',
  JODAYN_DATA_ENTRY: 'fai.entry@jodayn.com',
  ORG_UPPER_MGMT: 'seed.orguser@acme.com',
  ORG_DATA_ENTRY: 'seed.orguser.entry@acme.com',
  CLIENT_UPPER_MGMT: 'seed.clientuser.mgmt@acme-client.com',
  CLIENT_DATA_ENTRY: 'seed.clientuser.entry@acme-client.com',
}

const ROLE_ACCOUNT_TYPE = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  JODAYN_UPPER_MGMT: 'JODAYN',
  JODAYN_DATA_ENTRY: 'JODAYN',
  ORG_UPPER_MGMT: 'ORG',
  ORG_DATA_ENTRY: 'ORG',
  CLIENT_UPPER_MGMT: 'CLIENT',
  CLIENT_DATA_ENTRY: 'CLIENT',
}

async function loginDemoAccount(type, userId, role) {
  assertDemoMode()
  let resolvedType = type
  let resolvedUserId = userId

  if ((!resolvedType || !resolvedUserId) && role) {
    const email = DEMO_ROLE_EMAILS[role]
    resolvedType = ROLE_ACCOUNT_TYPE[role]
    if (!email || !resolvedType) return null
    const lookup = {
      SUPER_ADMIN: () => prisma.superAdmin.findUnique({ where: { email } }),
      JODAYN: () => prisma.jodaynUser.findUnique({ where: { email } }),
      ORG: () => prisma.orgUser.findUnique({ where: { email } }),
      CLIENT: () => prisma.clientUser.findUnique({ where: { email } }),
    }
    const found = await lookup[resolvedType]()
    if (!found) return null
    resolvedUserId = found.id
  }

  const models = {
    SUPER_ADMIN: prisma.superAdmin,
    JODAYN: prisma.jodaynUser,
    ORG: prisma.orgUser,
    CLIENT: prisma.clientUser,
  }
  const model = models[resolvedType]
  if (!model) return null

  const user = resolvedType === 'ORG'
    ? await prisma.orgUser.findUnique({ where: { id: resolvedUserId }, include: { org: true } })
    : resolvedType === 'CLIENT'
      ? await prisma.clientUser.findUnique({ where: { id: resolvedUserId }, include: { client: true } })
      : await model.findUnique({ where: { id: resolvedUserId } })
  if (!user || !user.isActive || user.pendingActivation) return null

  const payload = {
    userId: user.id,
    role: resolvedType === 'SUPER_ADMIN' ? 'SUPER_ADMIN' : user.role,
    type: resolvedType,
  }
  if (resolvedType === 'ORG') payload.orgId = user.orgId
  if (resolvedType === 'CLIENT') payload.clientId = user.clientId

  return {
    token: jwt.sign({ ...payload, demo: true }, process.env.JWT_SECRET, { expiresIn: '24h' }),
    user: publicUser(user, resolvedType),
  }
}

module.exports = {
  ensureFreshDemo,
  listDemoAccounts,
  loginDemoAccount,
  resetDemoDatabase,
}
