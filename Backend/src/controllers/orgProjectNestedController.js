const prisma = require('../lib/prisma')
const { normalizeDeliverableInput, recomputeProjectProgress } = require('../lib/projectWorkflow')
const { notifyChangeRequestCreated } = require('../lib/changeRequests')

async function assertOrgProject(projectId, orgId) {
  const project = await prisma.orgProject.findUnique({ where: { id: projectId } })
  if (!project) {
    const err = new Error('Project not found')
    err.status = 404
    throw err
  }
  if (project.orgId !== orgId) {
    const err = new Error('Access denied')
    err.status = 403
    throw err
  }
  return project
}

function handleError(res, err) {
  if (err.status) return res.status(err.status).json({ message: err.message })
  return res.status(500).json({ message: err.message })
}

// ============ PHASES ============

exports.getPhases = async (req, res) => {
  try {
    const { projectId } = req.params
    await assertOrgProject(projectId, req.user.orgId)

    const phases = await prisma.orgProjectPhase.findMany({
      where: { projectId },
      orderBy: { createdAt: 'asc' }
    })

    res.json({ count: phases.length, phases })
  } catch (err) {
    handleError(res, err)
  }
}

exports.createPhase = async (req, res) => {
  try {
    const { projectId } = req.params
    await assertOrgProject(projectId, req.user.orgId)

    const { title, startDate, endDate, scope, mainDeliverables, notes } = req.body
    if (!title || !startDate || !endDate) {
      return res.status(400).json({ message: 'Required fields: title, startDate, endDate' })
    }

    const phase = await prisma.orgProjectPhase.create({
      data: {
        title,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        scope,
        mainDeliverables,
        notes,
        projectId
      }
    })

    res.json({ success: true, phase })
  } catch (err) {
    handleError(res, err)
  }
}

exports.updatePhase = async (req, res) => {
  try {
    const { projectId, id } = req.params
    await assertOrgProject(projectId, req.user.orgId)

    const existing = await prisma.orgProjectPhase.findUnique({
      where: { id },
      include: { project: { select: { orgId: true } } }
    })
    if (!existing || existing.projectId !== projectId) {
      return res.status(404).json({ message: 'Phase not found' })
    }
    if (existing.project.orgId !== req.user.orgId) {
      return res.status(403).json({ message: 'Access denied' })
    }

    const data = { ...req.body }
    if (data.startDate) data.startDate = new Date(data.startDate)
    if (data.endDate) data.endDate = new Date(data.endDate)
    delete data.projectId
    delete data.id

    const phase = await prisma.orgProjectPhase.update({ where: { id }, data })
    res.json({ success: true, phase })
  } catch (err) {
    handleError(res, err)
  }
}

exports.deletePhase = async (req, res) => {
  try {
    const { projectId, id } = req.params
    await assertOrgProject(projectId, req.user.orgId)

    const existing = await prisma.orgProjectPhase.findUnique({
      where: { id },
      include: { project: { select: { orgId: true } } }
    })
    if (!existing || existing.projectId !== projectId) {
      return res.status(404).json({ message: 'Phase not found' })
    }
    if (existing.project.orgId !== req.user.orgId) {
      return res.status(403).json({ message: 'Access denied' })
    }

    await prisma.orgProjectPhase.delete({ where: { id } })
    res.json({ success: true, message: 'Phase deleted' })
  } catch (err) {
    handleError(res, err)
  }
}

// ============ TEAM MEMBERS ============

exports.getTeamMembers = async (req, res) => {
  try {
    const { projectId } = req.params
    await assertOrgProject(projectId, req.user.orgId)

    const teamMembers = await prisma.orgProjectTeamMember.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' }
    })

    res.json({ count: teamMembers.length, teamMembers })
  } catch (err) {
    handleError(res, err)
  }
}

exports.createTeamMember = async (req, res) => {
  try {
    const { projectId } = req.params
    await assertOrgProject(projectId, req.user.orgId)

    const { name, email, role, source } = req.body
    if (!name || !source) {
      return res.status(400).json({ message: 'Required fields: name, source' })
    }

    const teamMember = await prisma.orgProjectTeamMember.create({
      data: { name, email, role, source, projectId }
    })

    res.json({ success: true, teamMember })
  } catch (err) {
    handleError(res, err)
  }
}

