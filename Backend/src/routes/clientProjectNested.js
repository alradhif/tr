const express = require('express')
const router = express.Router({ mergeParams: true })
const auth = require('../middleware/auth')
const roles = require('../middleware/roles')
const ctrl = require('../controllers/clientProjectNestedController')
const attachments = require('../controllers/projectAttachmentsController')
const { nestedWriteGuard } = require('../lib/projectWorkflow')
const { changeRequestDecision } = require('../lib/changeRequests')

const isClientAny = [auth, roles('CLIENT_UPPER_MGMT', 'CLIENT_DATA_ENTRY', 'SUPER_ADMIN')]
const isClientAnyWrite = [...isClientAny, nestedWriteGuard('CLIENT')]
const isClientUpperMgmt = [auth, roles('CLIENT_UPPER_MGMT', 'SUPER_ADMIN')]

// ── Phases ───────────────────────────────────────────────
router.post('/:projectId/phases', ...isClientAnyWrite, ctrl.createPhase)
router.get('/:projectId/phases', ...isClientAny, ctrl.getPhases)
router.get('/:projectId/phases/:id', ...isClientAny, ctrl.getPhaseById)
router.put('/:projectId/phases/:id', ...isClientAnyWrite, ctrl.updatePhase)
router.delete('/:projectId/phases/:id', ...isClientUpperMgmt, ctrl.deletePhase)

// ── Team members ─────────────────────────────────────────
router.post('/:projectId/team-members', ...isClientAnyWrite, ctrl.createTeamMember)
router.get('/:projectId/team-members', ...isClientAny, ctrl.getTeamMembers)
router.get('/:projectId/team-members/:id', ...isClientAny, ctrl.getTeamMemberById)
router.put('/:projectId/team-members/:id', ...isClientAnyWrite, ctrl.updateTeamMember)
router.delete('/:projectId/team-members/:id', ...isClientUpperMgmt, ctrl.deleteTeamMember)

// ── Contracts ────────────────────────────────────────────
router.post('/:projectId/contracts', ...isClientAnyWrite, ctrl.createContract)
router.get('/:projectId/contracts', ...isClientAny, ctrl.getContracts)
router.get('/:projectId/contracts/:id', ...isClientAny, ctrl.getContractById)
router.put('/:projectId/contracts/:id', ...isClientAnyWrite, ctrl.updateContract)
router.delete('/:projectId/contracts/:id', ...isClientUpperMgmt, ctrl.deleteContract)

// ── Risks ────────────────────────────────────────────────
router.post('/:projectId/risks', ...isClientAnyWrite, ctrl.createRisk)
router.get('/:projectId/risks', ...isClientAny, ctrl.getRisks)
router.get('/:projectId/risks/:id', ...isClientAny, ctrl.getRiskById)
router.put('/:projectId/risks/:id', ...isClientAnyWrite, ctrl.updateRisk)
router.delete('/:projectId/risks/:id', ...isClientUpperMgmt, ctrl.deleteRisk)

// ── Risk actions ─────────────────────────────────────────
router.post('/:projectId/risks/:riskId/actions', ...isClientAnyWrite, ctrl.createRiskAction)
router.get('/:projectId/risks/:riskId/actions', ...isClientAny, ctrl.getRiskActions)
router.get('/:projectId/risks/:riskId/actions/:id', ...isClientAny, ctrl.getRiskActionById)
router.put('/:projectId/risks/:riskId/actions/:id', ...isClientAnyWrite, ctrl.updateRiskAction)
router.delete('/:projectId/risks/:riskId/actions/:id', ...isClientUpperMgmt, ctrl.deleteRiskAction)

// ── Deliverables ─────────────────────────────────────────
router.post('/:projectId/deliverables', ...isClientAnyWrite, ctrl.createDeliverable)
router.get('/:projectId/deliverables', ...isClientAny, ctrl.getDeliverables)
router.get('/:projectId/deliverables/:id', ...isClientAny, ctrl.getDeliverableById)
router.put('/:projectId/deliverables/:id', ...isClientAnyWrite, ctrl.updateDeliverable)
router.delete('/:projectId/deliverables/:id', ...isClientUpperMgmt, ctrl.deleteDeliverable)

