const express = require('express')
const router = express.Router()
const auth = require('../middleware/auth')
const roles = require('../middleware/roles')
const {
  getDepartments,
  createDepartment,
  getDepartmentById,
  updateDepartment,
  deleteDepartment,
  getEmployees,
  createEmployee,
  updateEmployee,
  deleteEmployee
} = require('../controllers/orgDepartmentsController')

const isUpperMgmt = [auth, roles('ORG_UPPER_MGMT', 'SUPER_ADMIN')]
const isOrgAny = [auth, roles('ORG_UPPER_MGMT', 'ORG_DATA_ENTRY', 'SUPER_ADMIN')]

router.get('/', ...isOrgAny, getDepartments)
router.post('/', ...isOrgAny, createDepartment)

router.get('/:id/employees', ...isOrgAny, getEmployees)
router.post('/:id/employees', ...isOrgAny, createEmployee)
router.patch('/:id/employees/:empId', ...isOrgAny, updateEmployee)
router.delete('/:id/employees/:empId', ...isUpperMgmt, deleteEmployee)

router.get('/:id', ...isOrgAny, getDepartmentById)
router.patch('/:id', ...isOrgAny, updateDepartment)
router.delete('/:id', ...isUpperMgmt, deleteDepartment)

module.exports = router
