const express = require('express')
const { limitFailedAttempts } = require('../lib/rateLimit')
const router = express.Router()
const {
  loginJodayn,
  loginOrg,
  loginClient,
  loginSuperAdmin,
  forgotPassword,
  resetPassword,
  getDemoStatus,
  getDemoAccounts,
  loginDemo,
  loginAny,
  verifyLoginCode,
  resendLoginCode,
  getInvite,
  activateAccount,
} = require('../controllers/authController')

router.post('/login', limitFailedAttempts, loginAny)
router.post('/login/verify', limitFailedAttempts, verifyLoginCode)
router.post('/login/resend', limitFailedAttempts, resendLoginCode)
router.get('/invite/:token', getInvite)
router.post('/activate', limitFailedAttempts, activateAccount)
router.post('/jodayn/login', limitFailedAttempts, loginJodayn)
router.post('/org/login', limitFailedAttempts, loginOrg)
router.post('/client/login', limitFailedAttempts, loginClient)
router.post('/super-admin/login', limitFailedAttempts, loginSuperAdmin)
router.post('/forgot-password', limitFailedAttempts, forgotPassword)
router.post('/reset-password', limitFailedAttempts, resetPassword)
router.get('/demo/status', getDemoStatus)
router.get('/demo/accounts', getDemoAccounts)
router.post('/demo/login', loginDemo)

module.exports = router
