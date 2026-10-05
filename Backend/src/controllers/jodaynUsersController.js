const bcrypt = require('bcryptjs')
const prisma = require('../lib/prisma')
const { resolveInvitePassword, resolveInviteRole } = require('../lib/passwords')

exports.createJodaynPortalUser = async (req, res) => {
  try {
    const { name, email } = req.body
    const role = resolveInviteRole(req.body, 'JODAYN')
    if (!name || !email || !role) {
      return res.status(400).json({ message: 'الاسم والبريد الإلكتروني والدور مطلوبة' })
    }

    const existing = await prisma.jodaynUser.findUnique({ where: { email } })
    if (existing) return res.status(400).json({ message: 'البريد الإلكتروني مستخدم مسبقاً' })

    const { password, generated } = resolveInvitePassword(req.body.password)
    const hashed = await bcrypt.hash(password, 10)
    const user = await prisma.jodaynUser.create({
      data: { name, email, password: hashed, role, isActive: true },
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

exports.getJodaynUsers = async (_req, res) => {
  try {
    const users = await prisma.jodaynUser.findMany({
      select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true },
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