exports.updateTeamMember = async (req, res) => {
  try {
    const { projectId, id } = req.params
    await assertOrgProject(projectId, req.user.orgId)

    const existing = await prisma.orgProjectTeamMember.findUnique({
      where: { id },
      include: { project: { select: { orgId: true } } }
    })
    if (!existing || existing.projectId !== projectId) {
      return res.status(404).json({ message: 'Team member not found' })
    }
    if (existing.project.orgId !== req.user.orgId) {
      return res.status(403).json({ message: 'Access denied' })
    }

    const data = { ...req.body }
    delete data.projectId
    delete data.id

    const teamMember = await prisma.orgProjectTeamMember.update({ where: { id }, data })
    res.json({ success: true, teamMember })
  } catch (err) {
    handleError(res, err)
  }
}

exports.deleteTeamMember = async (req, res) => {
  try {
    const { projectId, id } = req.params
    await assertOrgProject(projectId, req.user.orgId)

    const existing = await prisma.orgProjectTeamMember.findUnique({
      where: { id },
      include: { project: { select: { orgId: true } } }
    })
    if (!existing || existing.projectId !== projectId) {
      return res.status(404).json({ message: 'Team member not found' })
    }
    if (existing.project.orgId !== req.user.orgId) {
      return res.status(403).json({ message: 'Access denied' })
    }

    await prisma.orgProjectTeamMember.delete({ where: { id } })
    res.json({ success: true, message: 'Team member deleted' })
  } catch (err) {
    handleError(res, err)
  }
}

// ============ CONTRACTS ============

exports.getContracts = async (req, res) => {
  try {
    const { projectId } = req.params
    await assertOrgProject(projectId, req.user.orgId)

    const contracts = await prisma.orgContract.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' }
    })

    res.json({ count: contracts.length, contracts })
  } catch (err) {
    handleError(res, err)
  }
}

exports.createContract = async (req, res) => {
  try {
    const { projectId } = req.params
    await assertOrgProject(projectId, req.user.orgId)

    const { name, fileUrl, startDate, endDate } = req.body
    if (!name || !startDate || !endDate) {
      return res.status(400).json({
        message: 'Required fields: name, startDate, endDate'
      })
    }

    const contract = await prisma.orgContract.create({
      data: {
        name,
        fileUrl: fileUrl || '',
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        projectId,
        uploadedBy: req.user.userId
      }
    })

    res.json({ success: true, contract })
  } catch (err) {
    handleError(res, err)
  }
}

exports.updateContract = async (req, res) => {
  try {
    const { projectId, id } = req.params
    await assertOrgProject(projectId, req.user.orgId)

    const existing = await prisma.orgContract.findUnique({
      where: { id },
      include: { project: { select: { orgId: true } } }
    })
    if (!existing || existing.projectId !== projectId) {
      return res.status(404).json({ message: 'Contract not found' })
    }
    if (existing.project.orgId !== req.user.orgId) {
      return res.status(403).json({ message: 'Access denied' })
    }

    const data = { ...req.body }
    if (data.startDate) data.startDate = new Date(data.startDate)
    if (data.endDate) data.endDate = new Date(data.endDate)
    delete data.projectId
    delete data.uploadedBy
    delete data.id

    const contract = await prisma.orgContract.update({ where: { id }, data })
    res.json({ success: true, contract })
  } catch (err) {
    handleError(res, err)
  }
}

exports.deleteContract = async (req, res) => {
  try {
    const { projectId, id } = req.params
    await assertOrgProject(projectId, req.user.orgId)

    const existing = await prisma.orgContract.findUnique({
      where: { id },
      include: { project: { select: { orgId: true } } }
    })
    if (!existing || existing.projectId !== projectId) {
      return res.status(404).json({ message: 'Contract not found' })
    }
    if (existing.project.orgId !== req.user.orgId) {
      return res.status(403).json({ message: 'Access denied' })
    }

    await prisma.orgContract.delete({ where: { id } })
    res.json({ success: true, message: 'Contract deleted' })
  } catch (err) {
    handleError(res, err)
  }
}

