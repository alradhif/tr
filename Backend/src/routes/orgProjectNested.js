const express = require('express')
const router = express.Router({ mergeParams: true })
const auth = require('../middleware/auth')
const roles = require('../middleware/roles')
const ctrl = require('../controllers/orgProjectNestedController')
const attachments = require('../controllers/projectAttachmentsController')
const { nestedWriteGuard } = require('../lib/projectWorkflow')
const { changeRequestDecision } = require('../lib/changeRequests')

const isUpperMgmt = [auth, roles('ORG_UPPER_MGMT', 'SUPER_ADMIN')]
const isOrgAny = [auth, roles('ORG_UPPER_MGMT', 'ORG_DATA_ENTRY', 'SUPER_ADMIN')]
const isOrgAnyWrite = [...isOrgAny, nestedWriteGuard('ORG')]

// ============ PHASES ============
router.get('/:projectId/phases', ...isOrgAny, ctrl.getPhases)
router.post('/:projectId/phases', ...isOrgAnyWrite, ctrl.createPhase)
router.patch('/:projectId/phases/:id', ...isOrgAnyWrite, ctrl.updatePhase)
router.delete('/:projectId/phases/:id', ...isUpperMgmt, ctrl.deletePhase)

// ============ TEAM ============
router.get('/:projectId/team', ...isOrgAny, ctrl.getTeamMembers)
router.post('/:projectId/team', ...isOrgAnyWrite, ctrl.createTeamMember)
router.patch('/:projectId/team/:id', ...isOrgAnyWrite, ctrl.updateTeamMember)
router.delete('/:projectId/team/:id', ...isUpperMgmt, ctrl.deleteTeamMember)

// ============ CONTRACTS ============
router.get('/:projectId/contracts', ...isOrgAny, ctrl.getContracts)
router.post('/:projectId/contracts', ...isOrgAnyWrite, ctrl.createContract)
router.patch('/:projectId/contracts/:id', ...isOrgAnyWrite, ctrl.updateContract)
router.delete('/:projectId/contracts/:id', ...isUpperMgmt, ctrl.deleteContract)

// ============ RISKS ============
router.get('/:projectId/risks', ...isOrgAny, ctrl.getRisks)
router.post('/:projectId/risks', ...isOrgAnyWrite, ctrl.createRisk)
router.patch('/:projectId/risks/:id', ...isOrgAnyWrite, ctrl.updateRisk)
router.delete('/:projectId/risks/:id', ...isUpperMgmt, ctrl.deleteRisk)

router.get('/:projectId/risks/:riskId/actions', ...isOrgAny, ctrl.getRiskActions)
router.post('/:projectId/risks/:riskId/actions', ...isOrgAnyWrite, ctrl.createRiskAction)
router.patch('/:projectId/risks/:riskId/actions/:id', ...isOrgAnyWrite, ctrl.updateRiskAction)
router.delete('/:projectId/risks/:riskId/actions/:id', ...isUpperMgmt, ctrl.deleteRiskAction)

// ============ DELIVERABLES ============
router.get('/:projectId/deliverables', ...isOrgAny, ctrl.getDeliverables)
router.post('/:projectId/deliverables', ...isOrgAnyWrite, ctrl.createDeliverable)
router.patch('/:projectId/deliverables/:id', ...isOrgAnyWrite, ctrl.updateDeliverable)
router.delete('/:projectId/deliverables/:id', ...isUpperMgmt, ctrl.deleteDeliverable)

router.get(
  '/:projectId/deliverables/:deliverableId/attachments',
  ...isOrgAny,
  ctrl.getDeliverableAttachments
)
router.post(
  '/:projectId/deliverables/:deliverableId/attachments',
  ...isOrgAnyWrite,
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
  ...isOrgAnyWrite,
  ctrl.createDeliverableComment
)
router.delete(
  '/:projectId/deliverables/:deliverableId/comments/:id',
  ...isUpperMgmt,
  ctrl.deleteDeliverableComment
)

// ============ CHANGE REQUESTS ============
router.get('/:projectId/change-requests', ...isOrgAny, ctrl.getChangeRequests)
router.post('/:projectId/change-requests', ...isOrgAnyWrite, ctrl.createChangeRequest)
router.patch('/:projectId/change-requests/:id/approve', ...isUpperMgmt, changeRequestDecision('ORG', 'APPROVED'))
router.patch('/:projectId/change-requests/:id/reject', ...isUpperMgmt, changeRequestDecision('ORG', 'REJECTED'))
router.patch('/:projectId/change-requests/:id/review', ...isUpperMgmt, changeRequestDecision('ORG', 'SENT_FOR_REVIEW'))
router.patch('/:projectId/change-requests/:id', ...isOrgAnyWrite, ctrl.updateChangeRequest)
router.delete('/:projectId/change-requests/:id', ...isUpperMgmt, ctrl.deleteChangeRequest)

router.get(
  '/:projectId/change-requests/:requestId/attachments',
  ...isOrgAny,
  ctrl.getChangeRequestAttachments
)
router.post(
  '/:projectId/change-requests/:requestId/attachments',
  ...isOrgAnyWrite,
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

// ============ PROJECT ATTACHMENTS ============
router.get('/:projectId/attachments', ...isOrgAny, attachments.list('org'))
router.post('/:projectId/attachments', ...isOrgAnyWrite, attachments.receiveFiles, attachments.create('org'))
router.get(
  '/:projectId/attachments/:id/download',
  attachments.downloadAuth('org', ['ORG_UPPER_MGMT', 'ORG_DATA_ENTRY', 'SUPER_ADMIN']),
  attachments.download('org')
)
router.delete('/:projectId/attachments/:id', ...isOrgAnyWrite, attachments.remove('org'))

// ============ SCENARIOS ============
router.get('/:projectId/scenarios', ...isOrgAny, ctrl.getScenarios)
router.post('/:projectId/scenarios', ...isOrgAnyWrite, ctrl.createScenario)
router.patch('/:projectId/scenarios/:id', ...isOrgAnyWrite, ctrl.updateScenario)
router.delete('/:projectId/scenarios/:id', ...isUpperMgmt, ctrl.deleteScenario)

module.exports = router
