/**
 * Small in-memory limiter for sign-in style endpoints. Only failed attempts count, so people
 * who sign in correctly are never slowed down. One server instance is enough for the demo;
 * a shared store would be needed when running several instances.
 */
const WINDOW_MS = 15 * 60 * 1000
const MAX_FAILURES = 10
const failures = new Map()

function keyFor(req) {
  const email = String(req.body?.email || req.body?.challengeId || '').trim().toLowerCase()
  return `${req.path}|${req.ip}|${email}`
}

function recentFailures(key, now) {
  const list = (failures.get(key) || []).filter((at) => now - at < WINDOW_MS)
  if (list.length) failures.set(key, list)
  else failures.delete(key)
  return list
}

function limitFailedAttempts(req, res, next) {
  const key = keyFor(req)
  const now = Date.now()
  if (recentFailures(key, now).length >= MAX_FAILURES) {
    return res.status(429).json({ message: 'محاولات كثيرة غير ناجحة. حاول مرة أخرى بعد 15 دقيقة.' })
  }
  res.on('finish', () => {
    if (res.statusCode === 400 || res.statusCode === 401 || res.statusCode === 403) {
      failures.set(key, [...recentFailures(key, Date.now()), Date.now()])
    }
  })
  next()
}

module.exports = { limitFailedAttempts }
