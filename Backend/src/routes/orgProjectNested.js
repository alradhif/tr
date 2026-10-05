const express = require('express')
const router = express.Router({ mergeParams: true })
const auth = require('../middleware/auth')
const roles = require('../middleware/roles')
const ctrl = require('../controllers/orgProjectNestedController')

const isUpperMgmt = [auth, roles('ORG_UPPER_MGMT', 'SUPER_ADMIN')]
const isOrgAny = [auth, roles('ORG_UPPER_MGMT', 'ORG_DATA_ENTRY', 'SUPER_ADMIN')]

// ============ PHASES ============
router.get('/:projectId/phases', ...isOrgAny, ctrl.getPhases)
router.post('/:projectId/phases', ...isOrgAny, ctrl.createPhase)
router.patch('/:projectId/phases/:id', ...isOrgAny, ctrl.updatePhase)
router.delete('/:projectId/phases/:id', ...isUpperMgmt, ctrl.deletePhase)

// ============ TEAM ============
router.get('/:projectId/team', ...isOrgAny, ctrl.getTeamMembers)
router.post('/:projectId/team', ...isOrgAny, ctrl.createTeamMember)
router.patch('/:projectId/team/:id', ...isOrgAny, ctrl.updateTeamMember)
router.delete('/:projectId/team/:id', ...isUpperMgmt, ctrl.deleteTeamMember)

// ============ CONTRACTS ============
router.get('/:projectId/contracts', ...isOrgAny, ctrl.getContracts)
router.post('/:projectId/contracts', ...isOrgAny, ctrl.createContract)
router.patch('/:projectId/contracts/:id', ...isOrgAny, ctrl.updateContract)
router.delete('/:projectId/contracts/:id', ...isUpperMgmt, ctrl.deleteContract)

// ============ RISKS ============
router.get('/:projectId/risks', ...isOrgAny, ctrl.getRisks)
router.post('/:projectId/risks', ...isOrgAny, ctrl.createRisk)
router.patch('/:projectId/risks/:id', ...isOrgAny, ctrl.updateRisk)
router.delete('/:projectId/risks/:id', ...isUpperMgmt, ctrl.deleteRisk)

router.get('/:projectId/risks/:riskId/actions', ...isOrgAny, ctrl.getRiskActions)
router.post('/:projectId/risks/:riskId/actions', ...isOrgAny, ctrl.createRiskAction)
router.patch('/:projectId/risks/:riskId/actions/:id', ...isOrgAny, ctrl.updateRiskAction)
router.delete('/:projectId/risks/:riskId/actions/:id', ...isUpperMgmt, ctrl.deleteRiskAction)

// ============ DELIVERABLES ============
router.get('/:projectId/deliverables', ...isOrgAny, ctrl.getDeliverables)
router.post('/:projectId/deliverables', ...isOrgAny, ctrl.createDeliverable)
router.patch('/:projectId/deliverables/:id', ...isOrgAny, ctrl.updateDeliverable)
router.delete('/:projectId/deliverables/:id', ...isUpperMgmt, ctrl.deleteDeliverable)

router.get(
  '/:projectId/deliverables/:deliverableId/attachments',
  ...isOrgAny,
  ctrl.getDeliverableAttachments
)
router.post(
  '/:projectId/deliverables/:deliverableId/attachments',
  ...isOrgAny,
  ctrl.createDeliverableAttachment
)
router.delete(
  '/:projectId/deliverables/:deliverableId/attachments/:id',
  ...isUpperMgmt,
  ctrl.deleteDeliverableAttachment
)

router.get(
  '/:projectId/deliverables/:deliverableId/comments',
  ...isOrgAny,
  ctrl.getDeliverableComments
)
router.post(
  '/:projectId/deliverables/:deliverableId/comments',
  ...isOrgAny,
  ctrl.createDeliverableComment
)
router.delete(
  '/:projectId/deliverables/:deliverableId/comments/:id',
  ...isUpperMgmt,
  ctrl.deleteDeliverableComment
)

// ============ CHANGE REQUESTS ============
router.get('/:projectId/change-requests', ...isOrgAny, ctrl.getChangeRequests)
router.post('/:projectId/change-requests', ...isOrgAny, ctrl.createChangeRequest)
router.patch(
  '/:projectId/change-requests/:id/approve',
  ...isUpperMgmt,
  ctrl.approveChangeRequest
)
router.patch(
  '/:projectId/change-requests/:id/reject',
  ...isUpperMgmt,
  ctrl.rejectChangeRequest
)
router.patch('/:projectId/change-requests/:id', ...isOrgAny, ctrl.updateChangeRequest)
router.delete('/:projectId/change-requests/:id', ...isUpperMgmt, ctrl.deleteChangeRequest)

router.get(
  '/:projectId/change-requests/:requestId/attachments',
  ...isOrgAny,
  ctrl.getChangeRequestAttachments
)
router.post(
  '/:projectId/change-requests/:requestId/attachments',
  ...isOrgAny,
  ctrl.createChangeRequestAttachment
)
router.delete(
  '/:projectId/change-requests/:requestId/attachments/:id',
  ...isUpperMgmt,
  ctrl.deleteChangeRequestAttachment
)

router.get(
  '/:projectId/change-requests/:requestId/logs',
  ...isOrgAny,
  ctrl.getRequestLogs
)

// ============ SCENARIOS ============
router.get('/:projectId/scenarios', ...isOrgAny, ctrl.getScenarios)
router.post('/:projectId/scenarios', ...isOrgAny, ctrl.createScenario)
router.patch('/:projectId/scenarios/:id', ...isOrgAny, ctrl.updateScenario)
router.delete('/:projectId/scenarios/:id', ...isUpperMgmt, ctrl.deleteScenario)

module.exports = router
