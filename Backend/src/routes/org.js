const express = require('express')
const router = express.Router()
const auth = require('../middleware/auth')
const roles = require('../middleware/roles')
const {
  createOrgUser,
  getOrgUsers,
  toggleOrgUser,
  reissueOrgInvite,
  getDashboard
} = require('../controllers/orgController')

const isOrgUpperMgmt = [auth, roles('ORG_UPPER_MGMT', 'SUPER_ADMIN')]
const isOrgAny = [auth, roles('ORG_UPPER_MGMT', 'ORG_DATA_ENTRY', 'SUPER_ADMIN')]

// Users
router.post('/users', ...isOrgUpperMgmt, createOrgUser)
router.get('/users', ...isOrgUpperMgmt, getOrgUsers)
router.patch('/users/:id/toggle', ...isOrgUpperMgmt, toggleOrgUser)
router.post('/users/:id/invite', ...isOrgUpperMgmt, reissueOrgInvite)

// Dashboard
router.get('/dashboard', ...isOrgAny, getDashboard)

module.exports = router