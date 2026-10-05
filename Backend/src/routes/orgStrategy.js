const express = require('express')
const router = express.Router()
const auth = require('../middleware/auth')
const roles = require('../middleware/roles')
const {
  getDocuments,
  createDocument,
  getDocumentById,
  updateDocument,
  deleteDocument,
  getGoals,
  getDocumentGoals,
  createGoal,
  createDocumentGoal,
  getGoalById,
  updateGoal,
  deleteGoal,
  getStages,
  createStage,
  updateStage,
  deleteStage,
  getGoalLinks,
  createGoalLink,
  updateGoalLink,
  deleteGoalLink,
  getKpiSnapshots,
  createKpiSnapshot,
  updateKpiSnapshot,
  deleteKpiSnapshot
} = require('../controllers/orgStrategyController')

const isUpperMgmt = [auth, roles('ORG_UPPER_MGMT', 'SUPER_ADMIN')]
const isOrgAny = [auth, roles('ORG_UPPER_MGMT', 'ORG_DATA_ENTRY', 'SUPER_ADMIN')]

// ============ DOCUMENTS ============
router.get('/documents', ...isOrgAny, getDocuments)
router.post('/documents', ...isOrgAny, createDocument)
router.get('/documents/:id', ...isOrgAny, getDocumentById)
router.patch('/documents/:id', ...isOrgAny, updateDocument)
router.delete('/documents/:id', ...isUpperMgmt, deleteDocument)

// Goals nested under document
router.get('/documents/:documentId/goals', ...isOrgAny, getDocumentGoals)
router.post('/documents/:documentId/goals', ...isOrgAny, createDocumentGoal)

// ============ GOALS (org-scoped) ============
router.get('/goals', ...isOrgAny, getGoals)
router.post('/goals', ...isOrgAny, createGoal)

// Nested goal resources BEFORE /goals/:id
router.get('/goals/:goalId/stages', ...isOrgAny, getStages)
router.post('/goals/:goalId/stages', ...isOrgAny, createStage)
router.patch('/goals/:goalId/stages/:id', ...isOrgAny, updateStage)
router.delete('/goals/:goalId/stages/:id', ...isUpperMgmt, deleteStage)

router.get('/goals/:goalId/links', ...isOrgAny, getGoalLinks)
router.post('/goals/:goalId/links', ...isOrgAny, createGoalLink)
router.patch('/goals/:goalId/links/:id', ...isOrgAny, updateGoalLink)
router.delete('/goals/:goalId/links/:id', ...isUpperMgmt, deleteGoalLink)

router.get('/goals/:goalId/kpi-snapshots', ...isOrgAny, getKpiSnapshots)
router.post('/goals/:goalId/kpi-snapshots', ...isOrgAny, createKpiSnapshot)
router.patch('/goals/:goalId/kpi-snapshots/:id', ...isOrgAny, updateKpiSnapshot)
router.delete('/goals/:goalId/kpi-snapshots/:id', ...isUpperMgmt, deleteKpiSnapshot)

router.get('/goals/:id', ...isOrgAny, getGoalById)
router.patch('/goals/:id', ...isOrgAny, updateGoal)
router.delete('/goals/:id', ...isUpperMgmt, deleteGoal)

module.exports = router