// ============ RISKS ============

exports.getRisks = async (req, res) => {
  try {
    const { projectId } = req.params
    await assertOrgProject(projectId, req.user.orgId)

    const risks = await prisma.orgRisk.findMany({
      where: { projectId },
      include: { actions: true },
      orderBy: { createdAt: 'desc' }
    })

    res.json({ count: risks.length, risks })
  } catch (err) {
    handleError(res, err)
  }
}

exports.createRisk = async (req, res) => {
  try {
    const { projectId } = req.params
    await assertOrgProject(projectId, req.user.orgId)

    const { name, description, probability, impact, status, responsibleName } = req.body
    if (!name || !probability || !impact) {
      return res.status(400).json({
        message: 'Required fields: name, probability, impact'
      })
    }

    const risk = await prisma.orgRisk.create({
      data: {
        name,
        description,
        probability,
        impact,
        status: status || 'ACTIVE',
        responsibleName,
        projectId
      }
    })

    res.json({ success: true, risk })
  } catch (err) {
    handleError(res, err)
  }
}

exports.updateRisk = async (req, res) => {
  try {
    const { projectId, id } = req.params
    await assertOrgProject(projectId, req.user.orgId)

    const existing = await prisma.orgRisk.findUnique({
      where: { id },
      include: { project: { select: { orgId: true } } }
    })
    if (!existing || existing.projectId !== projectId) {
      return res.status(404).json({ message: 'Risk not found' })
    }
    if (existing.project.orgId !== req.user.orgId) {
      return res.status(403).json({ message: 'Access denied' })
    }

    const data = { ...req.body }
    delete data.projectId
    delete data.id

    const risk = await prisma.orgRisk.update({ where: { id }, data })
    res.json({ success: true, risk })
  } catch (err) {
    handleError(res, err)
  }
}

exports.deleteRisk = async (req, res) => {
  try {
    const { projectId, id } = req.params
    await assertOrgProject(projectId, req.user.orgId)

    const existing = await prisma.orgRisk.findUnique({
      where: { id },
      include: { project: { select: { orgId: true } } }
    })
    if (!existing || existing.projectId !== projectId) {
      return res.status(404).json({ message: 'Risk not found' })
    }
    if (existing.project.orgId !== req.user.orgId) {
      return res.status(403).json({ message: 'Access denied' })
    }

    await prisma.orgRisk.delete({ where: { id } })
    res.json({ success: true, message: 'Risk deleted' })
  } catch (err) {
    handleError(res, err)
  }
}

// ============ RISK ACTIONS ============

exports.getRiskActions = async (req, res) => {
  try {
    const { projectId, riskId } = req.params
    await assertOrgProject(projectId, req.user.orgId)

    const risk = await prisma.orgRisk.findUnique({
      where: { id: riskId },
      include: { project: { select: { orgId: true } } }
    })
    if (!risk || risk.projectId !== projectId) {
      return res.status(404).json({ message: 'Risk not found' })
    }
    if (risk.project.orgId !== req.user.orgId) {
      return res.status(403).json({ message: 'Access denied' })
    }

    const actions = await prisma.orgRiskAction.findMany({
      where: { riskId },
      orderBy: { createdAt: 'desc' }
    })

    res.json({ count: actions.length, actions })
  } catch (err) {
    handleError(res, err)
  }
}

exports.createRiskAction = async (req, res) => {
  try {
    const { projectId, riskId } = req.params
    await assertOrgProject(projectId, req.user.orgId)

    const risk = await prisma.orgRisk.findUnique({
      where: { id: riskId },
      include: { project: { select: { orgId: true } } }
    })
    if (!risk || risk.projectId !== projectId) {
      return res.status(404).json({ message: 'Risk not found' })
    }
    if (risk.project.orgId !== req.user.orgId) {
      return res.status(403).json({ message: 'Access denied' })
    }

    const { action, responsibleName, email, price, aiMitigationPlan } = req.body
    if (!action) {
      return res.status(400).json({ message: 'Required field: action' })
    }

    const riskAction = await prisma.orgRiskAction.create({
      data: {
        action,
        responsibleName,
        email,
        price: price ?? 0,
        aiMitigationPlan,
        riskId
      }
    })

    res.json({ success: true, action: riskAction })
  } catch (err) {
    handleError(res, err)
  }
}

