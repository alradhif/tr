const express = require('express')
const router = express.Router()
const {
  loginJodayn,
  loginOrg,
  loginClient,
  loginSuperAdmin,
  forgotPassword,
  resetPassword,
  getDemoAccounts,
  loginDemo,
  loginAny,
} = require('../controllers/authController')

router.post('/login', loginAny)
router.post('/jodayn/login', loginJodayn)
router.post('/org/login', loginOrg)
router.post('/client/login', loginClient)
router.post('/super-admin/login', loginSuperAdmin)
router.post('/forgot-password', forgotPassword)
router.post('/reset-password', resetPassword)
router.get('/demo/accounts', getDemoAccounts)
router.post('/demo/login', loginDemo)

module.exports = router
