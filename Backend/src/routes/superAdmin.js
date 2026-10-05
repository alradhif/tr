const express = require('express')
const router = express.Router()
const {
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
const platform = require('../controllers/superAdminPlatformController')
const auth = require('../middleware/auth')
const roles = require('../middleware/roles')

const isSuperAdmin = [auth, roles('SUPER_ADMIN')]
// Sectors are managed from the Jodayn portal UI as well as Super Admin
const isPlatformStaff = [
  auth,
  roles('SUPER_ADMIN', 'JODAYN_UPPER_MGMT', 'JODAYN_DATA_ENTRY')
]

router.get('/dashboard', ...isSuperAdmin, platform.getDashboard)
router.get('/demo-requests', ...isSuperAdmin, require('../controllers/demoRequestController').list)
router.post('/tenants', ...isSuperAdmin, platform.createTenant)
router.get('/accounts/:type/:id', ...isSuperAdmin, platform.getAccountDetails)
router.patch('/accounts/:type/:id', ...isSuperAdmin, platform.updateAccount)
router.delete('/accounts/:type/:id', ...isSuperAdmin, platform.deleteAccount)
router.post('/accounts/:type/:id/notify', ...isSuperAdmin, platform.notifyAccount)
router.get('/accounts/:type/:id/export', ...isSuperAdmin, platform.exportAccount)
router.get('/users', ...isSuperAdmin, platform.getPlatformUsers)
router.post('/users', ...isSuperAdmin, platform.createPlatformUser)
router.patch('/users/:portal/:id', ...isSuperAdmin, platform.updatePlatformUser)
router.post('/users/:portal/:id/credentials', ...isSuperAdmin, platform.resetPlatformUserCredentials)
router.get('/packages/all', ...isSuperAdmin, platform.listAllPackages)
router.post('/packages', ...isSuperAdmin, platform.createPackage)
router.patch('/packages/:id', ...isSuperAdmin, platform.updatePackage)
router.delete('/packages/:id', ...isSuperAdmin, platform.deletePackage)
router.get('/audit/summary', ...isSuperAdmin, platform.getAuditSummary)
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