exports.updateRiskAction = async (req, res) => {
  try {
    const { projectId, riskId, id } = req.params
    await assertOrgProject(projectId, req.user.orgId)

    const existing = await prisma.orgRiskAction.findUnique({
      where: { id },
      include: {
        risk: {
          include: { project: { select: { orgId: true } } }
        }
      }
    })
    if (!existing || existing.riskId !== riskId || existing.risk.projectId !== projectId) {
      return res.status(404).json({ message: 'Risk action not found' })
    }
    if (existing.risk.project.orgId !== req.user.orgId) {
      return res.status(403).json({ message: 'Access denied' })
    }

    const data = { ...req.body }
    delete data.riskId
    delete data.id

    const riskAction = await prisma.orgRiskAction.update({ where: { id }, data })
    res.json({ success: true, action: riskAction })
  } catch (err) {
    handleError(res, err)
  }
}

exports.deleteRiskAction = async (req, res) => {
  try {
    const { projectId, riskId, id } = req.params
    await assertOrgProject(projectId, req.user.orgId)

    const existing = await prisma.orgRiskAction.findUnique({
      where: { id },
      include: {
        risk: {
          include: { project: { select: { orgId: true } } }
        }
      }
    })
    if (!existing || existing.riskId !== riskId || existing.risk.projectId !== projectId) {
      return res.status(404).json({ message: 'Risk action not found' })
    }
    if (existing.risk.project.orgId !== req.user.orgId) {
      return res.status(403).json({ message: 'Access denied' })
    }

    await prisma.orgRiskAction.delete({ where: { id } })
    res.json({ success: true, message: 'Risk action deleted' })
  } catch (err) {
    handleError(res, err)
  }
}

// ============ DELIVERABLES ============

exports.getDeliverables = async (req, res) => {
  try {
    const { projectId } = req.params
    await assertOrgProject(projectId, req.user.orgId)

    const deliverables = await prisma.orgDeliverable.findMany({
      where: { projectId },
      include: { attachments: true, comments: true },
      orderBy: { createdAt: 'desc' }
    })

    res.json({ count: deliverables.length, deliverables })
  } catch (err) {
    handleError(res, err)
  }
}

exports.createDeliverable = async (req, res) => {
  try {
    const { projectId } = req.params
    await assertOrgProject(projectId, req.user.orgId)

    const { name, description, email, price, status, progressPct, responsibleId } = normalizeDeliverableInput(req.body)
    if (!name) {
      return res.status(400).json({ message: 'Required field: name' })
    }

    const deliverable = await prisma.orgDeliverable.create({
      data: {
        name,
        description,
        email,
        price: price ?? 0,
        status,
        progressPct: progressPct ?? 0,
        projectId,
        responsibleId
      }
    })

    await recomputeProjectProgress('ORG', projectId)
    res.json({ success: true, deliverable })
  } catch (err) {
    handleError(res, err)
  }
}

exports.updateDeliverable = async (req, res) => {
  try {
    const { projectId, id } = req.params
    await assertOrgProject(projectId, req.user.orgId)

    const existing = await prisma.orgDeliverable.findUnique({
      where: { id },
      include: { project: { select: { orgId: true } } }
    })
    if (!existing || existing.projectId !== projectId) {
      return res.status(404).json({ message: 'Deliverable not found' })
    }
    if (existing.project.orgId !== req.user.orgId) {
      return res.status(403).json({ message: 'Access denied' })
    }

    const data = normalizeDeliverableInput({ ...req.body })
    delete data.projectId
    delete data.id

    const deliverable = await prisma.orgDeliverable.update({ where: { id }, data })
    await recomputeProjectProgress('ORG', projectId)
    res.json({ success: true, deliverable })
  } catch (err) {
    handleError(res, err)
  }
}

