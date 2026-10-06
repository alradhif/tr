const express = require('express')
const router = express.Router()
const auth = require('../middleware/auth')
const roles = require('../middleware/roles')
const {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  getAuditLogs,
  getActivityLogs
} = require('../controllers/sharedLogsController')

const isAuthenticated = [auth]
const isSuperAdmin = [auth, roles('SUPER_ADMIN')]

// Notifications — any authenticated user (scoped to self)
router.get('/notifications', ...isAuthenticated, getNotifications)
router.patch('/notifications/read-all', ...isAuthenticated, markAllNotificationsRead)
router.patch('/notifications/:id/read', ...isAuthenticated, markNotificationRead)

// Audit + Activity — SUPER_ADMIN only
router.get('/audit-logs', ...isSuperAdmin, getAuditLogs)
router.get('/activity-logs', ...isSuperAdmin, getActivityLogs)

module.exports = router
