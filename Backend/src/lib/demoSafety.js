function getDatabaseName(connectionString = process.env.DATABASE_URL) {
  if (!connectionString) return ''
  try {
    const parsed = new URL(connectionString)
    return decodeURIComponent(parsed.pathname.replace(/^\//, '')).split('?')[0]
  } catch {
    const path = String(connectionString).replace(/^[a-z]+:\/\//i, '').split('/').slice(1).join('/')
    return path.split('?')[0] || ''
  }
}

// Demo-only features (quick login, resets) require both the flag and the
// dedicated demo database, so a misconfigured flag cannot expose real data.
function isDemoEnvironment() {
  return process.env.DEMO_MODE === 'true' && getDatabaseName() === 'trackplus_demo'
}

function assertDemoResetAllowed() {
  if (process.env.DEMO_MODE !== 'true') {
    const error = new Error('Demo reset refused: DEMO_MODE is not true')
    error.status = 403
    throw error
  }

  const databaseName = getDatabaseName()
  if (databaseName !== 'trackplus_demo') {
    const error = new Error('Demo reset refused: active database is not trackplus_demo')
    error.status = 403
    throw error
  }
}

/**
 * Asks PostgreSQL which database the open connection is really using, so a proxy,
 * socket path or unusual URL cannot point a reset at anything but trackplus_demo.
 */
async function assertConnectedToDemoDatabase(prisma) {
  assertDemoResetAllowed()
  const rows = await prisma.$queryRawUnsafe('SELECT current_database() AS name')
  const connected = rows?.[0]?.name
  if (connected !== 'trackplus_demo') {
    const error = new Error(`Demo reset refused: connected database is ${connected || 'unknown'}, not trackplus_demo`)
    error.status = 403
    throw error
  }
  return connected
}

module.exports = {
  assertConnectedToDemoDatabase,
  DEMO_DATABASE_NAME: 'trackplus_demo',
  getDatabaseName,
  isDemoEnvironment,
  assertDemoResetAllowed,
}