exports.deleteDeliverable = async (req, res) => {
  try {
    const { projectId, id } = req.params
    await assertOrgProject(projectId, req.user.orgId)

    const existing = await prisma.orgDeliverable.findUnique({
      where: { id },
      include: { project: { select: { orgId: true } } }
    })
    if (!existing || existing.projectId !== projectId) {
      return res.status(404).json({ message: 'Deliverable not found' })
    }
    if (existing.project.orgId !== req.user.orgId) {
      return res.status(403).json({ message: 'Access denied' })
    }

    await prisma.orgDeliverable.delete({ where: { id } })
    await recomputeProjectProgress('ORG', projectId)
    res.json({ success: true, message: 'Deliverable deleted' })
  } catch (err) {
    handleError(res, err)
  }
}

// ============ DELIVERABLE ATTACHMENTS ============

exports.getDeliverableAttachments = async (req, res) => {
  try {
    const { projectId, deliverableId } = req.params
    await assertOrgProject(projectId, req.user.orgId)

    const deliverable = await prisma.orgDeliverable.findUnique({
      where: { id: deliverableId },
      include: { project: { select: { orgId: true } } }
    })
    if (!deliverable || deliverable.projectId !== projectId) {
      return res.status(404).json({ message: 'Deliverable not found' })
    }
    if (deliverable.project.orgId !== req.user.orgId) {
      return res.status(403).json({ message: 'Access denied' })
    }

    const attachments = await prisma.orgDeliverableAttachment.findMany({
      where: { deliverableId },
      orderBy: { createdAt: 'desc' }
    })

    res.json({ count: attachments.length, attachments })
  } catch (err) {
    handleError(res, err)
  }
}

exports.createDeliverableAttachment = async (req, res) => {
  try {
    const { projectId, deliverableId } = req.params
    await assertOrgProject(projectId, req.user.orgId)

    const deliverable = await prisma.orgDeliverable.findUnique({
      where: { id: deliverableId },
      include: { project: { select: { orgId: true } } }
    })
    if (!deliverable || deliverable.projectId !== projectId) {
      return res.status(404).json({ message: 'Deliverable not found' })
    }
    if (deliverable.project.orgId !== req.user.orgId) {
      return res.status(403).json({ message: 'Access denied' })
    }

    const { fileUrl, fileName, fileType, fileSize } = req.body
    if (!fileUrl || !fileName) {
      return res.status(400).json({ message: 'Required fields: fileUrl, fileName' })
    }

    const attachment = await prisma.orgDeliverableAttachment.create({
      data: {
        fileUrl,
        fileName,
        fileType,
        fileSize,
        deliverableId,
        uploadedBy: req.user.userId
      }
    })

    res.json({ success: true, attachment })
  } catch (err) {
    handleError(res, err)
  }
}

exports.deleteDeliverableAttachment = async (req, res) => {
  try {
    const { projectId, deliverableId, id } = req.params
    await assertOrgProject(projectId, req.user.orgId)

    const existing = await prisma.orgDeliverableAttachment.findUnique({
      where: { id },
      include: {
        deliverable: {
          include: { project: { select: { orgId: true } } }
        }
      }
    })
    if (
      !existing ||
      existing.deliverableId !== deliverableId ||
      existing.deliverable.projectId !== projectId
    ) {
      return res.status(404).json({ message: 'Attachment not found' })
    }
    if (existing.deliverable.project.orgId !== req.user.orgId) {
      return res.status(403).json({ message: 'Access denied' })
    }

    await prisma.orgDeliverableAttachment.delete({ where: { id } })
    res.json({ success: true, message: 'Attachment deleted' })
  } catch (err) {
    handleError(res, err)
  }
}

// ============ DELIVERABLE COMMENTS ============

exports.getDeliverableComments = async (req, res) => {
  try {
    const { projectId, deliverableId } = req.params
    await assertOrgProject(projectId, req.user.orgId)

    const deliverable = await prisma.orgDeliverable.findUnique({
      where: { id: deliverableId },
      include: { project: { select: { orgId: true } } }
    })
    if (!deliverable || deliverable.projectId !== projectId) {
      return res.status(404).json({ message: 'Deliverable not found' })
    }
    if (deliverable.project.orgId !== req.user.orgId) {
      return res.status(403).json({ message: 'Access denied' })
    }

    const comments = await prisma.orgDeliverableComment.findMany({
      where: { deliverableId },
      include: { author: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: 'asc' }
    })

    res.json({ count: comments.length, comments })
  } catch (err) {
    handleError(res, err)
  }
}

