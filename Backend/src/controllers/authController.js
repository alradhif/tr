const crypto = require('crypto')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const prisma = require('../lib/prisma')
const { listDemoAccounts, loginDemoAccount } = require('../services/demoService')
const { isDemoEnvironment } = require('../lib/demoSafety')

const ACTOR_TYPE_MAP = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  JODAYN: 'JODAYN',
  ORG: 'ORG',
  CLIENT: 'CLIENT'
}

async function findUserByEmailAndType(email, type) {
  switch (type) {
    case 'SUPER_ADMIN':
      return prisma.superAdmin.findUnique({ where: { email } })
    case 'JODAYN':
      return prisma.jodaynUser.findUnique({ where: { email } })
    case 'ORG':
      return prisma.orgUser.findUnique({ where: { email } })
    case 'CLIENT':
      return prisma.clientUser.findUnique({ where: { email } })
    default:
      return null
  }
}

async function updatePasswordByType(userId, type, hashedPassword) {
  switch (type) {
    case 'SUPER_ADMIN':
      return prisma.superAdmin.update({
        where: { id: userId },
        data: { password: hashedPassword }
      })
    case 'JODAYN':
      return prisma.jodaynUser.update({
        where: { id: userId },
        data: { password: hashedPassword }
      })
    case 'ORG':
      return prisma.orgUser.update({
        where: { id: userId },
        data: { password: hashedPassword }
      })
    case 'CLIENT':
      return prisma.clientUser.update({
        where: { id: userId },
        data: { password: hashedPassword }
      })
    default:
      throw new Error('Invalid actor type')
  }
}

