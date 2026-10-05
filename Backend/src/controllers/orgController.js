const prisma = require('../lib/prisma')
const { resolveInviteRole } = require('../lib/passwords')
const { createAccountInvite, unusablePasswordHash } = require('../lib/accountAccess')

// إنشاء org user
exports.createOrgUser = async (req, res) => {
  try {
    const { name } = req.body
    const email = String(req.body.email || '').trim().toLowerCase()
    const role = resolveInviteRole(req.body, 'ORG')
    const orgId = req.user.orgId

    if (!name || !email || !role) {
      return res.status(400).json({ message: 'الاسم والبريد الإلكتروني والدور مطلوبة' })
    }

    const existing = await prisma.orgUser.findUnique({ where: { email } })
    if (existing) return res.status(400).json({ message: 'البريد الإلكتروني مستخدم مسبقاً' })

    const hashed = await unusablePasswordHash()
    const user = await prisma.orgUser.create({
      data: { name, email, password: hashed, role, orgId, isActive: true, pendingActivation: true }
    })

    const invite = await createAccountInvite({ userId: user.id, actorType: 'ORG', invitedBy: req.user.userId })

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

// جلب كل يوزرات الجهة
exports.getOrgUsers = async (req, res) => {
  try {
    const orgId = req.user.orgId
    const users = await prisma.orgUser.findMany({
      where: { orgId },
      select: { id: true, name: true, email: true, role: true, isActive: true, pendingActivation: true, createdAt: true }
    })
    res.json({ users })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// تفعيل / تعطيل يوزر
exports.toggleOrgUser = async (req, res) => {
  try {
    const { id } = req.params
    const current = await prisma.orgUser.findUnique({ where: { id } })
    if (!current) return res.status(404).json({ message: 'User not found' })
    if (current.orgId !== req.user.orgId) return res.status(403).json({ message: 'Access denied' })
    if (current.id === req.user.userId) return res.status(400).json({ message: 'لا يمكنك تعطيل حسابك الحالي' })

    const updated = await prisma.orgUser.update({
      where: { id },
      data: { isActive: !current.isActive }
    })

    res.json({ success: true, isActive: updated.isActive })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// Dashboard
exports.getDashboard = async (req, res) => {
  try {
    const orgId = req.user.orgId
    if (!orgId) return res.status(403).json({ message: 'Org scope required' })
    const { buildProjectPortalDashboard } = require('../lib/dashboardStats')
    const data = await buildProjectPortalDashboard('ORG', orgId, { role: req.user.role })
    res.json(data)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// إعادة إصدار رابط الدعوة لمستخدم لم يفعّل حسابه بعد
exports.reissueOrgInvite = async (req, res) => {
  try {
    const current = await prisma.orgUser.findUnique({ where: { id: req.params.id } })
    if (!current) return res.status(404).json({ message: 'User not found' })
    if (current.orgId !== req.user.orgId) return res.status(403).json({ message: 'Access denied' })
    if (!current.pendingActivation) return res.status(400).json({ message: 'تم تفعيل هذا الحساب مسبقاً' })

    const invite = await createAccountInvite({ userId: current.id, actorType: 'ORG', invitedBy: req.user.userId })
    res.json({ success: true, inviteUrl: invite.inviteUrl, inviteExpiresAt: invite.inviteExpiresAt })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}