exports.createDeliverableComment = async (req, res) => {
  try {
    const { projectId, deliverableId } = req.params
    await assertOrgProject(projectId, req.user.orgId)

    const deliverable = await prisma.orgDeliverable.findUnique({
      where: { id: deliverableId },
      include: { project: { select: { orgId: true } } }
    })
    if (!deliverable || deliverable.projectId !== projectId) {
      return res.status(404).json({ message: 'Deliverable not found' })
    }
    if (deliverable.project.orgId !== req.user.orgId) {
      return res.status(403).json({ message: 'Access denied' })
    }

    const { content } = req.body
    if (!content) {
      return res.status(400).json({ message: 'Required field: content' })
    }

    const comment = await prisma.orgDeliverableComment.create({
      data: {
        content,
        deliverableId,
        authorId: req.user.userId
      }
    })

    res.json({ success: true, comment })
  } catch (err) {
    handleError(res, err)
  }
}

exports.deleteDeliverableComment = async (req, res) => {
  try {
    const { projectId, deliverableId, id } = req.params
    await assertOrgProject(projectId, req.user.orgId)

    const existing = await prisma.orgDeliverableComment.findUnique({
      where: { id },
      include: {
        deliverable: {
          include: { project: { select: { orgId: true } } }
        }
      }
    })
    if (
      !existing ||
      existing.deliverableId !== deliverableId ||
      existing.deliverable.projectId !== projectId
    ) {
      return res.status(404).json({ message: 'Comment not found' })
    }
    if (existing.deliverable.project.orgId !== req.user.orgId) {
      return res.status(403).json({ message: 'Access denied' })
    }

    await prisma.orgDeliverableComment.delete({ where: { id } })
    res.json({ success: true, message: 'Comment deleted' })
  } catch (err) {
    handleError(res, err)
  }
}

// ============ CHANGE REQUESTS ============

exports.getChangeRequests = async (req, res) => {
  try {
    const { projectId } = req.params
    await assertOrgProject(projectId, req.user.orgId)

    const changeRequests = await prisma.orgChangeRequest.findMany({
      where: { projectId },
      include: { attachments: true, logs: true },
      orderBy: { createdAt: 'desc' }
    })

    res.json({ count: changeRequests.length, changeRequests })
  } catch (err) {
    handleError(res, err)
  }
}

exports.createChangeRequest = async (req, res) => {
  try {
    const { projectId } = req.params
    const project = await assertOrgProject(projectId, req.user.orgId)

    const {
      title,
      description,
      priority,
      status,
      impactOnCost,
      impactOnSchedule,
      submittedBy,
      submittedDate
    } = req.body

    if (!title) {
      return res.status(400).json({ message: 'Required field: title' })
    }

    const changeRequest = await prisma.orgChangeRequest.create({
      data: {
        title,
        description,
        priority,
        status: 'PENDING',
        impactOnCost,
        impactOnSchedule,
        submittedBy,
        submittedDate: submittedDate ? new Date(submittedDate) : new Date(),
        projectId,
        requestedBy: req.user.userId
      }
    })
    await notifyChangeRequestCreated('ORG', project, changeRequest).catch(() => {})

    res.json({ success: true, changeRequest })
  } catch (err) {
    handleError(res, err)
  }
}

exports.updateChangeRequest = async (req, res) => {
  try {
    const { projectId, id } = req.params
    await assertOrgProject(projectId, req.user.orgId)

    const existing = await prisma.orgChangeRequest.findUnique({
      where: { id },
      include: { project: { select: { orgId: true } } }
    })
    if (!existing || existing.projectId !== projectId) {
      return res.status(404).json({ message: 'Change request not found' })
    }
    if (existing.project.orgId !== req.user.orgId) {
      return res.status(403).json({ message: 'Access denied' })
    }

    const data = { ...req.body }
    if (data.submittedDate) data.submittedDate = new Date(data.submittedDate)
    delete data.projectId
    delete data.requestedBy
    delete data.id
    delete data.status

    const changeRequest = await prisma.orgChangeRequest.update({ where: { id }, data })
    res.json({ success: true, changeRequest })
  } catch (err) {
    handleError(res, err)
  }
}

