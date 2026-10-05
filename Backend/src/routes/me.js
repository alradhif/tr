const express = require('express')
const router = express.Router()
const auth = require('../middleware/auth')
const me = require('../controllers/meController')
const ai = require('../controllers/aiController')

router.get('/me', auth, me.getMe)
router.patch('/me', auth, me.updateMe)
router.post('/me/password', auth, me.changePassword)
router.get('/me/dashboard-layout/:portal', auth, me.getDashboardLayout)
router.put('/me/dashboard-layout/:portal', auth, me.saveDashboardLayout)
router.delete('/me/dashboard-layout/:portal', auth, me.resetDashboardLayout)
router.get('/search', auth, me.search)

router.get('/ai/status', auth, ai.status)
router.post('/ai/assistant', auth, ai.receiveFile, ai.assistant)
router.post('/ai/extract', auth, ai.receiveFile, ai.extract)

module.exports = router
