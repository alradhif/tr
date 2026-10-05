const prisma = require('../lib/prisma')

// ── helpers ──────────────────────────────────────────────
async function getOwnedProject(projectId, clientId) {
  const project = await prisma.clientProject.findUnique({ where: { id: projectId } })
  if (!project) return { error: { status: 404, message: 'Project not found' } }
  if (project.clientId !== clientId) return { error: { status: 403, message: 'Access denied' } }
  return { project }
}

async function getOwnedRisk(riskId, clientId) {
  const risk = await prisma.clientRisk.findUnique({
    where: { id: riskId },
    include: { project: true }
  })
  if (!risk) return { error: { status: 404, message: 'Risk not found' } }
  if (risk.project.clientId !== clientId) return { error: { status: 403, message: 'Access denied' } }
  return { risk }
}

async function getOwnedDeliverable(deliverableId, clientId) {
  const deliverable = await prisma.clientDeliverable.findUnique({
    where: { id: deliverableId },
    include: { project: true }
  })
  if (!deliverable) return { error: { status: 404, message: 'Deliverable not found' } }
  if (deliverable.project.clientId !== clientId) {
    return { error: { status: 403, message: 'Access denied' } }
  }
  return { deliverable }
}

async function getOwnedChangeRequest(requestId, clientId) {
  const request = await prisma.clientChangeRequest.findUnique({
    where: { id: requestId },
    include: { project: true }
  })
  if (!request) return { error: { status: 404, message: 'Change request not found' } }
  if (request.project.clientId !== clientId) {
    return { error: { status: 403, message: 'Access denied' } }
  }
  return { request }
}

// ══════════════════════════════════════════════════════════
// PHASES
// ══════════════════════════════════════════════════════════

