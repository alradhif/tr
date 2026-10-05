const express = require('express')
const cors = require('cors')
const fs = require('fs')
const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '../.env') })

if (!process.env.JWT_SECRET) {
  console.error('JWT_SECRET is not set')
  process.exit(1)
}

// ============ MIDDLEWARES ============
const auth = require('./middleware/auth')
const roles = require('./middleware/roles')

// ============ ROUTES ============
const authRoutes = require('./routes/auth')
const superAdminRoutes = require('./routes/superAdmin')
const orgRoutes = require('./routes/org')
const orgProjectsRoutes = require('./routes/orgProjects')
const orgDepartmentsRoutes = require('./routes/orgDepartments')
const orgCompaniesRoutes = require('./routes/orgCompanies')
const orgStrategyRoutes = require('./routes/orgStrategy')
const clientRoutes = require('./routes/client')
const clientProjectsRoutes = require('./routes/clientProjects')
const clientStrategyRoutes = require('./routes/clientStrategy')
const jodaynRoutes = require('./routes/jodayn')
const sharedLogsRoutes = require('./routes/sharedLogs')
const { ensureFreshDemo } = require('./services/demoService')

// ============ APP SETUP ============
const app = express()
app.set('trust proxy', true)
// Comma-separated list; the hosted build is served from the same origin and needs no entry
const frontendUrls = (process.env.FRONTEND_URL || 'http://localhost:5173')
  .split(',')
  .map((url) => url.trim())
  .filter(Boolean)
app.use(
  cors({
    origin: frontendUrls,
    credentials: true,
  })
)
app.use(express.json())

// ============ HEALTH CHECK ============
// Registered before the demo freshness check so probes never trigger a reset
app.get('/healthz', (_req, res) => {
  res.json({ status: 'ok' })
})

app.use('/api', async (_req, res, next) => {
  try {
    await ensureFreshDemo()
    next()
  } catch (err) {
    res.status(503).json({ message: 'جاري تحديث البيانات التجريبية، يرجى المحاولة بعد لحظات' })
  }
})

// ============ TEST ROUTES ============
app.get('/api/test/jodayn', auth, roles('JODAYN_UPPER_MGMT'), (req, res) => {
  res.json({ message: 'Welcome Jodayn Upper Management!', user: req.user })
})

// ============ API ROUTES ============
app.use('/api/auth', authRoutes)
app.use('/api/super-admin', superAdminRoutes)

// Org — more specific paths before /api/org
app.use('/api/org/departments', orgDepartmentsRoutes)
app.use('/api/org/companies', orgCompaniesRoutes)
app.use('/api/org/strategy', orgStrategyRoutes)
app.use('/api/org/projects', orgProjectsRoutes)
app.use('/api/org', orgRoutes)

// Client — more specific paths before /api/client
app.use('/api/client/projects', clientProjectsRoutes)
app.use('/api/client/strategy', clientStrategyRoutes)
app.use('/api/client', clientRoutes)

// Jodayn financial
app.use('/api/jodayn', jodaynRoutes)

// Shared: notifications, audit-logs, activity-logs
app.use('/api', sharedLogsRoutes)

app.use('/api', (_req, res) => {
  res.status(404).json({ message: 'Not found' })
})

// ============ FRONTEND ============
// Serve the built SPA when present (single-container deployment)
const frontendDist = process.env.FRONTEND_DIST || path.join(__dirname, '../../frontend/dist')
if (fs.existsSync(path.join(frontendDist, 'index.html'))) {
  app.use(express.static(frontendDist, { index: false, maxAge: '1h' }))
  app.get('/{*splat}', (_req, res) => {
    res.set('Cache-Control', 'no-cache')
    res.sendFile(path.join(frontendDist, 'index.html'))
  })
} else {
  app.get('/', (_req, res) => {
    res.json({ message: 'Track Plus API is running' })
  })
}

// ============ SERVER START ============
const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
