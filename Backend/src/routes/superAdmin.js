const express = require('express')
const router = express.Router()
const {
  createPackage,
  getPackages,
  createOrgAccount,
  createClientAccount,
  createJodaynUser,
  getAllAccounts,
  toggleAccount,
  createSector,
  getSectors,
  createOrgUserBySuperAdmin
} = require('../controllers/superAdminController')
const auth = require('../middleware/auth')
const roles = require('../middleware/roles')

const isSuperAdmin = [auth, roles('SUPER_ADMIN')]
// Sectors are managed from the Jodayn portal UI as well as Super Admin
const isPlatformStaff = [
  auth,
  roles('SUPER_ADMIN', 'JODAYN_UPPER_MGMT', 'JODAYN_DATA_ENTRY')
]

router.post('/packages', ...isSuperAdmin, createPackage)
router.get('/packages', ...isSuperAdmin, getPackages)
router.post('/org', ...isSuperAdmin, createOrgAccount)
router.post('/client', ...isSuperAdmin, createClientAccount)
router.post('/jodayn-user', ...isSuperAdmin, createJodaynUser)
router.get('/accounts', ...isPlatformStaff, getAllAccounts)
router.patch('/accounts/:type/:id/toggle', ...isSuperAdmin, toggleAccount)
router.post('/sectors', ...isPlatformStaff, createSector)
router.get('/sectors', ...isPlatformStaff, getSectors)
router.post('/org-user', ...isSuperAdmin, createOrgUserBySuperAdmin)

module.exports = router