exports.deleteChangeRequest = async (req, res) => {
  try {
    const { projectId, id } = req.params
    await assertOrgProject(projectId, req.user.orgId)

    const existing = await prisma.orgChangeRequest.findUnique({
      where: { id },
      include: { project: { select: { orgId: true } } }
    })
    if (!existing || existing.projectId !== projectId) {
      return res.status(404).json({ message: 'Change request not found' })
    }
    if (existing.project.orgId !== req.user.orgId) {
      return res.status(403).json({ message: 'Access denied' })
    }

    await prisma.orgChangeRequest.delete({ where: { id } })
    res.json({ success: true, message: 'Change request deleted' })
  } catch (err) {
    handleError(res, err)
  }
}

// ============ CHANGE REQUEST ATTACHMENTS ============

exports.getChangeRequestAttachments = async (req, res) => {
  try {
    const { projectId, requestId } = req.params
    await assertOrgProject(projectId, req.user.orgId)

    const request = await prisma.orgChangeRequest.findUnique({
      where: { id: requestId },
      include: { project: { select: { orgId: true } } }
    })
    if (!request || request.projectId !== projectId) {
      return res.status(404).json({ message: 'Change request not found' })
    }
    if (request.project.orgId !== req.user.orgId) {
      return res.status(403).json({ message: 'Access denied' })
    }

    const attachments = await prisma.orgChangeRequestAttachment.findMany({
      where: { requestId },
      orderBy: { createdAt: 'desc' }
    })

    res.json({ count: attachments.length, attachments })
  } catch (err) {
    handleError(res, err)
  }
}

exports.createChangeRequestAttachment = async (req, res) => {
  try {
    const { projectId, requestId } = req.params
    await assertOrgProject(projectId, req.user.orgId)

    const request = await prisma.orgChangeRequest.findUnique({
      where: { id: requestId },
      include: { project: { select: { orgId: true } } }
    })
    if (!request || request.projectId !== projectId) {
      return res.status(404).json({ message: 'Change request not found' })
    }
    if (request.project.orgId !== req.user.orgId) {
      return res.status(403).json({ message: 'Access denied' })
    }

    const { fileUrl, fileName, fileType, fileSize } = req.body
    if (!fileUrl || !fileName) {
      return res.status(400).json({ message: 'Required fields: fileUrl, fileName' })
    }

    const attachment = await prisma.orgChangeRequestAttachment.create({
      data: {
        fileUrl,
        fileName,
        fileType,
        fileSize,
        requestId,
        uploadedBy: req.user.userId
      }
    })

    res.json({ success: true, attachment })
  } catch (err) {
    handleError(res, err)
  }
}

exports.deleteChangeRequestAttachment = async (req, res) => {
  try {
    const { projectId, requestId, id } = req.params
    await assertOrgProject(projectId, req.user.orgId)

    const existing = await prisma.orgChangeRequestAttachment.findUnique({
      where: { id },
      include: {
        request: {
          include: { project: { select: { orgId: true } } }
        }
      }
    })
    if (
      !existing ||
      existing.requestId !== requestId ||
      existing.request.projectId !== projectId
    ) {
      return res.status(404).json({ message: 'Attachment not found' })
    }
    if (existing.request.project.orgId !== req.user.orgId) {
      return res.status(403).json({ message: 'Access denied' })
    }

    await prisma.orgChangeRequestAttachment.delete({ where: { id } })
    res.json({ success: true, message: 'Attachment deleted' })
  } catch (err) {
    handleError(res, err)
  }
}

// ============ REQUEST LOGS ============

