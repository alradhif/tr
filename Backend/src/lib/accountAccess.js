const crypto = require('crypto')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const prisma = require('./prisma')

const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000
const OTP_TTL_MS = 5 * 60 * 1000
const OTP_RESEND_MS = 30 * 1000
const OTP_MAX_ATTEMPTS = 5
const MIN_PASSWORD_LENGTH = 8

const MODELS = {
  SUPER_ADMIN: () => prisma.superAdmin,
  JODAYN: () => prisma.jodaynUser,
  ORG: () => prisma.orgUser,
  CLIENT: () => prisma.clientUser,
}

const INCLUDES = {
  ORG: { org: true },
  CLIENT: { client: true },
}

function modelFor(type) {
  const getter = MODELS[type]
  if (!getter) throw Object.assign(new Error('Invalid actor type'), { status: 400 })
  return getter()
}

function findAccountById(type, id) {
  return modelFor(type).findUnique({ where: { id }, ...(INCLUDES[type] ? { include: INCLUDES[type] } : {}) })
}

function hashSecret(value) {
  return crypto.createHash('sha256').update(String(value)).digest('hex')
}

/** A bcrypt hash of random bytes nobody knows; invited users can't sign in until they set their own password. */
function unusablePasswordHash() {
  return bcrypt.hash(crypto.randomBytes(32).toString('hex'), 10)
}

function isValidNewPassword(password) {
  return typeof password === 'string' && password.length >= MIN_PASSWORD_LENGTH
}

function frontendUrl() {
  return (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/+$/, '')
}

function exposeSecretsInResponse() {
  return process.env.DEMO_MODE === 'true' || process.env.NODE_ENV !== 'production'
}

async function createAccountInvite({ userId, actorType, invitedBy }) {
  const token = crypto.randomBytes(32).toString('hex')
  const expiresAt = new Date(Date.now() + INVITE_TTL_MS)
  await prisma.$transaction([
    prisma.accountInvite.updateMany({
      where: { userId, actorType, usedAt: null },
      data: { usedAt: new Date() },
    }),
    prisma.accountInvite.create({
      data: { tokenHash: hashSecret(token), userId, actorType, invitedBy, expiresAt },
    }),
  ])
  return {
    inviteToken: token,
    inviteUrl: `${frontendUrl()}/activate?token=${token}`,
    inviteExpiresAt: expiresAt.toISOString(),
  }
}

async function findUsableInvite(token) {
  if (!token || typeof token !== 'string') return null
  const invite = await prisma.accountInvite.findUnique({ where: { tokenHash: hashSecret(token) } })
  if (!invite || invite.usedAt || invite.expiresAt < new Date()) return null
  const user = await findAccountById(invite.actorType, invite.userId)
  if (!user || !user.pendingActivation) return null
  return { invite, user }
}

/** Resolves a pending invite and sets the user's first password. Returns the activated user or null. */
async function activateInvite(token, password) {
  const found = await findUsableInvite(token)
  if (!found) return null
  const { invite, user } = found
  const hashed = await bcrypt.hash(password, 10)
  const claimed = await prisma.accountInvite.updateMany({
    where: { id: invite.id, usedAt: null },
    data: { usedAt: new Date() },
  })
  if (claimed.count !== 1) return null
  await modelFor(invite.actorType).update({
    where: { id: user.id },
    data: { password: hashed, pendingActivation: false },
  })
  return { user, actorType: invite.actorType }
}

function generateOtpCode() {
  return String(crypto.randomInt(0, 1000000)).padStart(6, '0')
}

function challengeCodeHash(challengeId, code) {
  return hashSecret(`${challengeId}:${code}`)
}

function challengeResponse(challenge, code) {
  const payload = {
    otpRequired: true,
    challengeId: challenge.id,
    expiresAt: challenge.expiresAt.toISOString(),
    resendAfterSeconds: Math.round(OTP_RESEND_MS / 1000),
  }
  if (exposeSecretsInResponse()) payload.demoCode = code
  return payload
}

