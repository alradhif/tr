const express = require('express')
const router = express.Router()
const auth = require('../middleware/auth')
const roles = require('../middleware/roles')
const { getPayments, createPayment, recordPayment, uploadReceipt, deletePayment } = require('../controllers/orgPaymentsController')

const isUpperMgmt = [auth, roles('ORG_UPPER_MGMT', 'SUPER_ADMIN')]
const isOrgAny = [auth, roles('ORG_UPPER_MGMT', 'ORG_DATA_ENTRY', 'SUPER_ADMIN')]

router.get('/', ...isOrgAny, getPayments)
router.post('/', ...isOrgAny, createPayment)
router.post('/:id/record', ...isUpperMgmt, recordPayment)
router.post('/:id/receipt', ...isUpperMgmt, uploadReceipt)
router.delete('/:id', ...isUpperMgmt, deletePayment)

module.exports = router
