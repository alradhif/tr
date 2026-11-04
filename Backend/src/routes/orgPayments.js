const express = require('express')
const router = express.Router()
const auth = require('../middleware/auth')
const roles = require('../middleware/roles')
const { getPayments, createPayment, setPaymentPaid, deletePayment } = require('../controllers/orgPaymentsController')

const isUpperMgmt = [auth, roles('ORG_UPPER_MGMT', 'SUPER_ADMIN')]
const isOrgAny = [auth, roles('ORG_UPPER_MGMT', 'ORG_DATA_ENTRY', 'SUPER_ADMIN')]

router.get('/', ...isOrgAny, getPayments)
router.post('/', ...isOrgAny, createPayment)
router.patch('/:id/paid', ...isUpperMgmt, setPaymentPaid)
router.delete('/:id', ...isUpperMgmt, deletePayment)

module.exports = router
