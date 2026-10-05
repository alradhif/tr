const express = require('express')
const router = express.Router()
const auth = require('../middleware/auth')
const roles = require('../middleware/roles')
const ctrl = require('../controllers/clientStrategyController')

const isClientAny = [auth, roles('CLIENT_UPPER_MGMT', 'CLIENT_DATA_ENTRY', 'SUPER_ADMIN')]
const isClientUpperMgmt = [auth, roles('CLIENT_UPPER_MGMT', 'SUPER_ADMIN')]

// Strategy documents
router.post('/documents', ...isClientAny, ctrl.createDocument)
router.get('/documents', ...isClientAny, ctrl.getDocuments)
router.get('/documents/:id', ...isClientAny, ctrl.getDocumentById)
router.put('/documents/:id', ...isClientAny, ctrl.updateDocument)
router.delete('/documents/:id', ...isClientUpperMgmt, ctrl.deleteDocument)

// Strategic goals
router.post('/goals', ...isClientAny, ctrl.createGoal)
router.get('/goals', ...isClientAny, ctrl.getGoals)
router.get('/goals/:id', ...isClientAny, ctrl.getGoalById)
router.put('/goals/:id', ...isClientAny, ctrl.updateGoal)
router.delete('/goals/:id', ...isClientUpperMgmt, ctrl.deleteGoal)

// Goal stages
router.post('/goals/:goalId/stages', ...isClientAny, ctrl.createStage)
router.get('/goals/:goalId/stages', ...isClientAny, ctrl.getStages)
router.put('/goals/:goalId/stages/:id', ...isClientAny, ctrl.updateStage)
router.delete('/goals/:goalId/stages/:id', ...isClientUpperMgmt, ctrl.deleteStage)

// Goal ↔ project links
router.post('/goals/:goalId/links', ...isClientAny, ctrl.createGoalProjectLink)
router.get('/goals/:goalId/links', ...isClientAny, ctrl.getGoalProjectLinks)
router.put('/goals/:goalId/links/:id', ...isClientAny, ctrl.updateGoalProjectLink)
router.delete('/goals/:goalId/links/:id', ...isClientUpperMgmt, ctrl.deleteGoalProjectLink)

// KPI snapshots
router.post('/goals/:goalId/kpis', ...isClientAny, ctrl.createKpiSnapshot)
router.get('/goals/:goalId/kpis', ...isClientAny, ctrl.getKpiSnapshots)
router.put('/goals/:goalId/kpis/:id', ...isClientAny, ctrl.updateKpiSnapshot)
router.delete('/goals/:goalId/kpis/:id', ...isClientUpperMgmt, ctrl.deleteKpiSnapshot)

module.exports = router
