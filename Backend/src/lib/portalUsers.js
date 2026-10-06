const crypto = require('crypto')
const bcrypt = require('bcryptjs')
const prisma = require('./prisma')
const { resolveInviteRole } = require('./passwords')
const { writeAuditLog } = require('./audit')

const PORTALS = {
  ORG: { model: () => prisma.orgUser, scopeKey: 'orgId', table: 'org_users' },
  CLIENT: { model: () => prisma.clientUser, scopeKey: 'clientId', table: 'client_users' },
  JODAYN: { model: () => prisma.jodaynUser, scopeKey: null, table: 'jodayn_users' },
}

const USER_SELECT = {
  id: true,
  name: true,
  email: true,
  role: true,
  isActive: true,
  pendingActivation: true,
  activatedAt: true,
  lastLoginAt: true,
  createdAt: true,
}

const PASSWORD_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789'

/** Random initial password: 12 chars, always mixing upper, lower and digits. */
function generateTemporaryPassword() {
  const pick = (set) => set[crypto.randomInt(0, set.length)]
  const chars = [pick('ABCDEFGHJKLMNPQRSTUVWXYZ'), pick('abcdefghijkmnpqrstuvwxyz'), pick('23456789')]
  while (chars.length < 12) chars.push(pick(PASSWORD_ALPHABET))
  for (let i = chars.length - 1; i > 0; i -= 1) {
    const j = crypto.randomInt(0, i + 1)
    ;[chars[i], chars[j]] = [chars[j], chars[i]]
  }
  return chars.join('')
}

function emailTaken(email) {
  return Promise.all([
    prisma.orgUser.findUnique({ where: { email }, select: { id: true } }),
    prisma.clientUser.findUnique({ where: { email }, select: { id: true } }),
    prisma.jodaynUser.findUnique({ where: { email }, select: { id: true } }),
    prisma.superAdmin.findUnique({ where: { email }, select: { id: true } }),
  ]).then((rows) => rows.some(Boolean))
}

/**
 * Creates an invited account with a one-time initial password. The account starts
 * inactive ("غير نشط", pendingActivation) and becomes active on its first successful login.
 * The plain password is returned to the caller once and only its bcrypt hash is stored.
 */
async function createInvitedUser({ type, name, email, role, scopeId, invitedBy, invitedByType, initialPassword }) {
  const portal = PORTALS[type]
  const normalized = String(email || '').trim().toLowerCase()
  const cleanName = String(name || '').trim()
  if (!cleanName || !normalized || !role) {
    throw Object.assign(new Error('الاسم والبريد الإلكتروني والدور مطلوبة'), { status: 400 })
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
    throw Object.assign(new Error('صيغة البريد الإلكتروني غير صحيحة'), { status: 400 })
  }
  if (await emailTaken(normalized)) {
    throw Object.assign(new Error('البريد الإلكتروني مستخدم مسبقاً'), { status: 400 })
  }
  if (initialPassword !== undefined && initialPassword !== null && initialPassword !== '') {
    if (typeof initialPassword !== 'string' || initialPassword.length < 8) {
      throw Object.assign(new Error('كلمة المرور المؤقتة يجب أن تكون 8 أحرف على الأقل'), { status: 400 })
    }
  }
  const temporaryPassword = initialPassword || generateTemporaryPassword()
  const data = {
    name: cleanName,
    email: normalized,
    password: await bcrypt.hash(temporaryPassword, 10),
    role,
    isActive: true,
    pendingActivation: true,
  }
  if (portal.scopeKey) data[portal.scopeKey] = scopeId
  const user = await portal.model().create({ data, select: USER_SELECT })
  await writeAuditLog({
    action: 'CREATE',
    tableName: portal.table,
    recordId: user.id,
    newData: { name: user.name, email: user.email, role: user.role, pendingActivation: true },
    performedBy: invitedBy,
    actorType: invitedByType || type,
  }).catch(() => {})
  return { user, temporaryPassword }
}

