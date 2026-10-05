const express = require('express')
const router = express.Router()
const auth = require('../middleware/auth')
const roles = require('../middleware/roles')
const {
  createInvoice,
  getInvoices,
  getInvoiceById,
  updateInvoice,
  deleteInvoice,
  createForecast,
  getForecasts,
  getForecastById,
  updateForecast,
  deleteForecast,
  createReport,
  getReports,
  getReportById,
  updateReport,
  deleteReport
} = require('../controllers/jodaynFinanceController')
const {
  createJodaynPortalUser,
  getJodaynUsers,
  toggleJodaynUser,
} = require('../controllers/jodaynUsersController')
const { getDashboard } = require('../controllers/jodaynDashboardController')

const isJodaynUpper = [auth, roles('JODAYN_UPPER_MGMT', 'SUPER_ADMIN')]
const isJodayn = [
  auth,
  roles('JODAYN_UPPER_MGMT', 'JODAYN_DATA_ENTRY', 'SUPER_ADMIN')
]

router.get('/dashboard', ...isJodayn, getDashboard)
router.post('/users', ...isJodaynUpper, createJodaynPortalUser)
router.get('/users', ...isJodaynUpper, getJodaynUsers)
router.patch('/users/:id/toggle', ...isJodaynUpper, toggleJodaynUser)

// ============ INVOICES ============
router.post('/invoices', ...isJodayn, createInvoice)
router.get('/invoices', ...isJodayn, getInvoices)
router.get('/invoices/:id', ...isJodayn, getInvoiceById)
router.put('/invoices/:id', ...isJodayn, updateInvoice)
router.delete('/invoices/:id', ...isJodayn, deleteInvoice)

// ============ FORECASTS ============
router.post('/forecasts', ...isJodayn, createForecast)
router.get('/forecasts', ...isJodayn, getForecasts)
router.get('/forecasts/:id', ...isJodayn, getForecastById)
router.put('/forecasts/:id', ...isJodayn, updateForecast)
router.delete('/forecasts/:id', ...isJodayn, deleteForecast)

// ============ REPORTS ============
router.post('/reports', ...isJodayn, createReport)
router.get('/reports', ...isJodayn, getReports)
router.get('/reports/:id', ...isJodayn, getReportById)
router.put('/reports/:id', ...isJodayn, updateReport)
router.delete('/reports/:id', ...isJodayn, deleteReport)

module.exports = router