async function startLoginChallenge(userId, actorType) {
  const id = crypto.randomUUID()
  const code = generateOtpCode()
  const challenge = await prisma.loginChallenge.create({
    data: {
      id,
      userId,
      actorType,
      codeHash: challengeCodeHash(id, code),
      expiresAt: new Date(Date.now() + OTP_TTL_MS),
    },
  })
  console.log(`[login-otp] type=${actorType} userId=${userId} challenge=${id} code=${code}`)
  return challengeResponse(challenge, code)
}

async function resendLoginChallenge(challengeId) {
  const challenge = await prisma.loginChallenge.findUnique({ where: { id: String(challengeId || '') } })
  if (!challenge || challenge.usedAt || challenge.attempts >= OTP_MAX_ATTEMPTS) return { error: 'INVALID' }
  if (Date.now() - challenge.sentAt.getTime() < OTP_RESEND_MS) return { error: 'TOO_SOON' }
  const code = generateOtpCode()
  const updated = await prisma.loginChallenge.update({
    where: { id: challenge.id },
    data: {
      codeHash: challengeCodeHash(challenge.id, code),
      sentAt: new Date(),
      expiresAt: new Date(Date.now() + OTP_TTL_MS),
    },
  })
  console.log(`[login-otp] resend challenge=${challenge.id} code=${code}`)
  return { response: challengeResponse(updated, code) }
}

/** Checks a login code. Returns { user, actorType } on success or { error } otherwise. */
async function verifyLoginChallenge(challengeId, code) {
  const challenge = await prisma.loginChallenge.findUnique({ where: { id: String(challengeId || '') } })
  if (!challenge || challenge.usedAt) return { error: 'INVALID' }
  if (challenge.expiresAt < new Date()) return { error: 'EXPIRED' }
  if (challenge.attempts >= OTP_MAX_ATTEMPTS) return { error: 'LOCKED' }

  const expected = Buffer.from(challenge.codeHash, 'hex')
  const actual = Buffer.from(challengeCodeHash(challenge.id, String(code || '')), 'hex')
  if (!crypto.timingSafeEqual(expected, actual)) {
    await prisma.loginChallenge.update({ where: { id: challenge.id }, data: { attempts: { increment: 1 } } })
    return { error: challenge.attempts + 1 >= OTP_MAX_ATTEMPTS ? 'LOCKED' : 'WRONG_CODE' }
  }

  const claimed = await prisma.loginChallenge.updateMany({
    where: { id: challenge.id, usedAt: null },
    data: { usedAt: new Date() },
  })
  if (claimed.count !== 1) return { error: 'INVALID' }

  const user = await findAccountById(challenge.actorType, challenge.userId)
  if (!user || !user.isActive || user.pendingActivation) return { error: 'INACTIVE' }
  return { user, actorType: challenge.actorType }
}

function sessionPayload(user, type) {
  const payload = {
    userId: user.id,
    role: type === 'SUPER_ADMIN' ? 'SUPER_ADMIN' : user.role,
    type,
  }
  if (type === 'ORG') payload.orgId = user.orgId
  if (type === 'CLIENT') payload.clientId = user.clientId
  return payload
}

function publicSessionUser(user, type) {
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
  }
}

function issueSession(user, type, extraClaims = {}) {
  const token = jwt.sign({ ...sessionPayload(user, type), ...extraClaims }, process.env.JWT_SECRET, {
    expiresIn: '24h',
  })
  return { token, user: publicSessionUser(user, type) }
}

module.exports = {
  MIN_PASSWORD_LENGTH,
  activateInvite,
  createAccountInvite,
  findAccountById,
  findUsableInvite,
  isValidNewPassword,
  issueSession,
  publicSessionUser,
  resendLoginChallenge,
  startLoginChallenge,
  unusablePasswordHash,
  verifyLoginChallenge,
}
