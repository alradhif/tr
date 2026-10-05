const bcrypt = require('bcryptjs')
const prisma = require('../lib/prisma')
const { resolveInvitePassword, resolveInviteRole } = require('../lib/passwords')

// إنشاء client user
exports.createClientUser = async (req, res) => {
  try {
    const { name, email } = req.body
    const role = resolveInviteRole(req.body, 'CLIENT')
    const clientId = req.user.clientId

    if (!name || !email || !role) {
      return res.status(400).json({ message: 'الاسم والبريد الإلكتروني والدور مطلوبة' })
    }

    const existing = await prisma.clientUser.findUnique({ where: { email } })
    if (existing) return res.status(400).json({ message: 'البريد الإلكتروني مستخدم مسبقاً' })

    const { password, generated } = resolveInvitePassword(req.body.password)
    const hashed = await bcrypt.hash(password, 10)
    const user = await prisma.clientUser.create({
      data: { name, email, password: hashed, role, clientId, isActive: true }
    })

    res.json({
      success: true,
      user: { id: user.id, name: user.name, email: user.email, role: user.role, isActive: user.isActive, createdAt: user.createdAt },
      temporaryPassword: generated ? password : undefined,
    })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// جلب كل يوزرات العميل
exports.getClientUsers = async (req, res) => {
  try {
    const clientId = req.user.clientId
    const users = await prisma.clientUser.findMany({
      where: { clientId },
      select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true }
    })
    res.json({ users })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// تفعيل / تعطيل يوزر
exports.toggleClientUser = async (req, res) => {
  try {
    const { id } = req.params
    const clientId = req.user.clientId

    const current = await prisma.clientUser.findUnique({ where: { id } })
    if (!current) return res.status(404).json({ message: 'User not found' })
    if (current.clientId !== clientId) {
      return res.status(403).json({ message: 'Access denied' })
    }
    if (current.id === req.user.userId) return res.status(400).json({ message: 'لا يمكنك تعطيل حسابك الحالي' })

    const updated = await prisma.clientUser.update({
      where: { id },
      data: { isActive: !current.isActive }
    })

    res.json({ success: true, isActive: updated.isActive })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

exports.getDashboard = async (req, res) => {
  try {
    const clientId = req.user.clientId
    if (!clientId) return res.status(403).json({ message: 'Client scope required' })
    const { buildProjectPortalDashboard } = require('../lib/dashboardStats')
    const data = await buildProjectPortalDashboard('CLIENT', clientId, { role: req.user.role })
    res.json(data)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}