exports.getRequestLogs = async (req, res) => {
  try {
    const { projectId, requestId } = req.params
    await assertOrgProject(projectId, req.user.orgId)

    const request = await prisma.orgChangeRequest.findUnique({
      where: { id: requestId },
      include: { project: { select: { orgId: true } } }
    })
    if (!request || request.projectId !== projectId) {
      return res.status(404).json({ message: 'Change request not found' })
    }
    if (request.project.orgId !== req.user.orgId) {
      return res.status(403).json({ message: 'Access denied' })
    }

    const logs = await prisma.orgRequestLog.findMany({
      where: { requestId },
      include: { performer: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: 'desc' }
    })

    res.json({ count: logs.length, logs })
  } catch (err) {
    handleError(res, err)
  }
}

// ============ SCENARIO ANALYSES ============

exports.getScenarios = async (req, res) => {
  try {
    const { projectId } = req.params
    await assertOrgProject(projectId, req.user.orgId)

    const scenarios = await prisma.orgScenarioAnalysis.findMany({
      where: { orgProjectId: projectId },
      orderBy: { createdAt: 'desc' }
    })

    res.json({ count: scenarios.length, scenarios })
  } catch (err) {
    handleError(res, err)
  }
}

exports.createScenario = async (req, res) => {
  try {
    const { projectId } = req.params
    await assertOrgProject(projectId, req.user.orgId)

    const {
      originalDate,
      originalCost,
      originalRiskLevel,
      newDate,
      newCost,
      newRiskLevel,
      impactOnSchedule,
      impactOnCost,
      impactOnCriticalPath,
      impactOnRiskLevel,
      recommendations,
      budgetIncrease,
      humanResourcesReduction,
      aiRecommendations
    } = req.body

    const scenario = await prisma.orgScenarioAnalysis.create({
      data: {
        orgProjectId: projectId,
        originalDate: originalDate ? new Date(originalDate) : null,
        originalCost: originalCost ?? 0,
        originalRiskLevel,
        newDate: newDate ? new Date(newDate) : null,
        newCost: newCost ?? 0,
        newRiskLevel,
        impactOnSchedule,
        impactOnCost,
        impactOnCriticalPath,
        impactOnRiskLevel,
        recommendations,
        budgetIncrease: budgetIncrease ?? 0,
        humanResourcesReduction: humanResourcesReduction ?? 0,
        aiRecommendations,
        createdBy: req.user.userId
      }
    })

    res.json({ success: true, scenario })
  } catch (err) {
    handleError(res, err)
  }
}

exports.updateScenario = async (req, res) => {
  try {
    const { projectId, id } = req.params
    await assertOrgProject(projectId, req.user.orgId)

    const existing = await prisma.orgScenarioAnalysis.findUnique({
      where: { id },
      include: { project: { select: { orgId: true } } }
    })
    if (!existing || existing.orgProjectId !== projectId) {
      return res.status(404).json({ message: 'Scenario not found' })
    }
    if (existing.project.orgId !== req.user.orgId) {
      return res.status(403).json({ message: 'Access denied' })
    }

    const data = { ...req.body }
    if (data.originalDate) data.originalDate = new Date(data.originalDate)
    if (data.newDate) data.newDate = new Date(data.newDate)
    delete data.orgProjectId
    delete data.projectId
    delete data.createdBy
    delete data.id

    const scenario = await prisma.orgScenarioAnalysis.update({ where: { id }, data })
    res.json({ success: true, scenario })
  } catch (err) {
    handleError(res, err)
  }
}

exports.deleteScenario = async (req, res) => {
  try {
    const { projectId, id } = req.params
    await assertOrgProject(projectId, req.user.orgId)

    const existing = await prisma.orgScenarioAnalysis.findUnique({
      where: { id },
      include: { project: { select: { orgId: true } } }
    })
    if (!existing || existing.orgProjectId !== projectId) {
      return res.status(404).json({ message: 'Scenario not found' })
    }
    if (existing.project.orgId !== req.user.orgId) {
      return res.status(403).json({ message: 'Access denied' })
    }

    await prisma.orgScenarioAnalysis.delete({ where: { id } })
    res.json({ success: true, message: 'Scenario deleted' })
  } catch (err) {
    handleError(res, err)
  }
}

exports.assertOrgProject = assertOrgProject
