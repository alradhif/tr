const express = require('express')
const router = express.Router()
const auth = require('../middleware/auth')
const roles = require('../middleware/roles')
const {
  createClientUser,
  getClientUsers,
  toggleClientUser,
  reissueClientInvite,
  getAssignableClientUsers,
  resetClientUserCredentials,
  getDashboard
} = require('../controllers/clientController')

const isClientUpperMgmt = [auth, roles('CLIENT_UPPER_MGMT', 'SUPER_ADMIN')]
const isClientAny = [auth, roles('CLIENT_UPPER_MGMT', 'CLIENT_DATA_ENTRY', 'SUPER_ADMIN')]

// Users
router.post('/users', ...isClientUpperMgmt, createClientUser)
router.get('/users', ...isClientUpperMgmt, getClientUsers)
router.patch('/users/:id/toggle', ...isClientUpperMgmt, toggleClientUser)
router.post('/users/:id/invite', ...isClientUpperMgmt, reissueClientInvite)
router.post('/users/:id/credentials', ...isClientUpperMgmt, resetClientUserCredentials)
// Active members of the same account, e.g. to choose a project manager
router.get('/users/assignable', ...isClientAny, getAssignableClientUsers)

// Dashboard
router.get('/dashboard', ...isClientAny, getDashboard)

module.exports = router
