const express = require('express')
const router = express.Router()
const auth = require('../middleware/auth')
const roles = require('../middleware/roles')
const {
  createClientUser,
  getClientUsers,
  toggleClientUser,
  reissueClientInvite,
  getDashboard
} = require('../controllers/clientController')

const isClientUpperMgmt = [auth, roles('CLIENT_UPPER_MGMT', 'SUPER_ADMIN')]
const isClientAny = [auth, roles('CLIENT_UPPER_MGMT', 'CLIENT_DATA_ENTRY', 'SUPER_ADMIN')]

// Users
router.post('/users', ...isClientUpperMgmt, createClientUser)
router.get('/users', ...isClientUpperMgmt, getClientUsers)
router.patch('/users/:id/toggle', ...isClientUpperMgmt, toggleClientUser)
router.post('/users/:id/invite', ...isClientUpperMgmt, reissueClientInvite)

// Dashboard
router.get('/dashboard', ...isClientAny, getDashboard)

module.exports = router
