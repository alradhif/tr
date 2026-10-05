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

module.exports = {
  DEMO_DATABASE_NAME: 'trackplus_demo',
  getDatabaseName,
  isDemoEnvironment,
  assertDemoResetAllowed,
}
