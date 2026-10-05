const prisma = require('../lib/prisma')
const { resolveInviteRole } = require('../lib/passwords')
const { createAccountInvite, unusablePasswordHash } = require('../lib/accountAccess')

exports.createJodaynPortalUser = async (req, res) => {
  try {
    const { name } = req.body
    const email = String(req.body.email || '').trim().toLowerCase()
    const role = resolveInviteRole(req.body, 'JODAYN')
    if (!name || !email || !role) {
      return res.status(400).json({ message: 'الاسم والبريد الإلكتروني والدور مطلوبة' })
    }

    const existing = await prisma.jodaynUser.findUnique({ where: { email } })
    if (existing) return res.status(400).json({ message: 'البريد الإلكتروني مستخدم مسبقاً' })

    const hashed = await unusablePasswordHash()
    const user = await prisma.jodaynUser.create({
      data: { name, email, password: hashed, role, isActive: true, pendingActivation: true },
    })

    const invite = await createAccountInvite({ userId: user.id, actorType: 'JODAYN', invitedBy: req.user.userId })

    res.json({
      success: true,
      user: { id: user.id, name: user.name, email: user.email, role: user.role, isActive: user.isActive, pendingActivation: user.pendingActivation, createdAt: user.createdAt },
      inviteUrl: invite.inviteUrl,
      inviteExpiresAt: invite.inviteExpiresAt,
    })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

exports.getJodaynUsers = async (_req, res) => {
  try {
    const users = await prisma.jodaynUser.findMany({
      select: { id: true, name: true, email: true, role: true, isActive: true, pendingActivation: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    })
    res.json({ users })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

exports.toggleJodaynUser = async (req, res) => {
  try {
    const { id } = req.params
    const current = await prisma.jodaynUser.findUnique({ where: { id } })
    if (!current) return res.status(404).json({ message: 'User not found' })
    if (current.id === req.user.userId) {
      return res.status(400).json({ message: 'لا يمكنك تعطيل حسابك الحالي' })
    }

    const updated = await prisma.jodaynUser.update({
      where: { id },
      data: { isActive: !current.isActive },
    })
    res.json({ success: true, isActive: updated.isActive })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// إعادة إصدار رابط الدعوة لمستخدم لم يفعّل حسابه بعد
exports.reissueJodaynInvite = async (req, res) => {
  try {
    const current = await prisma.jodaynUser.findUnique({ where: { id: req.params.id } })
    if (!current) return res.status(404).json({ message: 'User not found' })
    if (!current.pendingActivation) return res.status(400).json({ message: 'تم تفعيل هذا الحساب مسبقاً' })

    const invite = await createAccountInvite({ userId: current.id, actorType: 'JODAYN', invitedBy: req.user.userId })
    res.json({ success: true, inviteUrl: invite.inviteUrl, inviteExpiresAt: invite.inviteExpiresAt })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}
