const crypto = require('crypto')
const bcrypt = require('bcryptjs')
const prisma = require('../lib/prisma')
const {
  MIN_PASSWORD_LENGTH,
  activateInvite,
  findUsableInvite,
  isValidNewPassword,
  issueSession,
  publicSessionUser,
  parentAccountActive,
  recordFailedLogin,
  resendLoginChallenge,
  startLoginChallenge,
  verifyLoginChallenge,
} = require('../lib/accountAccess')
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
        data: { password: hashedPassword, pendingActivation: false }
      })
    case 'ORG':
      return prisma.orgUser.update({
        where: { id: userId },
        data: { password: hashedPassword, pendingActivation: false }
      })
    case 'CLIENT':
      return prisma.clientUser.update({
        where: { id: userId },
        data: { password: hashedPassword, pendingActivation: false }
      })
    default:
      throw new Error('Invalid actor type')
  }
}

const INVALID_LOGIN = 'بيانات الدخول غير صحيحة'
const INACTIVE_ACCOUNT = 'هذا الحساب غير نشط'
const ACCOUNT_SUSPENDED = 'تم تعليق حساب الجهة. تواصل مع إدارة المنصة'

/**
 * Checks email + password and, when they match, opens a one-time-code challenge.
 * No session token is issued until the code is verified.
 */
async function startPasswordLogin(req, res, types) {
  try {
    const { email, password } = req.body || {}
    if (!email || !password) {
      return res.status(400).json({ message: 'الرجاء إدخال البريد الإلكتروني وكلمة المرور' })
    }

    const normalized = String(email).trim().toLowerCase()
    let match = null
    for (const type of types) {
      const user = await findUserByEmailAndType(normalized, type)
      if (user) {
        match = { type, user }
        break
      }
    }

    if (!match) return res.status(400).json({ message: INVALID_LOGIN })
    if (!match.user.isActive) return res.status(400).json({ message: INACTIVE_ACCOUNT })

    const valid = await bcrypt.compare(String(password), match.user.password)
    if (!valid) {
      await recordFailedLogin(match.user, match.type, 'WRONG_PASSWORD')
      return res.status(400).json({ message: INVALID_LOGIN })
    }
    if (!(await parentAccountActive(match.type, match.user))) {
      return res.status(403).json({ message: ACCOUNT_SUSPENDED, code: 'SUSPENDED' })
    }
    // Invited accounts sign in with their initial credentials; the first verified login activates them.

    res.json(await startLoginChallenge(match.user.id, match.type))
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

exports.loginJodayn = (req, res) => startPasswordLogin(req, res, ['JODAYN'])
exports.loginOrg = (req, res) => startPasswordLogin(req, res, ['ORG'])
exports.loginClient = (req, res) => startPasswordLogin(req, res, ['CLIENT'])
exports.loginSuperAdmin = (req, res) => startPasswordLogin(req, res, ['SUPER_ADMIN'])
exports.loginAny = (req, res) => startPasswordLogin(req, res, ['SUPER_ADMIN', 'JODAYN', 'ORG', 'CLIENT'])

const OTP_ERRORS = {
  INVALID: { status: 400, message: 'انتهت صلاحية طلب الدخول. الرجاء تسجيل الدخول مرة أخرى' },
  EXPIRED: { status: 400, message: 'انتهت صلاحية الرمز. الرجاء طلب رمز جديد' },
  LOCKED: { status: 429, message: 'تم تجاوز عدد المحاولات. الرجاء تسجيل الدخول مرة أخرى' },
  WRONG_CODE: { status: 400, message: 'الرمز غير صحيح، الرجاء المحاولة مرة أخرى' },
  INACTIVE: { status: 400, message: INACTIVE_ACCOUNT },
  SUSPENDED: { status: 403, message: ACCOUNT_SUSPENDED },
  TOO_SOON: { status: 429, message: 'الرجاء الانتظار قبل طلب رمز جديد' },
}

function sendOtpError(res, error) {
  const { status, message } = OTP_ERRORS[error] || OTP_ERRORS.INVALID
  res.status(status).json({ message, code: error })
}

// Second login step: exchange the one-time code for a session
exports.verifyLoginCode = async (req, res) => {
  try {
    const { challengeId, code } = req.body || {}
    if (!challengeId || !code) return res.status(400).json({ message: 'الرجاء إدخال الرمز المكوّن من 6 أرقام' })
    const result = await verifyLoginChallenge(challengeId, code)
    if (result.error) return sendOtpError(res, result.error)
    res.json(issueSession(result.user, result.actorType))
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

exports.resendLoginCode = async (req, res) => {
  try {
    const result = await resendLoginChallenge(req.body?.challengeId)
    if (result.error) return sendOtpError(res, result.error)
    res.json(result.response)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

const INVALID_INVITE = 'رابط الدعوة غير صالح أو منتهي الصلاحية'

// Invite lookup so the activation page can greet the invited user
exports.getInvite = async (req, res) => {
  try {
    const found = await findUsableInvite(req.params.token)
    if (!found) return res.status(404).json({ message: INVALID_INVITE })
    const user = publicSessionUser(found.user, found.invite.actorType)
    res.json({
      name: user.name,
      email: user.email,
      role: user.role,
      type: user.type,
      orgName: user.orgName,
      clientName: user.clientName,
      expiresAt: found.invite.expiresAt.toISOString(),
    })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// Invited user sets their first password; afterwards they sign in normally
exports.activateAccount = async (req, res) => {
  try {
    const { token, password } = req.body || {}
    if (!token) return res.status(400).json({ message: INVALID_INVITE })
    if (!isValidNewPassword(password)) {
      return res.status(400).json({ message: `كلمة المرور يجب أن تتكون من ${MIN_PASSWORD_LENGTH} أحرف على الأقل` })
    }
    const activated = await activateInvite(token, password)
    if (!activated) return res.status(400).json({ message: INVALID_INVITE })
    res.json({ success: true, email: activated.user.email })
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
    if (!isValidNewPassword(newPassword)) {
      return res.status(400).json({ message: `كلمة المرور يجب أن تتكون من ${MIN_PASSWORD_LENGTH} أحرف على الأقل` })
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
