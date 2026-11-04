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
  reissueJodaynInvite,
  resetJodaynUserCredentials,
} = require('../controllers/jodaynUsersController')
const { getDashboard } = require('../controllers/jodaynDashboardController')
const {
  getGoals,
  getProjects,
  getClient,
  getDepartments: getAllDepartments,
  scopeToDepartmentOrg,
  scopeToProjectOwner,
} = require('../controllers/jodaynPortfolioController')
const departments = require('../controllers/orgDepartmentsController')
const orgProjects = require('../controllers/orgProjectsController')
const orgNested = require('../controllers/orgProjectNestedController')
const clientProjects = require('../controllers/clientProjectsController')
const clientNested = require('../controllers/clientProjectNestedController')

const isJodaynUpper = [auth, roles('JODAYN_UPPER_MGMT', 'SUPER_ADMIN')]
const isJodayn = [
  auth,
  roles('JODAYN_UPPER_MGMT', 'JODAYN_DATA_ENTRY', 'SUPER_ADMIN')
]

router.get('/dashboard', ...isJodayn, getDashboard)
router.get('/goals', ...isJodayn, getGoals)
router.get('/projects', ...isJodayn, getProjects)
router.get('/clients/:id', ...isJodayn, getClient)

// Read-only project page: the portal handlers scoped to the project's owner.
for (const [kind, project, nested] of [
  ['org', orgProjects, orgNested],
  ['client', clientProjects, clientNested],
]) {
  const scoped = [...isJodayn, scopeToProjectOwner(kind)]
  router.get(`/projects/${kind}/:id`, ...scoped, project.getProjectById)
  router.get(`/projects/${kind}/:projectId/contracts`, ...scoped, nested.getContracts)
  router.get(`/projects/${kind}/:projectId/change-requests`, ...scoped, nested.getChangeRequests)
  router.get(`/projects/${kind}/:projectId/scenarios`, ...scoped, nested.getScenarios)
}

// Departments of every organization; per-department handlers reuse the organization ones.
router.get('/departments', ...isJodayn, getAllDepartments)
router.post('/departments', ...isJodayn, scopeToDepartmentOrg, departments.createDepartment)
router.get('/departments/:id', ...isJodayn, scopeToDepartmentOrg, departments.getDepartmentById)
router.patch('/departments/:id', ...isJodayn, scopeToDepartmentOrg, departments.updateDepartment)
router.delete('/departments/:id', ...isJodaynUpper, scopeToDepartmentOrg, departments.deleteDepartment)
router.post('/departments/:id/projects', ...isJodayn, scopeToDepartmentOrg, departments.linkProjects)
router.get('/departments/:id/employees', ...isJodayn, scopeToDepartmentOrg, departments.getEmployees)
router.post('/departments/:id/employees', ...isJodayn, scopeToDepartmentOrg, departments.createEmployee)
router.delete('/departments/:id/employees/:empId', ...isJodaynUpper, scopeToDepartmentOrg, departments.deleteEmployee)
router.post('/users', ...isJodaynUpper, createJodaynPortalUser)
router.get('/users', ...isJodaynUpper, getJodaynUsers)
router.patch('/users/:id/toggle', ...isJodaynUpper, toggleJodaynUser)
router.post('/users/:id/invite', ...isJodaynUpper, reissueJodaynInvite)
router.post('/users/:id/credentials', ...isJodaynUpper, resetJodaynUserCredentials)

// ============ INVOICES ============
router.post('/invoices', ...isJodayn, createInvoice)
router.get('/invoices', ...isJodayn, getInvoices)
router.get('/invoices/:id', ...isJodayn, getInvoiceById)
router.put('/invoices/:id', ...isJodayn, updateInvoice)
router.delete('/invoices/:id', ...isJodaynUpper, deleteInvoice)

// ============ FORECASTS ============
router.post('/forecasts', ...isJodayn, createForecast)
router.get('/forecasts', ...isJodayn, getForecasts)
router.get('/forecasts/:id', ...isJodayn, getForecastById)
router.put('/forecasts/:id', ...isJodayn, updateForecast)
router.delete('/forecasts/:id', ...isJodaynUpper, deleteForecast)

// ============ REPORTS ============
router.post('/reports', ...isJodayn, createReport)
router.get('/reports', ...isJodayn, getReports)
router.get('/reports/:id', ...isJodayn, getReportById)
router.put('/reports/:id', ...isJodayn, updateReport)
router.delete('/reports/:id', ...isJodaynUpper, deleteReport)

module.exports = router