exports.createPhase = async (req, res) => {
  try {
    const clientId = req.user.clientId
    const { projectId } = req.params
    const { title, startDate, endDate, scope, mainDeliverables, notes } = req.body

    const owned = await getOwnedProject(projectId, clientId)
    if (owned.error) return res.status(owned.error.status).json({ message: owned.error.message })

    if (!title || !startDate || !endDate) {
      return res.status(400).json({ message: 'Required fields: title, startDate, endDate' })
    }

    const phase = await prisma.clientProjectPhase.create({
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
    res.status(500).json({ message: err.message })
  }
}

exports.getPhases = async (req, res) => {
  try {
    const clientId = req.user.clientId
    const { projectId } = req.params

    const owned = await getOwnedProject(projectId, clientId)
    if (owned.error) return res.status(owned.error.status).json({ message: owned.error.message })

    const phases = await prisma.clientProjectPhase.findMany({
      where: { projectId },
      orderBy: { startDate: 'asc' }
    })

    res.json({ count: phases.length, phases })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

exports.getPhaseById = async (req, res) => {
  try {
    const clientId = req.user.clientId
    const { projectId, id } = req.params

    const owned = await getOwnedProject(projectId, clientId)
    if (owned.error) return res.status(owned.error.status).json({ message: owned.error.message })

    const phase = await prisma.clientProjectPhase.findUnique({ where: { id } })
    if (!phase || phase.projectId !== projectId) {
      return res.status(404).json({ message: 'Phase not found' })
    }

    res.json({ phase })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

exports.updatePhase = async (req, res) => {
  try {
    const clientId = req.user.clientId
    const { projectId, id } = req.params

    const owned = await getOwnedProject(projectId, clientId)
    if (owned.error) return res.status(owned.error.status).json({ message: owned.error.message })

    const existing = await prisma.clientProjectPhase.findUnique({ where: { id } })
    if (!existing || existing.projectId !== projectId) {
      return res.status(404).json({ message: 'Phase not found' })
    }

    const data = { ...req.body }
    if (data.startDate) data.startDate = new Date(data.startDate)
    if (data.endDate) data.endDate = new Date(data.endDate)
    delete data.projectId

    const phase = await prisma.clientProjectPhase.update({ where: { id }, data })
    res.json({ success: true, phase })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

exports.deletePhase = async (req, res) => {
  try {
    const clientId = req.user.clientId
    const { projectId, id } = req.params

    const owned = await getOwnedProject(projectId, clientId)
    if (owned.error) return res.status(owned.error.status).json({ message: owned.error.message })

    const existing = await prisma.clientProjectPhase.findUnique({ where: { id } })
    if (!existing || existing.projectId !== projectId) {
      return res.status(404).json({ message: 'Phase not found' })
    }

    await prisma.clientProjectPhase.delete({ where: { id } })
    res.json({ success: true, message: 'Phase deleted' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// ══════════════════════════════════════════════════════════
// TEAM MEMBERS
// ══════════════════════════════════════════════════════════

exports.createTeamMember = async (req, res) => {
  try {
    const clientId = req.user.clientId
    const { projectId } = req.params
    const { name, email, role, source } = req.body

    const owned = await getOwnedProject(projectId, clientId)
    if (owned.error) return res.status(owned.error.status).json({ message: owned.error.message })

    if (!name || !source) {
      return res.status(400).json({ message: 'Required fields: name, source' })
    }

    const member = await prisma.clientProjectTeamMember.create({
      data: { name, email, role, source, projectId }
    })

    res.json({ success: true, member })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

exports.getTeamMembers = async (req, res) => {
  try {
    const clientId = req.user.clientId
    const { projectId } = req.params

    const owned = await getOwnedProject(projectId, clientId)
    if (owned.error) return res.status(owned.error.status).json({ message: owned.error.message })

    const members = await prisma.clientProjectTeamMember.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' }
    })

    res.json({ count: members.length, members })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

exports.getTeamMemberById = async (req, res) => {
  try {
    const clientId = req.user.clientId
    const { projectId, id } = req.params

    const owned = await getOwnedProject(projectId, clientId)
    if (owned.error) return res.status(owned.error.status).json({ message: owned.error.message })

    const member = await prisma.clientProjectTeamMember.findUnique({ where: { id } })
    if (!member || member.projectId !== projectId) {
      return res.status(404).json({ message: 'Team member not found' })
    }

    res.json({ member })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

exports.updateTeamMember = async (req, res) => {
  try {
    const clientId = req.user.clientId
    const { projectId, id } = req.params

    const owned = await getOwnedProject(projectId, clientId)
    if (owned.error) return res.status(owned.error.status).json({ message: owned.error.message })

    const existing = await prisma.clientProjectTeamMember.findUnique({ where: { id } })
    if (!existing || existing.projectId !== projectId) {
      return res.status(404).json({ message: 'Team member not found' })
    }

    const data = { ...req.body }
    delete data.projectId

    const member = await prisma.clientProjectTeamMember.update({ where: { id }, data })
    res.json({ success: true, member })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

exports.deleteTeamMember = async (req, res) => {
  try {
    const clientId = req.user.clientId
    const { projectId, id } = req.params

    const owned = await getOwnedProject(projectId, clientId)
    if (owned.error) return res.status(owned.error.status).json({ message: owned.error.message })

    const existing = await prisma.clientProjectTeamMember.findUnique({ where: { id } })
    if (!existing || existing.projectId !== projectId) {
      return res.status(404).json({ message: 'Team member not found' })
    }

    await prisma.clientProjectTeamMember.delete({ where: { id } })
    res.json({ success: true, message: 'Team member deleted' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// ══════════════════════════════════════════════════════════
// CONTRACTS
// ══════════════════════════════════════════════════════════

exports.createContract = async (req, res) => {
  try {
    const clientId = req.user.clientId
    const { projectId } = req.params
    const { name, fileUrl, startDate, endDate } = req.body

    const owned = await getOwnedProject(projectId, clientId)
    if (owned.error) return res.status(owned.error.status).json({ message: owned.error.message })

    if (!name || !startDate || !endDate) {
      return res.status(400).json({
        message: 'Required fields: name, startDate, endDate'
      })
    }

    const contract = await prisma.clientContract.create({
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
    res.status(500).json({ message: err.message })
  }
}

exports.getContracts = async (req, res) => {
  try {
    const clientId = req.user.clientId
    const { projectId } = req.params

    const owned = await getOwnedProject(projectId, clientId)
    if (owned.error) return res.status(owned.error.status).json({ message: owned.error.message })

    const contracts = await prisma.clientContract.findMany({
      where: { projectId },
      include: { uploader: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: 'desc' }
    })

    res.json({ count: contracts.length, contracts })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

exports.getContractById = async (req, res) => {
  try {
    const clientId = req.user.clientId
    const { projectId, id } = req.params

    const owned = await getOwnedProject(projectId, clientId)
    if (owned.error) return res.status(owned.error.status).json({ message: owned.error.message })

    const contract = await prisma.clientContract.findUnique({
      where: { id },
      include: { uploader: { select: { id: true, name: true, email: true } } }
    })
    if (!contract || contract.projectId !== projectId) {
      return res.status(404).json({ message: 'Contract not found' })
    }

    res.json({ contract })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

exports.updateContract = async (req, res) => {
  try {
    const clientId = req.user.clientId
    const { projectId, id } = req.params

    const owned = await getOwnedProject(projectId, clientId)
    if (owned.error) return res.status(owned.error.status).json({ message: owned.error.message })

    const existing = await prisma.clientContract.findUnique({ where: { id } })
    if (!existing || existing.projectId !== projectId) {
      return res.status(404).json({ message: 'Contract not found' })
    }

    const data = { ...req.body }
    if (data.startDate) data.startDate = new Date(data.startDate)
    if (data.endDate) data.endDate = new Date(data.endDate)
    delete data.projectId
    delete data.uploadedBy

    const contract = await prisma.clientContract.update({ where: { id }, data })
    res.json({ success: true, contract })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

exports.deleteContract = async (req, res) => {
  try {
    const clientId = req.user.clientId
    const { projectId, id } = req.params

    const owned = await getOwnedProject(projectId, clientId)
    if (owned.error) return res.status(owned.error.status).json({ message: owned.error.message })

    const existing = await prisma.clientContract.findUnique({ where: { id } })
    if (!existing || existing.projectId !== projectId) {
      return res.status(404).json({ message: 'Contract not found' })
    }

    await prisma.clientContract.delete({ where: { id } })
    res.json({ success: true, message: 'Contract deleted' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// ══════════════════════════════════════════════════════════
// RISKS
// ══════════════════════════════════════════════════════════

exports.createRisk = async (req, res) => {
  try {
    const clientId = req.user.clientId
    const { projectId } = req.params
    const { name, description, probability, impact, status, responsibleName } = req.body

    const owned = await getOwnedProject(projectId, clientId)
    if (owned.error) return res.status(owned.error.status).json({ message: owned.error.message })

    if (!name || !probability || !impact) {
      return res.status(400).json({ message: 'Required fields: name, probability, impact' })
    }

    const risk = await prisma.clientRisk.create({
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
    res.status(500).json({ message: err.message })
  }
}

exports.getRisks = async (req, res) => {
  try {
    const clientId = req.user.clientId
    const { projectId } = req.params

    const owned = await getOwnedProject(projectId, clientId)
    if (owned.error) return res.status(owned.error.status).json({ message: owned.error.message })

    const risks = await prisma.clientRisk.findMany({
      where: { projectId },
      include: { actions: true },
      orderBy: { createdAt: 'desc' }
    })

    res.json({ count: risks.length, risks })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

exports.getRiskById = async (req, res) => {
  try {
    const clientId = req.user.clientId
    const { projectId, id } = req.params

    const owned = await getOwnedProject(projectId, clientId)
    if (owned.error) return res.status(owned.error.status).json({ message: owned.error.message })

    const risk = await prisma.clientRisk.findUnique({
      where: { id },
      include: { actions: true }
    })
    if (!risk || risk.projectId !== projectId) {
      return res.status(404).json({ message: 'Risk not found' })
    }

    res.json({ risk })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

exports.updateRisk = async (req, res) => {
  try {
    const clientId = req.user.clientId
    const { projectId, id } = req.params

    const owned = await getOwnedProject(projectId, clientId)
    if (owned.error) return res.status(owned.error.status).json({ message: owned.error.message })

    const existing = await prisma.clientRisk.findUnique({ where: { id } })
    if (!existing || existing.projectId !== projectId) {
      return res.status(404).json({ message: 'Risk not found' })
    }

    const data = { ...req.body }
    delete data.projectId

    const risk = await prisma.clientRisk.update({ where: { id }, data })
    res.json({ success: true, risk })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

exports.deleteRisk = async (req, res) => {
  try {
    const clientId = req.user.clientId
    const { projectId, id } = req.params

    const owned = await getOwnedProject(projectId, clientId)
    if (owned.error) return res.status(owned.error.status).json({ message: owned.error.message })

    const existing = await prisma.clientRisk.findUnique({ where: { id } })
    if (!existing || existing.projectId !== projectId) {
      return res.status(404).json({ message: 'Risk not found' })
    }

    await prisma.clientRisk.delete({ where: { id } })
    res.json({ success: true, message: 'Risk deleted' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// ══════════════════════════════════════════════════════════
// RISK ACTIONS
// ══════════════════════════════════════════════════════════

exports.createRiskAction = async (req, res) => {
  try {
    const clientId = req.user.clientId
    const { projectId, riskId } = req.params
    const { action, responsibleName, email, price, aiMitigationPlan } = req.body

    const owned = await getOwnedProject(projectId, clientId)
    if (owned.error) return res.status(owned.error.status).json({ message: owned.error.message })

    const riskOwned = await getOwnedRisk(riskId, clientId)
    if (riskOwned.error) return res.status(riskOwned.error.status).json({ message: riskOwned.error.message })
    if (riskOwned.risk.projectId !== projectId) {
      return res.status(404).json({ message: 'Risk not found' })
    }

    if (!action) {
      return res.status(400).json({ message: 'Required fields: action' })
    }

    const riskAction = await prisma.clientRiskAction.create({
      data: {
        action,
        responsibleName,
        email,
        price: price || 0,
        aiMitigationPlan,
        riskId
      }
    })

    res.json({ success: true, action: riskAction })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

exports.getRiskActions = async (req, res) => {
  try {
    const clientId = req.user.clientId
    const { projectId, riskId } = req.params

    const owned = await getOwnedProject(projectId, clientId)
    if (owned.error) return res.status(owned.error.status).json({ message: owned.error.message })

    const riskOwned = await getOwnedRisk(riskId, clientId)
    if (riskOwned.error) return res.status(riskOwned.error.status).json({ message: riskOwned.error.message })
    if (riskOwned.risk.projectId !== projectId) {
      return res.status(404).json({ message: 'Risk not found' })
    }

    const actions = await prisma.clientRiskAction.findMany({
      where: { riskId },
      orderBy: { createdAt: 'desc' }
    })

    res.json({ count: actions.length, actions })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

exports.getRiskActionById = async (req, res) => {
  try {
    const clientId = req.user.clientId
    const { projectId, riskId, id } = req.params

    const owned = await getOwnedProject(projectId, clientId)
    if (owned.error) return res.status(owned.error.status).json({ message: owned.error.message })

    const riskOwned = await getOwnedRisk(riskId, clientId)
    if (riskOwned.error) return res.status(riskOwned.error.status).json({ message: riskOwned.error.message })
    if (riskOwned.risk.projectId !== projectId) {
      return res.status(404).json({ message: 'Risk not found' })
    }

    const action = await prisma.clientRiskAction.findUnique({ where: { id } })
    if (!action || action.riskId !== riskId) {
      return res.status(404).json({ message: 'Risk action not found' })
    }

    res.json({ action })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

exports.updateRiskAction = async (req, res) => {
  try {
    const clientId = req.user.clientId
    const { projectId, riskId, id } = req.params

    const owned = await getOwnedProject(projectId, clientId)
    if (owned.error) return res.status(owned.error.status).json({ message: owned.error.message })

    const riskOwned = await getOwnedRisk(riskId, clientId)
    if (riskOwned.error) return res.status(riskOwned.error.status).json({ message: riskOwned.error.message })
    if (riskOwned.risk.projectId !== projectId) {
      return res.status(404).json({ message: 'Risk not found' })
    }

    const existing = await prisma.clientRiskAction.findUnique({ where: { id } })
    if (!existing || existing.riskId !== riskId) {
      return res.status(404).json({ message: 'Risk action not found' })
    }

    const data = { ...req.body }
    delete data.riskId

    const action = await prisma.clientRiskAction.update({ where: { id }, data })
    res.json({ success: true, action })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

exports.deleteRiskAction = async (req, res) => {
  try {
    const clientId = req.user.clientId
    const { projectId, riskId, id } = req.params

    const owned = await getOwnedProject(projectId, clientId)
    if (owned.error) return res.status(owned.error.status).json({ message: owned.error.message })

    const riskOwned = await getOwnedRisk(riskId, clientId)
    if (riskOwned.error) return res.status(riskOwned.error.status).json({ message: riskOwned.error.message })
    if (riskOwned.risk.projectId !== projectId) {
      return res.status(404).json({ message: 'Risk not found' })
    }

    const existing = await prisma.clientRiskAction.findUnique({ where: { id } })
    if (!existing || existing.riskId !== riskId) {
      return res.status(404).json({ message: 'Risk action not found' })
    }

    await prisma.clientRiskAction.delete({ where: { id } })
    res.json({ success: true, message: 'Risk action deleted' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// ══════════════════════════════════════════════════════════
// DELIVERABLES
// ══════════════════════════════════════════════════════════

exports.createDeliverable = async (req, res) => {
  try {
    const clientId = req.user.clientId
    const { projectId } = req.params
    const { name, description, email, price, status, progressPct, responsibleId } = req.body

    const owned = await getOwnedProject(projectId, clientId)
    if (owned.error) return res.status(owned.error.status).json({ message: owned.error.message })

    if (!name) {
      return res.status(400).json({ message: 'Required fields: name' })
    }

    if (responsibleId) {
      const user = await prisma.clientUser.findUnique({ where: { id: responsibleId } })
      if (!user || user.clientId !== clientId) {
        return res.status(400).json({ message: 'Invalid responsibleId: must belong to same client' })
      }
    }

    const deliverable = await prisma.clientDeliverable.create({
      data: {
        name,
        description,
        email,
        price: price || 0,
        status: status || 'ACTIVE',
        progressPct: progressPct || 0,
        projectId,
        responsibleId
      }
    })

    res.json({ success: true, deliverable })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

exports.getDeliverables = async (req, res) => {
  try {
    const clientId = req.user.clientId
    const { projectId } = req.params

    const owned = await getOwnedProject(projectId, clientId)
    if (owned.error) return res.status(owned.error.status).json({ message: owned.error.message })

    const deliverables = await prisma.clientDeliverable.findMany({
      where: { projectId },
      include: {
        responsible: { select: { id: true, name: true, email: true } },
        attachments: true,
        comments: true
      },
      orderBy: { createdAt: 'desc' }
    })

    res.json({ count: deliverables.length, deliverables })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

exports.getDeliverableById = async (req, res) => {
  try {
    const clientId = req.user.clientId
    const { projectId, id } = req.params

    const owned = await getOwnedProject(projectId, clientId)
    if (owned.error) return res.status(owned.error.status).json({ message: owned.error.message })

    const deliverable = await prisma.clientDeliverable.findUnique({
      where: { id },
      include: {
        responsible: { select: { id: true, name: true, email: true } },
        attachments: true,
        comments: {
          include: { author: { select: { id: true, name: true, email: true } } }
        }
      }
    })
    if (!deliverable || deliverable.projectId !== projectId) {
      return res.status(404).json({ message: 'Deliverable not found' })
    }

    res.json({ deliverable })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

exports.updateDeliverable = async (req, res) => {
  try {
    const clientId = req.user.clientId
    const { projectId, id } = req.params

    const owned = await getOwnedProject(projectId, clientId)
    if (owned.error) return res.status(owned.error.status).json({ message: owned.error.message })

    const existing = await prisma.clientDeliverable.findUnique({ where: { id } })
    if (!existing || existing.projectId !== projectId) {
      return res.status(404).json({ message: 'Deliverable not found' })
    }

    const data = { ...req.body }
    delete data.projectId

    if (data.responsibleId) {
      const user = await prisma.clientUser.findUnique({ where: { id: data.responsibleId } })
      if (!user || user.clientId !== clientId) {
        return res.status(400).json({ message: 'Invalid responsibleId: must belong to same client' })
      }
    }

    const deliverable = await prisma.clientDeliverable.update({ where: { id }, data })
    res.json({ success: true, deliverable })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

exports.deleteDeliverable = async (req, res) => {
  try {
    const clientId = req.user.clientId
    const { projectId, id } = req.params

    const owned = await getOwnedProject(projectId, clientId)
    if (owned.error) return res.status(owned.error.status).json({ message: owned.error.message })

    const existing = await prisma.clientDeliverable.findUnique({ where: { id } })
    if (!existing || existing.projectId !== projectId) {
      return res.status(404).json({ message: 'Deliverable not found' })
    }

    await prisma.clientDeliverable.delete({ where: { id } })
    res.json({ success: true, message: 'Deliverable deleted' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// ══════════════════════════════════════════════════════════
// DELIVERABLE ATTACHMENTS
// ══════════════════════════════════════════════════════════

exports.createDeliverableAttachment = async (req, res) => {
  try {
    const clientId = req.user.clientId
    const { projectId, deliverableId } = req.params
    const { fileUrl, fileName, fileType, fileSize } = req.body

    const owned = await getOwnedProject(projectId, clientId)
    if (owned.error) return res.status(owned.error.status).json({ message: owned.error.message })

    const delOwned = await getOwnedDeliverable(deliverableId, clientId)
    if (delOwned.error) return res.status(delOwned.error.status).json({ message: delOwned.error.message })
    if (delOwned.deliverable.projectId !== projectId) {
      return res.status(404).json({ message: 'Deliverable not found' })
    }

    if (!fileUrl || !fileName) {
      return res.status(400).json({ message: 'Required fields: fileUrl, fileName' })
    }

    const attachment = await prisma.clientDeliverableAttachment.create({
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
    res.status(500).json({ message: err.message })
  }
}

exports.getDeliverableAttachments = async (req, res) => {
  try {
    const clientId = req.user.clientId
    const { projectId, deliverableId } = req.params

    const owned = await getOwnedProject(projectId, clientId)
    if (owned.error) return res.status(owned.error.status).json({ message: owned.error.message })

    const delOwned = await getOwnedDeliverable(deliverableId, clientId)
    if (delOwned.error) return res.status(delOwned.error.status).json({ message: delOwned.error.message })
    if (delOwned.deliverable.projectId !== projectId) {
      return res.status(404).json({ message: 'Deliverable not found' })
    }

    const attachments = await prisma.clientDeliverableAttachment.findMany({
      where: { deliverableId },
      include: { uploader: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: 'desc' }
    })

    res.json({ count: attachments.length, attachments })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

exports.deleteDeliverableAttachment = async (req, res) => {
  try {
    const clientId = req.user.clientId
    const { projectId, deliverableId, id } = req.params

    const owned = await getOwnedProject(projectId, clientId)
    if (owned.error) return res.status(owned.error.status).json({ message: owned.error.message })

    const delOwned = await getOwnedDeliverable(deliverableId, clientId)
    if (delOwned.error) return res.status(delOwned.error.status).json({ message: delOwned.error.message })
    if (delOwned.deliverable.projectId !== projectId) {
      return res.status(404).json({ message: 'Deliverable not found' })
    }

    const existing = await prisma.clientDeliverableAttachment.findUnique({ where: { id } })
    if (!existing || existing.deliverableId !== deliverableId) {
      return res.status(404).json({ message: 'Attachment not found' })
    }

    await prisma.clientDeliverableAttachment.delete({ where: { id } })
    res.json({ success: true, message: 'Attachment deleted' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// ══════════════════════════════════════════════════════════
// DELIVERABLE COMMENTS
// ══════════════════════════════════════════════════════════

exports.createDeliverableComment = async (req, res) => {
  try {
    const clientId = req.user.clientId
    const { projectId, deliverableId } = req.params
    const { content } = req.body

    const owned = await getOwnedProject(projectId, clientId)
    if (owned.error) return res.status(owned.error.status).json({ message: owned.error.message })

    const delOwned = await getOwnedDeliverable(deliverableId, clientId)
    if (delOwned.error) return res.status(delOwned.error.status).json({ message: delOwned.error.message })
    if (delOwned.deliverable.projectId !== projectId) {
      return res.status(404).json({ message: 'Deliverable not found' })
    }

    if (!content) {
      return res.status(400).json({ message: 'Required fields: content' })
    }

    const comment = await prisma.clientDeliverableComment.create({
      data: {
        content,
        deliverableId,
        authorId: req.user.userId
      }
    })

    res.json({ success: true, comment })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

exports.getDeliverableComments = async (req, res) => {
  try {
    const clientId = req.user.clientId
    const { projectId, deliverableId } = req.params

    const owned = await getOwnedProject(projectId, clientId)
    if (owned.error) return res.status(owned.error.status).json({ message: owned.error.message })

    const delOwned = await getOwnedDeliverable(deliverableId, clientId)
    if (delOwned.error) return res.status(delOwned.error.status).json({ message: delOwned.error.message })
    if (delOwned.deliverable.projectId !== projectId) {
      return res.status(404).json({ message: 'Deliverable not found' })
    }

    const comments = await prisma.clientDeliverableComment.findMany({
      where: { deliverableId },
      include: { author: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: 'asc' }
    })

    res.json({ count: comments.length, comments })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

exports.deleteDeliverableComment = async (req, res) => {
  try {
    const clientId = req.user.clientId
    const { projectId, deliverableId, id } = req.params

    const owned = await getOwnedProject(projectId, clientId)
    if (owned.error) return res.status(owned.error.status).json({ message: owned.error.message })

    const delOwned = await getOwnedDeliverable(deliverableId, clientId)
    if (delOwned.error) return res.status(delOwned.error.status).json({ message: delOwned.error.message })
    if (delOwned.deliverable.projectId !== projectId) {
      return res.status(404).json({ message: 'Deliverable not found' })
    }

    const existing = await prisma.clientDeliverableComment.findUnique({ where: { id } })
    if (!existing || existing.deliverableId !== deliverableId) {
      return res.status(404).json({ message: 'Comment not found' })
    }

    await prisma.clientDeliverableComment.delete({ where: { id } })
    res.json({ success: true, message: 'Comment deleted' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// ══════════════════════════════════════════════════════════
// CHANGE REQUESTS
// ══════════════════════════════════════════════════════════

exports.createChangeRequest = async (req, res) => {
  try {
    const clientId = req.user.clientId
    const { projectId } = req.params
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

    const owned = await getOwnedProject(projectId, clientId)
    if (owned.error) return res.status(owned.error.status).json({ message: owned.error.message })

    if (!title) {
      return res.status(400).json({ message: 'Required fields: title' })
    }

    const changeRequest = await prisma.clientChangeRequest.create({
      data: {
        title,
        description,
        priority: priority || 'MEDIUM',
        status: status || 'PENDING',
        impactOnCost,
        impactOnSchedule,
        submittedBy,
        submittedDate: submittedDate ? new Date(submittedDate) : null,
        projectId,
        requestedBy: req.user.userId
      }
    })

    res.json({ success: true, changeRequest })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

exports.getChangeRequests = async (req, res) => {
  try {
    const clientId = req.user.clientId
    const { projectId } = req.params
    const { status } = req.query

    const owned = await getOwnedProject(projectId, clientId)
    if (owned.error) return res.status(owned.error.status).json({ message: owned.error.message })

    const where = { projectId }
    if (status) where.status = status

    const changeRequests = await prisma.clientChangeRequest.findMany({
      where,
      include: {
        requester: { select: { id: true, name: true, email: true } },
        attachments: true,
        logs: true
      },
      orderBy: { createdAt: 'desc' }
    })

    res.json({ count: changeRequests.length, changeRequests })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

exports.getChangeRequestById = async (req, res) => {
  try {
    const clientId = req.user.clientId
    const { projectId, id } = req.params

    const owned = await getOwnedProject(projectId, clientId)
    if (owned.error) return res.status(owned.error.status).json({ message: owned.error.message })

    const changeRequest = await prisma.clientChangeRequest.findUnique({
      where: { id },
      include: {
        requester: { select: { id: true, name: true, email: true } },
        attachments: true,
        logs: {
          include: { performer: { select: { id: true, name: true, email: true } } },
          orderBy: { createdAt: 'asc' }
        }
      }
    })
    if (!changeRequest || changeRequest.projectId !== projectId) {
      return res.status(404).json({ message: 'Change request not found' })
    }

    res.json({ changeRequest })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

exports.updateChangeRequest = async (req, res) => {
  try {
    const clientId = req.user.clientId
    const { projectId, id } = req.params

    const owned = await getOwnedProject(projectId, clientId)
    if (owned.error) return res.status(owned.error.status).json({ message: owned.error.message })

    const existing = await prisma.clientChangeRequest.findUnique({ where: { id } })
    if (!existing || existing.projectId !== projectId) {
      return res.status(404).json({ message: 'Change request not found' })
    }

    const data = { ...req.body }
    if (data.submittedDate) data.submittedDate = new Date(data.submittedDate)
    delete data.projectId
    delete data.requestedBy

    const changeRequest = await prisma.clientChangeRequest.update({ where: { id }, data })
    res.json({ success: true, changeRequest })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

exports.deleteChangeRequest = async (req, res) => {
  try {
    const clientId = req.user.clientId
    const { projectId, id } = req.params

    const owned = await getOwnedProject(projectId, clientId)
    if (owned.error) return res.status(owned.error.status).json({ message: owned.error.message })

    const existing = await prisma.clientChangeRequest.findUnique({ where: { id } })
    if (!existing || existing.projectId !== projectId) {
      return res.status(404).json({ message: 'Change request not found' })
    }

    await prisma.clientChangeRequest.delete({ where: { id } })
    res.json({ success: true, message: 'Change request deleted' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// ══════════════════════════════════════════════════════════
// CHANGE REQUEST ATTACHMENTS
// ══════════════════════════════════════════════════════════

exports.createChangeRequestAttachment = async (req, res) => {
  try {
    const clientId = req.user.clientId
    const { projectId, requestId } = req.params
    const { fileUrl, fileName, fileType, fileSize } = req.body

    const owned = await getOwnedProject(projectId, clientId)
    if (owned.error) return res.status(owned.error.status).json({ message: owned.error.message })

    const reqOwned = await getOwnedChangeRequest(requestId, clientId)
    if (reqOwned.error) return res.status(reqOwned.error.status).json({ message: reqOwned.error.message })
    if (reqOwned.request.projectId !== projectId) {
      return res.status(404).json({ message: 'Change request not found' })
    }

    if (!fileUrl || !fileName) {
      return res.status(400).json({ message: 'Required fields: fileUrl, fileName' })
    }

    const attachment = await prisma.clientChangeRequestAttachment.create({
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
    res.status(500).json({ message: err.message })
  }
}

exports.getChangeRequestAttachments = async (req, res) => {
  try {
    const clientId = req.user.clientId
    const { projectId, requestId } = req.params

    const owned = await getOwnedProject(projectId, clientId)
    if (owned.error) return res.status(owned.error.status).json({ message: owned.error.message })

    const reqOwned = await getOwnedChangeRequest(requestId, clientId)
    if (reqOwned.error) return res.status(reqOwned.error.status).json({ message: reqOwned.error.message })
    if (reqOwned.request.projectId !== projectId) {
      return res.status(404).json({ message: 'Change request not found' })
    }

    const attachments = await prisma.clientChangeRequestAttachment.findMany({
      where: { requestId },
      include: { uploader: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: 'desc' }
    })

    res.json({ count: attachments.length, attachments })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

exports.deleteChangeRequestAttachment = async (req, res) => {
  try {
    const clientId = req.user.clientId
    const { projectId, requestId, id } = req.params

    const owned = await getOwnedProject(projectId, clientId)
    if (owned.error) return res.status(owned.error.status).json({ message: owned.error.message })

    const reqOwned = await getOwnedChangeRequest(requestId, clientId)
    if (reqOwned.error) return res.status(reqOwned.error.status).json({ message: reqOwned.error.message })
    if (reqOwned.request.projectId !== projectId) {
      return res.status(404).json({ message: 'Change request not found' })
    }

    const existing = await prisma.clientChangeRequestAttachment.findUnique({ where: { id } })
    if (!existing || existing.requestId !== requestId) {
      return res.status(404).json({ message: 'Attachment not found' })
    }

    await prisma.clientChangeRequestAttachment.delete({ where: { id } })
    res.json({ success: true, message: 'Attachment deleted' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// ══════════════════════════════════════════════════════════
// REQUEST LOGS
// ══════════════════════════════════════════════════════════

exports.createRequestLog = async (req, res) => {
  try {
    const clientId = req.user.clientId
    const { projectId, requestId } = req.params
    const { action, comment } = req.body

    const owned = await getOwnedProject(projectId, clientId)
    if (owned.error) return res.status(owned.error.status).json({ message: owned.error.message })

    const reqOwned = await getOwnedChangeRequest(requestId, clientId)
    if (reqOwned.error) return res.status(reqOwned.error.status).json({ message: reqOwned.error.message })
    if (reqOwned.request.projectId !== projectId) {
      return res.status(404).json({ message: 'Change request not found' })
    }

    if (!action) {
      return res.status(400).json({ message: 'Required fields: action' })
    }

    const log = await prisma.clientRequestLog.create({
      data: {
        action,
        comment,
        requestId,
        performedBy: req.user.userId
      }
    })

    // Keep change request status in sync when logging decisions
    const statusMap = {
      APPROVED: 'APPROVED',
      REJECTED: 'REJECTED',
      SENT_FOR_REVIEW: 'UNDER_REVIEW'
    }
    if (statusMap[action]) {
      await prisma.clientChangeRequest.update({
        where: { id: requestId },
        data: { status: statusMap[action] }
      })
    }

    res.json({ success: true, log })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

exports.getRequestLogs = async (req, res) => {
  try {
    const clientId = req.user.clientId
    const { projectId, requestId } = req.params

    const owned = await getOwnedProject(projectId, clientId)
    if (owned.error) return res.status(owned.error.status).json({ message: owned.error.message })

    const reqOwned = await getOwnedChangeRequest(requestId, clientId)
    if (reqOwned.error) return res.status(reqOwned.error.status).json({ message: reqOwned.error.message })
    if (reqOwned.request.projectId !== projectId) {
      return res.status(404).json({ message: 'Change request not found' })
    }

    const logs = await prisma.clientRequestLog.findMany({
      where: { requestId },
      include: { performer: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: 'asc' }
    })

    res.json({ count: logs.length, logs })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// ══════════════════════════════════════════════════════════
// SCENARIO ANALYSES (clientProjectId)
// ══════════════════════════════════════════════════════════

exports.createScenario = async (req, res) => {
  try {
    const clientId = req.user.clientId
    const { projectId } = req.params
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

    const owned = await getOwnedProject(projectId, clientId)
    if (owned.error) return res.status(owned.error.status).json({ message: owned.error.message })

    const scenario = await prisma.clientScenarioAnalysis.create({
      data: {
        clientProjectId: projectId,
        originalDate: originalDate ? new Date(originalDate) : null,
        originalCost: originalCost || 0,
        originalRiskLevel,
        newDate: newDate ? new Date(newDate) : null,
        newCost: newCost || 0,
        newRiskLevel,
        impactOnSchedule,
        impactOnCost,
        impactOnCriticalPath,
        impactOnRiskLevel,
        recommendations,
        budgetIncrease: budgetIncrease || 0,
        humanResourcesReduction: humanResourcesReduction || 0,
        aiRecommendations,
        createdBy: req.user.userId
      }
    })

    res.json({ success: true, scenario })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

exports.getScenarios = async (req, res) => {
  try {
    const clientId = req.user.clientId
    const { projectId } = req.params

    const owned = await getOwnedProject(projectId, clientId)
    if (owned.error) return res.status(owned.error.status).json({ message: owned.error.message })

    const scenarios = await prisma.clientScenarioAnalysis.findMany({
      where: { clientProjectId: projectId },
      include: { creator: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: 'desc' }
    })

    res.json({ count: scenarios.length, scenarios })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

exports.getScenarioById = async (req, res) => {
  try {
    const clientId = req.user.clientId
    const { projectId, id } = req.params

    const owned = await getOwnedProject(projectId, clientId)
    if (owned.error) return res.status(owned.error.status).json({ message: owned.error.message })

    const scenario = await prisma.clientScenarioAnalysis.findUnique({
      where: { id },
      include: { creator: { select: { id: true, name: true, email: true } } }
    })
    if (!scenario || scenario.clientProjectId !== projectId) {
      return res.status(404).json({ message: 'Scenario analysis not found' })
    }

    res.json({ scenario })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

exports.updateScenario = async (req, res) => {
  try {
    const clientId = req.user.clientId
    const { projectId, id } = req.params

    const owned = await getOwnedProject(projectId, clientId)
    if (owned.error) return res.status(owned.error.status).json({ message: owned.error.message })

    const existing = await prisma.clientScenarioAnalysis.findUnique({ where: { id } })
    if (!existing || existing.clientProjectId !== projectId) {
      return res.status(404).json({ message: 'Scenario analysis not found' })
    }

    const data = { ...req.body }
    if (data.originalDate) data.originalDate = new Date(data.originalDate)
    if (data.newDate) data.newDate = new Date(data.newDate)
    delete data.clientProjectId
    delete data.createdBy

    const scenario = await prisma.clientScenarioAnalysis.update({ where: { id }, data })
    res.json({ success: true, scenario })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

exports.deleteScenario = async (req, res) => {
  try {
    const clientId = req.user.clientId
    const { projectId, id } = req.params

    const owned = await getOwnedProject(projectId, clientId)
    if (owned.error) return res.status(owned.error.status).json({ message: owned.error.message })

    const existing = await prisma.clientScenarioAnalysis.findUnique({ where: { id } })
    if (!existing || existing.clientProjectId !== projectId) {
      return res.status(404).json({ message: 'Scenario analysis not found' })
    }

    await prisma.clientScenarioAnalysis.delete({ where: { id } })
    res.json({ success: true, message: 'Scenario analysis deleted' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}