// Jodayn login
exports.loginJodayn = async (req, res) => {
  try {
    const { email, password } = req.body
    const user = await prisma.jodaynUser.findUnique({ where: { email } })
    if (!user) return res.status(400).json({ message: 'بيانات الدخول غير صحيحة' })
    if (!user.isActive) return res.status(400).json({ message: 'هذا الحساب غير نشط' })
    const valid = await bcrypt.compare(password, user.password)
    if (!valid) return res.status(400).json({ message: 'بيانات الدخول غير صحيحة' })
    const token = jwt.sign(
      { userId: user.id, role: user.role, type: 'JODAYN' },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    )
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// Org login
exports.loginOrg = async (req, res) => {
  try {
    const { email, password } = req.body
    const user = await prisma.orgUser.findUnique({ where: { email }, include: { org: true } })
    if (!user) return res.status(400).json({ message: 'بيانات الدخول غير صحيحة' })
    if (!user.isActive) return res.status(400).json({ message: 'هذا الحساب غير نشط' })
    const valid = await bcrypt.compare(password, user.password)
    if (!valid) return res.status(400).json({ message: 'بيانات الدخول غير صحيحة' })
    const token = jwt.sign(
      { userId: user.id, role: user.role, orgId: user.orgId, type: 'ORG' },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    )
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role, orgId: user.orgId, orgName: user.org?.name || null } })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// Client login
exports.loginClient = async (req, res) => {
  try {
    const { email, password } = req.body
    const user = await prisma.clientUser.findUnique({ where: { email }, include: { client: true } })
    if (!user) return res.status(400).json({ message: 'بيانات الدخول غير صحيحة' })
    if (!user.isActive) return res.status(400).json({ message: 'هذا الحساب غير نشط' })
    const valid = await bcrypt.compare(password, user.password)
    if (!valid) return res.status(400).json({ message: 'بيانات الدخول غير صحيحة' })
    const token = jwt.sign(
      { userId: user.id, role: user.role, clientId: user.clientId, type: 'CLIENT' },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    )
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role, clientId: user.clientId, clientName: user.client?.name || null } })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// Super Admin login
exports.loginSuperAdmin = async (req, res) => {
  try {
    const { email, password } = req.body
    const admin = await prisma.superAdmin.findUnique({ where: { email } })
    if (!admin) return res.status(400).json({ message: 'بيانات الدخول غير صحيحة' })
    if (!admin.isActive) return res.status(400).json({ message: 'هذا الحساب غير نشط' })
    const valid = await bcrypt.compare(password, admin.password)
    if (!valid) return res.status(400).json({ message: 'بيانات الدخول غير صحيحة' })
    const token = jwt.sign(
      { userId: admin.id, role: 'SUPER_ADMIN', type: 'SUPER_ADMIN' },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    )
    res.json({ token, user: { id: admin.id, name: admin.name, email: admin.email, role: 'SUPER_ADMIN' } })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// Forgot password — all 4 actor types
exports.forgotPassword = async (req, res) => {
  try {
    const { email, type } = req.body

    if (!email || !type) {
      return res.status(400).json({ message: 'Required fields: email, type' })
    }

    const actorType = ACTOR_TYPE_MAP[type]
    if (!actorType) {
      return res.status(400).json({
        message: 'Invalid type. Must be SUPER_ADMIN, JODAYN, ORG, or CLIENT'
      })
    }

    const user = await findUserByEmailAndType(email, actorType)
    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    const token = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

    await prisma.passwordResetToken.create({
      data: {
        token,
        userId: user.id,
        actorType,
        expiresAt
      }
    })

    console.log(`[forgot-password] type=${actorType} email=${email} token=${token}`)

    const payload = { success: true }
    // No email delivery yet: hand the token back outside production and on the demo
    if (process.env.NODE_ENV !== 'production' || isDemoEnvironment()) {
      payload.token = token
    }

    res.json(payload)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// Reset password with token
exports.resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body

    if (!token || !newPassword) {
      return res.status(400).json({ message: 'Required fields: token, newPassword' })
    }

    const resetToken = await prisma.passwordResetToken.findUnique({ where: { token } })
    if (!resetToken) {
      return res.status(400).json({ message: 'Invalid or expired token' })
    }

    if (resetToken.isUsed) {
      return res.status(400).json({ message: 'Token already used' })
    }

    if (new Date(resetToken.expiresAt) < new Date()) {
      return res.status(400).json({ message: 'Invalid or expired token' })
    }

    const hashed = await bcrypt.hash(newPassword, 10)
    await updatePasswordByType(resetToken.userId, resetToken.actorType, hashed)

    await prisma.passwordResetToken.update({
      where: { id: resetToken.id },
      data: { isUsed: true }
    })

    res.json({ success: true, message: 'Password reset successfully' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

exports.getDemoStatus = (_req, res) => {
  res.json({ enabled: isDemoEnvironment() })
}

exports.getDemoAccounts = async (_req, res) => {
  try {
    res.json(await listDemoAccounts())
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message })
  }
}

exports.loginDemo = async (req, res) => {
  try {
    const { type, userId, role } = req.body
    if ((!type || !userId) && !role) {
      return res.status(400).json({ message: 'role or type and userId are required' })
    }
    const session = await loginDemoAccount(type, userId, role)
    if (!session) return res.status(404).json({ message: 'تعذر الدخول إلى الحساب التجريبي' })
    res.json(session)
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message })
  }
}

exports.loginAny = async (req, res) => {
  try {
    const { email, password } = req.body
    if (!email || !password) {
      return res.status(400).json({ message: 'الرجاء إدخال البريد الإلكتروني وكلمة المرور' })
    }

    const normalized = String(email).trim().toLowerCase()
    const candidates = [
      { type: 'SUPER_ADMIN', user: await prisma.superAdmin.findUnique({ where: { email: normalized } }) },
      { type: 'JODAYN', user: await prisma.jodaynUser.findUnique({ where: { email: normalized } }) },
      { type: 'ORG', user: await prisma.orgUser.findUnique({ where: { email: normalized } }) },
      { type: 'CLIENT', user: await prisma.clientUser.findUnique({ where: { email: normalized } }) },
    ]

    const match = candidates.find((candidate) => candidate.user)
    if (!match) return res.status(400).json({ message: 'بيانات الدخول غير صحيحة' })
    if (!match.user.isActive) return res.status(400).json({ message: 'هذا الحساب غير نشط' })

    const valid = await bcrypt.compare(password, match.user.password)
    if (!valid) return res.status(400).json({ message: 'بيانات الدخول غير صحيحة' })

    const payload = {
      userId: match.user.id,
      role: match.type === 'SUPER_ADMIN' ? 'SUPER_ADMIN' : match.user.role,
      type: match.type,
    }
    if (match.type === 'ORG') payload.orgId = match.user.orgId
    if (match.type === 'CLIENT') payload.clientId = match.user.clientId

    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '24h' })
    res.json({
      token,
      user: {
        id: match.user.id,
        name: match.user.name,
        email: match.user.email,
        role: payload.role,
        type: match.type,
        orgId: match.user.orgId,
        clientId: match.user.clientId,
      },
    })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}
