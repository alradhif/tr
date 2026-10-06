const express = require('express')
const router = express.Router()
const auth = require('../middleware/auth')
const roles = require('../middleware/roles')
const {
  createProject,
  getProjects,
  getPendingProjects,
  getProjectById,
  updateProject,
  submitProject,
  approveProject,
  rejectProject,
  deleteProject
} = require('../controllers/clientProjectsController')
const nestedRoutes = require('./clientProjectNested')

const isUpperMgmt = [auth, roles('CLIENT_UPPER_MGMT', 'SUPER_ADMIN')]
const isClientAny = [auth, roles('CLIENT_UPPER_MGMT', 'CLIENT_DATA_ENTRY', 'SUPER_ADMIN')]

// Projects CRUD
router.post('/', ...isClientAny, createProject)
router.get('/', ...isClientAny, getProjects)
router.get('/pending', ...isUpperMgmt, getPendingProjects)
router.post('/:id/submit', ...isClientAny, submitProject)

// Nested resources MUST be mounted before /:id
router.use(nestedRoutes)

router.get('/:id', ...isClientAny, getProjectById)
router.put('/:id', ...isClientAny, updateProject)
router.patch('/:id/approve', ...isUpperMgmt, approveProject)
router.patch('/:id/reject', ...isUpperMgmt, rejectProject)
router.patch('/:id/return', ...isUpperMgmt, require('../controllers/clientProjectsController').returnProject)
router.delete('/:id', ...isUpperMgmt, deleteProject)

module.exports = router
