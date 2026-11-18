const crypto = require('crypto')
const prisma = require('./prisma')

// A running record of who used the demo: quick-login presses, password sign-ins and invitations.
// It lives in its own table, outside Prisma's models, so the daily demo reset keeps it.
// Visitors are counted by a salted hash of their IP address; the address itself is never stored.

const TABLE = 'demo_visits'
let ready = null

function ensureVisitTable() {
  if (!ready) {
    ready = (async () => {
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS ${TABLE} (
          id BIGSERIAL PRIMARY KEY,
          at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          event TEXT NOT NULL,
          role TEXT,
          user_type TEXT,
          email TEXT,
          name TEXT,
          visitor TEXT,
          user_agent TEXT
        )
      `)
      await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS demo_visits_at_idx ON ${TABLE} (at)`)
    })().catch((err) => {
      ready = null
      throw err
    })
  }
  return ready
}

function visitorId(req) {
  const ip = req?.ip || req?.socket?.remoteAddress
  if (!ip) return null
  const salt = process.env.JWT_SECRET || 'trackplus'
  return crypto.createHash('sha256').update(`${salt}:${ip}`).digest('hex').slice(0, 16)
}

/**
 * Records one event. Never throws: a logging problem must not stop anyone signing in.
 * event: DEMO_LOGIN | LOGIN | INVITED
 */
async function logVisit(req, { event, user, userType, role } = {}) {
  try {
    await ensureVisitTable()
    const agent = String(req?.get?.('user-agent') || '').slice(0, 200) || null
    await prisma.$executeRawUnsafe(
      `INSERT INTO ${TABLE} (event, role, user_type, email, name, visitor, user_agent) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      event,
      role || user?.role || null,
      userType || null,
      user?.email || null,
      user?.name || null,
      visitorId(req),
      agent,
    )
  } catch (err) {
    console.error(`[visits] could not record ${event}: ${err.message}`)
  }
}

// Days and times are shown in Saudi time, where the demo's testers are.
const TZ = 'Asia/Riyadh'

/** Per-day totals for the last `days` days (Saudi dates), newest first. */
async function dailyVisitSummary(days = 30) {
  await ensureVisitTable()
  const rows = await prisma.$queryRawUnsafe(
    `SELECT to_char(at AT TIME ZONE '${TZ}', 'YYYY-MM-DD') AS day,
            COUNT(*) FILTER (WHERE event = 'DEMO_LOGIN')::int AS demo_logins,
            COUNT(DISTINCT visitor) FILTER (WHERE event = 'DEMO_LOGIN')::int AS demo_visitors,
            COUNT(*) FILTER (WHERE event = 'LOGIN')::int AS password_logins,
            COUNT(DISTINCT email) FILTER (WHERE event = 'LOGIN')::int AS password_users,
            COUNT(*) FILTER (WHERE event = 'INVITED')::int AS invited
       FROM ${TABLE}
      WHERE at >= NOW() - ($1::int * INTERVAL '1 day')
      GROUP BY 1
      ORDER BY 1 DESC`,
    days,
  )
  const byRole = await prisma.$queryRawUnsafe(
    `SELECT role, COUNT(*)::int AS count FROM ${TABLE}
      WHERE event = 'DEMO_LOGIN' AND at >= NOW() - ($1::int * INTERVAL '1 day')
      GROUP BY role ORDER BY count DESC`,
    days,
  )
  const people = await prisma.$queryRawUnsafe(
    `SELECT email, MAX(name) AS name, to_char(MIN(at) AT TIME ZONE '${TZ}', 'YYYY-MM-DD HH24:MI') AS first_seen, to_char(MAX(at) AT TIME ZONE '${TZ}', 'YYYY-MM-DD HH24:MI') AS last_seen,
            COUNT(*) FILTER (WHERE event = 'LOGIN')::int AS logins,
            BOOL_OR(event = 'INVITED') AS invited
       FROM ${TABLE}
      WHERE email IS NOT NULL AND event IN ('LOGIN', 'INVITED')
      GROUP BY email ORDER BY MAX(at) DESC LIMIT 200`,
  )
  return { days: rows, demoByRole: byRole, people }
}

module.exports = { TABLE, ensureVisitTable, logVisit, dailyVisitSummary }
