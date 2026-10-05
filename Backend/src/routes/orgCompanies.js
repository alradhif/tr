const express = require('express')
const router = express.Router()
const auth = require('../middleware/auth')
const roles = require('../middleware/roles')
const {
  getCompanies,
  createCompany,
  getCompanyById,
  updateCompany,
  deleteCompany,
  getTeam,
  createTeamMember,
  updateTeamMember,
  deleteTeamMember
} = require('../controllers/orgCompaniesController')

const isUpperMgmt = [auth, roles('ORG_UPPER_MGMT', 'SUPER_ADMIN')]
const isOrgAny = [auth, roles('ORG_UPPER_MGMT', 'ORG_DATA_ENTRY', 'SUPER_ADMIN')]

router.get('/', ...isOrgAny, getCompanies)
router.post('/', ...isOrgAny, createCompany)

router.get('/:id/team', ...isOrgAny, getTeam)
router.post('/:id/team', ...isOrgAny, createTeamMember)
router.patch('/:id/team/:memberId', ...isOrgAny, updateTeamMember)
router.delete('/:id/team/:memberId', ...isUpperMgmt, deleteTeamMember)

router.get('/:id', ...isOrgAny, getCompanyById)
router.patch('/:id', ...isOrgAny, updateCompany)
router.delete('/:id', ...isUpperMgmt, deleteCompany)

module.exports = router