// ── Deliverable attachments ──────────────────────────────
router.post('/:projectId/deliverables/:deliverableId/attachments', ...isClientAnyWrite, ctrl.createDeliverableAttachment)
router.get('/:projectId/deliverables/:deliverableId/attachments', ...isClientAny, ctrl.getDeliverableAttachments)
router.delete('/:projectId/deliverables/:deliverableId/attachments/:id', ...isClientUpperMgmt, ctrl.deleteDeliverableAttachment)

// ── Deliverable comments ─────────────────────────────────
router.post('/:projectId/deliverables/:deliverableId/comments', ...isClientAnyWrite, ctrl.createDeliverableComment)
router.get('/:projectId/deliverables/:deliverableId/comments', ...isClientAny, ctrl.getDeliverableComments)
router.delete('/:projectId/deliverables/:deliverableId/comments/:id', ...isClientUpperMgmt, ctrl.deleteDeliverableComment)

// ── Change requests ──────────────────────────────────────
router.post('/:projectId/change-requests', ...isClientAnyWrite, ctrl.createChangeRequest)
router.get('/:projectId/change-requests', ...isClientAny, ctrl.getChangeRequests)
router.get('/:projectId/change-requests/:id', ...isClientAny, ctrl.getChangeRequestById)
router.patch('/:projectId/change-requests/:id/approve', ...isClientUpperMgmt, changeRequestDecision('CLIENT', 'APPROVED'))
router.patch('/:projectId/change-requests/:id/reject', ...isClientUpperMgmt, changeRequestDecision('CLIENT', 'REJECTED'))
router.patch('/:projectId/change-requests/:id/review', ...isClientUpperMgmt, changeRequestDecision('CLIENT', 'SENT_FOR_REVIEW'))
router.put('/:projectId/change-requests/:id', ...isClientAnyWrite, ctrl.updateChangeRequest)
router.delete('/:projectId/change-requests/:id', ...isClientUpperMgmt, ctrl.deleteChangeRequest)

// ── Change request attachments ───────────────────────────
router.post('/:projectId/change-requests/:requestId/attachments', ...isClientAnyWrite, ctrl.createChangeRequestAttachment)
router.get('/:projectId/change-requests/:requestId/attachments', ...isClientAny, ctrl.getChangeRequestAttachments)
router.delete('/:projectId/change-requests/:requestId/attachments/:id', ...isClientUpperMgmt, ctrl.deleteChangeRequestAttachment)

// ── Request logs ─────────────────────────────────────────
router.post('/:projectId/change-requests/:requestId/logs', ...isClientAnyWrite, ctrl.createRequestLog)
router.get('/:projectId/change-requests/:requestId/logs', ...isClientAny, ctrl.getRequestLogs)

// ── Project attachments ──────────────────────────────────
router.get('/:projectId/attachments', ...isClientAny, attachments.list('client'))
router.post('/:projectId/attachments', ...isClientAnyWrite, attachments.receiveFiles, attachments.create('client'))
router.get(
  '/:projectId/attachments/:id/download',
  attachments.downloadAuth('client', ['CLIENT_UPPER_MGMT', 'CLIENT_DATA_ENTRY', 'SUPER_ADMIN']),
  attachments.download('client')
)
router.delete('/:projectId/attachments/:id', ...isClientAnyWrite, attachments.remove('client'))

// ── Scenario analyses ────────────────────────────────────
router.post('/:projectId/scenarios', ...isClientAnyWrite, ctrl.createScenario)
router.get('/:projectId/scenarios', ...isClientAny, ctrl.getScenarios)
router.get('/:projectId/scenarios/:id', ...isClientAny, ctrl.getScenarioById)
router.put('/:projectId/scenarios/:id', ...isClientAnyWrite, ctrl.updateScenario)
router.delete('/:projectId/scenarios/:id', ...isClientUpperMgmt, ctrl.deleteScenario)

module.exports = router