function sendError(res, err) {
  res.status(err.status || 500).json({ message: err.message })
}

function scopeOf(req, type) {
  const key = PORTALS[type].scopeKey
  return key ? req.user[key] : null
}

async function loadScopedUser(req, type) {
  const portal = PORTALS[type]
  const user = await portal.model().findUnique({ where: { id: req.params.id } })
  if (!user) throw Object.assign(new Error('User not found'), { status: 404 })
  if (portal.scopeKey && user[portal.scopeKey] !== scopeOf(req, type)) {
    throw Object.assign(new Error('Access denied'), { status: 403 })
  }
  return user
}

/** Express handlers for one portal's user management (invite, list, toggle, reset credentials). */
function portalUserHandlers(type) {
  const portal = PORTALS[type]

  return {
    create: async (req, res) => {
      try {
        const role = resolveInviteRole(req.body, type)
        const scopeId = scopeOf(req, type)
        if (portal.scopeKey && !scopeId) return res.status(403).json({ message: 'Account scope required' })
        const { user, temporaryPassword } = await createInvitedUser({
          type,
          name: req.body.name,
          email: req.body.email,
          role,
          scopeId,
          invitedBy: req.user.userId,
          invitedByType: req.user.type,
        })
        res.json({ success: true, user, temporaryPassword })
      } catch (err) {
        sendError(res, err)
      }
    },

    list: async (req, res) => {
      try {
        const where = portal.scopeKey ? { [portal.scopeKey]: scopeOf(req, type) } : {}
        const users = await portal.model().findMany({ where, select: USER_SELECT, orderBy: { createdAt: 'asc' } })
        res.json({ users })
      } catch (err) {
        sendError(res, err)
      }
    },

    // Minimal list any member may read, e.g. to pick a project manager
    assignable: async (req, res) => {
      try {
        const where = { isActive: true, ...(portal.scopeKey ? { [portal.scopeKey]: scopeOf(req, type) } : {}) }
        const users = await portal.model().findMany({
          where,
          select: { id: true, name: true, email: true, role: true, isActive: true },
          orderBy: { name: 'asc' },
        })
        res.json({ users })
      } catch (err) {
        sendError(res, err)
      }
    },

    toggle: async (req, res) => {
      try {
        const current = await loadScopedUser(req, type)
        if (current.id === req.user.userId) {
          return res.status(400).json({ message: 'لا يمكنك تعطيل حسابك الحالي' })
        }
        const updated = await portal.model().update({
          where: { id: current.id },
          data: { isActive: !current.isActive },
          select: USER_SELECT,
        })
        await writeAuditLog({
          action: 'UPDATE',
          tableName: portal.table,
          recordId: current.id,
          oldData: { isActive: current.isActive },
          newData: { isActive: updated.isActive },
          performedBy: req.user.userId,
          actorType: req.user.type || type,
        }).catch(() => {})
        res.json({ success: true, isActive: updated.isActive, user: updated })
      } catch (err) {
        sendError(res, err)
      }
    },

    // Issues a fresh initial password for an invited user who has not signed in yet
    resetCredentials: async (req, res) => {
      try {
        const current = await loadScopedUser(req, type)
        if (!current.pendingActivation) {
          return res.status(400).json({ message: 'تم تفعيل هذا الحساب مسبقاً' })
        }
        const temporaryPassword = generateTemporaryPassword()
        await portal.model().update({
          where: { id: current.id },
          data: { password: await bcrypt.hash(temporaryPassword, 10) },
        })
        res.json({
          success: true,
          user: { id: current.id, name: current.name, email: current.email },
          temporaryPassword,
        })
      } catch (err) {
        sendError(res, err)
      }
    },
  }
}

module.exports = {
  USER_SELECT,
  createInvitedUser,
  emailTaken,
  generateTemporaryPassword,
  portalUserHandlers,
}
