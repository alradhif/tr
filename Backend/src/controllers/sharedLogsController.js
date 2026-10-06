const prisma = require('../lib/prisma')

// ============ NOTIFICATIONS ============

exports.getNotifications = async (req, res) => {
  try {
    const where = { userId: req.user.userId }
    if (req.user.type) where.actorType = req.user.type
    if (req.query.isRead !== undefined) {
      where.isRead = req.query.isRead === 'true'
    }
    if (req.query.type) where.type = req.query.type

    const [notifications, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: Math.min(Number(req.query.limit) || 100, 200)
      }),
      prisma.notification.count({
        where: { userId: req.user.userId, actorType: req.user.type, isRead: false }
      })
    ])

    res.json({ count: notifications.length, unreadCount, notifications })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

exports.markNotificationRead = async (req, res) => {
  try {
    const notification = await prisma.notification.findUnique({
      where: { id: req.params.id }
    })

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' })
    }

    if (notification.userId !== req.user.userId) {
      return res.status(403).json({ message: 'Access denied' })
    }

    const updated = await prisma.notification.update({
      where: { id: req.params.id },
      data: { isRead: true }
    })

    res.json({ success: true, notification: updated })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

exports.markAllNotificationsRead = async (req, res) => {
  try {
    const result = await prisma.notification.updateMany({
      where: { userId: req.user.userId, actorType: req.user.type, isRead: false },
      data: { isRead: true }
    })
    res.json({ success: true, updated: result.count })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// ============ AUDIT LOGS (SUPER_ADMIN) ============

exports.getAuditLogs = async (req, res) => {
  try {
    if (req.user.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ message: 'Access denied' })
    }

    const { tableName, recordId, action, performedBy, actorType } = req.query
    const where = {}
    if (tableName) where.tableName = tableName
    if (recordId) where.recordId = recordId
    if (action) where.action = action
    if (performedBy) where.performedBy = performedBy
    if (actorType) where.actorType = actorType

    const rows = await prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: Math.min(Number(req.query.limit) || 500, 1000)
    })
    const { performerNames } = require('./superAdminPlatformController')
    const names = await performerNames(rows.map((row) => row.performedBy))
    const logs = rows.map((row) => ({ ...row, performerName: names.get(row.performedBy) || null }))

    res.json({ count: logs.length, logs })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// ============ ACTIVITY LOGS (SUPER_ADMIN) ============

exports.getActivityLogs = async (req, res) => {
  try {
    if (req.user.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ message: 'Access denied' })
    }

    const { userId, actorType, superAdminId } = req.query
    const where = {}
    if (userId) where.userId = userId
    if (actorType) where.actorType = actorType
    if (superAdminId) where.superAdminId = superAdminId

    const logs = await prisma.activityLog.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    })

    res.json({ count: logs.length, logs })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}
