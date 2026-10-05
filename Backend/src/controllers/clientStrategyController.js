const prisma = require('../lib/prisma')

// ── helpers ──────────────────────────────────────────────
async function getOwnedDocument(documentId, clientId) {
  const document = await prisma.clientStrategyDocument.findUnique({ where: { id: documentId } })
  if (!document) return { error: { status: 404, message: 'Strategy document not found' } }
  if (document.clientId !== clientId) return { error: { status: 403, message: 'Access denied' } }
  return { document }
}

async function getOwnedGoal(goalId, clientId) {
  const goal = await prisma.clientStrategicGoal.findUnique({ where: { id: goalId } })
  if (!goal) return { error: { status: 404, message: 'Strategic goal not found' } }
  if (goal.clientId !== clientId) return { error: { status: 403, message: 'Access denied' } }
  return { goal }
}

// ══════════════════════════════════════════════════════════
// STRATEGY DOCUMENTS
// ══════════════════════════════════════════════════════════

exports.createDocument = async (req, res) => {
  try {
    const clientId = req.user.clientId
    const { title, fileUrl, fileType, status } = req.body

    if (!title || !fileUrl) {
      return res.status(400).json({ message: 'Required fields: title, fileUrl' })
    }

    const document = await prisma.clientStrategyDocument.create({
      data: {
        title,
        fileUrl,
        fileType,
        status: status || 'PROCESSING',
        clientId,
        uploadedBy: req.user.userId
      }
    })

    res.json({ success: true, document })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

exports.getDocuments = async (req, res) => {
  try {
    const clientId = req.user.clientId

    const documents = await prisma.clientStrategyDocument.findMany({
      where: { clientId },
      include: {
        uploader: { select: { id: true, name: true, email: true } },
        goals: true
      },
      orderBy: { createdAt: 'desc' }
    })

    res.json({ count: documents.length, documents })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

exports.getDocumentById = async (req, res) => {
  try {
    const clientId = req.user.clientId
    const { id } = req.params

    const document = await prisma.clientStrategyDocument.findUnique({
      where: { id },
      include: {
        uploader: { select: { id: true, name: true, email: true } },
        goals: {
          include: {
            stages: true,
            projectLinks: true,
            kpiSnapshots: true
          }
        }
      }
    })

    if (!document) return res.status(404).json({ message: 'Strategy document not found' })
    if (document.clientId !== clientId) return res.status(403).json({ message: 'Access denied' })

    res.json({ document })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

exports.updateDocument = async (req, res) => {
  try {
    const clientId = req.user.clientId
    const { id } = req.params

    const owned = await getOwnedDocument(id, clientId)
    if (owned.error) return res.status(owned.error.status).json({ message: owned.error.message })

    const data = { ...req.body }
    delete data.clientId
    delete data.uploadedBy

    const document = await prisma.clientStrategyDocument.update({ where: { id }, data })
    res.json({ success: true, document })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

exports.deleteDocument = async (req, res) => {
  try {
    const clientId = req.user.clientId
    const { id } = req.params

    const owned = await getOwnedDocument(id, clientId)
    if (owned.error) return res.status(owned.error.status).json({ message: owned.error.message })

    await prisma.clientStrategyDocument.delete({ where: { id } })
    res.json({ success: true, message: 'Strategy document deleted' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// ══════════════════════════════════════════════════════════
// STRATEGIC GOALS
// ══════════════════════════════════════════════════════════

exports.createGoal = async (req, res) => {
  try {
    const clientId = req.user.clientId
    const {
      title,
      description,
      requiredOutputsCount,
      startDate,
      endDate,
      status,
      progressPct,
      achievementPct,
      isAiExtracted,
      aiSummary,
      documentId
    } = req.body

    if (!title || !documentId) {
      return res.status(400).json({ message: 'Required fields: title, documentId' })
    }

    const ownedDoc = await getOwnedDocument(documentId, clientId)
    if (ownedDoc.error) {
      return res.status(ownedDoc.error.status).json({ message: ownedDoc.error.message })
    }

    const goal = await prisma.clientStrategicGoal.create({
      data: {
        title,
        description,
        requiredOutputsCount: requiredOutputsCount || 0,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        status: status || 'NOT_STARTED',
        progressPct: progressPct || 0,
        achievementPct: achievementPct || 0,
        isAiExtracted: isAiExtracted !== undefined ? isAiExtracted : true,
        aiSummary,
        documentId,
        clientId
      }
    })

    res.json({ success: true, goal })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

exports.getGoals = async (req, res) => {
  try {
    const clientId = req.user.clientId
    const { documentId, status } = req.query

    const where = { clientId }
    if (documentId) where.documentId = documentId
    if (status) where.status = status

    const goals = await prisma.clientStrategicGoal.findMany({
      where,
      include: {
        stages: true,
        projectLinks: true,
        kpiSnapshots: true
      },
      orderBy: { createdAt: 'desc' }
    })

    res.json({ count: goals.length, goals })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

exports.getGoalById = async (req, res) => {
  try {
    const clientId = req.user.clientId
    const { id } = req.params

    const goal = await prisma.clientStrategicGoal.findUnique({
      where: { id },
      include: {
        document: true,
        stages: true,
        projectLinks: {
          include: { project: { select: { id: true, name: true, status: true } } }
        },
        kpiSnapshots: true
      }
    })

    if (!goal) return res.status(404).json({ message: 'Strategic goal not found' })
    if (goal.clientId !== clientId) return res.status(403).json({ message: 'Access denied' })

    res.json({ goal })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

exports.updateGoal = async (req, res) => {
  try {
    const clientId = req.user.clientId
    const { id } = req.params

    const owned = await getOwnedGoal(id, clientId)
    if (owned.error) return res.status(owned.error.status).json({ message: owned.error.message })

    const data = { ...req.body }
    if (data.startDate) data.startDate = new Date(data.startDate)
    if (data.endDate) data.endDate = new Date(data.endDate)
    delete data.clientId
    delete data.documentId

    const goal = await prisma.clientStrategicGoal.update({ where: { id }, data })
    res.json({ success: true, goal })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

exports.deleteGoal = async (req, res) => {
  try {
    const clientId = req.user.clientId
    const { id } = req.params

    const owned = await getOwnedGoal(id, clientId)
    if (owned.error) return res.status(owned.error.status).json({ message: owned.error.message })

    await prisma.clientStrategicGoal.delete({ where: { id } })
    res.json({ success: true, message: 'Strategic goal deleted' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// ══════════════════════════════════════════════════════════
// GOAL STAGES
// ══════════════════════════════════════════════════════════

exports.createStage = async (req, res) => {
  try {
    const clientId = req.user.clientId
    const { goalId } = req.params
    const { stageName, startDate, endDate, status, progressPct } = req.body

    const owned = await getOwnedGoal(goalId, clientId)
    if (owned.error) return res.status(owned.error.status).json({ message: owned.error.message })

    if (!stageName) {
      return res.status(400).json({ message: 'Required fields: stageName' })
    }

    const stage = await prisma.clientStrategicGoalStage.create({
      data: {
        stageName,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        status: status || 'NOT_STARTED',
        progressPct: progressPct || 0,
        goalId
      }
    })

    res.json({ success: true, stage })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

exports.getStages = async (req, res) => {
  try {
    const clientId = req.user.clientId
    const { goalId } = req.params

    const owned = await getOwnedGoal(goalId, clientId)
    if (owned.error) return res.status(owned.error.status).json({ message: owned.error.message })

    const stages = await prisma.clientStrategicGoalStage.findMany({
      where: { goalId },
      orderBy: { createdAt: 'asc' }
    })

    res.json({ count: stages.length, stages })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

exports.updateStage = async (req, res) => {
  try {
    const clientId = req.user.clientId
    const { goalId, id } = req.params

    const owned = await getOwnedGoal(goalId, clientId)
    if (owned.error) return res.status(owned.error.status).json({ message: owned.error.message })

    const existing = await prisma.clientStrategicGoalStage.findUnique({ where: { id } })
    if (!existing || existing.goalId !== goalId) {
      return res.status(404).json({ message: 'Stage not found' })
    }

    const data = { ...req.body }
    if (data.startDate) data.startDate = new Date(data.startDate)
    if (data.endDate) data.endDate = new Date(data.endDate)
    delete data.goalId

    const stage = await prisma.clientStrategicGoalStage.update({ where: { id }, data })
    res.json({ success: true, stage })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

exports.deleteStage = async (req, res) => {
  try {
    const clientId = req.user.clientId
    const { goalId, id } = req.params

    const owned = await getOwnedGoal(goalId, clientId)
    if (owned.error) return res.status(owned.error.status).json({ message: owned.error.message })

    const existing = await prisma.clientStrategicGoalStage.findUnique({ where: { id } })
    if (!existing || existing.goalId !== goalId) {
      return res.status(404).json({ message: 'Stage not found' })
    }

    await prisma.clientStrategicGoalStage.delete({ where: { id } })
    res.json({ success: true, message: 'Stage deleted' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// ══════════════════════════════════════════════════════════
// GOAL ↔ PROJECT LINKS
// ══════════════════════════════════════════════════════════

exports.createGoalProjectLink = async (req, res) => {
  try {
    const clientId = req.user.clientId
    const { goalId } = req.params
    const {
      projectId,
      relevanceScore,
      aiNotes,
      isAiLinked,
      actionTaken,
      projectStatus
    } = req.body

    const owned = await getOwnedGoal(goalId, clientId)
    if (owned.error) return res.status(owned.error.status).json({ message: owned.error.message })

    if (!projectId) {
      return res.status(400).json({ message: 'Required fields: projectId' })
    }

    const project = await prisma.clientProject.findUnique({ where: { id: projectId } })
    if (!project) return res.status(404).json({ message: 'Project not found' })
    if (project.clientId !== clientId) return res.status(403).json({ message: 'Access denied' })

    const link = await prisma.clientGoalProjectLink.create({
      data: {
        goalId,
        projectId,
        relevanceScore: relevanceScore || 0,
        aiNotes,
        isAiLinked: isAiLinked !== undefined ? isAiLinked : true,
        actionTaken,
        projectStatus
      }
    })

    res.json({ success: true, link })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

exports.getGoalProjectLinks = async (req, res) => {
  try {
    const clientId = req.user.clientId
    const { goalId } = req.params

    const owned = await getOwnedGoal(goalId, clientId)
    if (owned.error) return res.status(owned.error.status).json({ message: owned.error.message })

    const links = await prisma.clientGoalProjectLink.findMany({
      where: { goalId },
      include: { project: { select: { id: true, name: true, status: true, progressPct: true } } },
      orderBy: { createdAt: 'desc' }
    })

    res.json({ count: links.length, links })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

exports.updateGoalProjectLink = async (req, res) => {
  try {
    const clientId = req.user.clientId
    const { goalId, id } = req.params

    const owned = await getOwnedGoal(goalId, clientId)
    if (owned.error) return res.status(owned.error.status).json({ message: owned.error.message })

    const existing = await prisma.clientGoalProjectLink.findUnique({ where: { id } })
    if (!existing || existing.goalId !== goalId) {
      return res.status(404).json({ message: 'Goal-project link not found' })
    }

    const data = { ...req.body }
    delete data.goalId
    delete data.projectId

    const link = await prisma.clientGoalProjectLink.update({ where: { id }, data })
    res.json({ success: true, link })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

exports.deleteGoalProjectLink = async (req, res) => {
  try {
    const clientId = req.user.clientId
    const { goalId, id } = req.params

    const owned = await getOwnedGoal(goalId, clientId)
    if (owned.error) return res.status(owned.error.status).json({ message: owned.error.message })

    const existing = await prisma.clientGoalProjectLink.findUnique({ where: { id } })
    if (!existing || existing.goalId !== goalId) {
      return res.status(404).json({ message: 'Goal-project link not found' })
    }

    await prisma.clientGoalProjectLink.delete({ where: { id } })
    res.json({ success: true, message: 'Goal-project link deleted' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// ══════════════════════════════════════════════════════════
// KPI SNAPSHOTS
// ══════════════════════════════════════════════════════════

exports.createKpiSnapshot = async (req, res) => {
  try {
    const clientId = req.user.clientId
    const { goalId } = req.params
    const {
      quarter,
      year,
      progressPct,
      achievementPct,
      linkedProjectsCount,
      completedProjectsCount,
      status,
      notes,
      aiAnalysis
    } = req.body

    const owned = await getOwnedGoal(goalId, clientId)
    if (owned.error) return res.status(owned.error.status).json({ message: owned.error.message })

    if (!quarter || year === undefined) {
      return res.status(400).json({ message: 'Required fields: quarter, year' })
    }

    const snapshot = await prisma.clientKpiSnapshot.create({
      data: {
        quarter,
        year: Number(year),
        progressPct: progressPct || 0,
        achievementPct: achievementPct || 0,
        linkedProjectsCount: linkedProjectsCount || 0,
        completedProjectsCount: completedProjectsCount || 0,
        status: status || 'ON_TRACK',
        notes,
        aiAnalysis,
        goalId
      }
    })

    res.json({ success: true, snapshot })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

exports.getKpiSnapshots = async (req, res) => {
  try {
    const clientId = req.user.clientId
    const { goalId } = req.params

    const owned = await getOwnedGoal(goalId, clientId)
    if (owned.error) return res.status(owned.error.status).json({ message: owned.error.message })

    const snapshots = await prisma.clientKpiSnapshot.findMany({
      where: { goalId },
      orderBy: [{ year: 'desc' }, { createdAt: 'desc' }]
    })

    res.json({ count: snapshots.length, snapshots })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

exports.updateKpiSnapshot = async (req, res) => {
  try {
    const clientId = req.user.clientId
    const { goalId, id } = req.params

    const owned = await getOwnedGoal(goalId, clientId)
    if (owned.error) return res.status(owned.error.status).json({ message: owned.error.message })

    const existing = await prisma.clientKpiSnapshot.findUnique({ where: { id } })
    if (!existing || existing.goalId !== goalId) {
      return res.status(404).json({ message: 'KPI snapshot not found' })
    }

    const data = { ...req.body }
    if (data.year !== undefined) data.year = Number(data.year)
    delete data.goalId

    const snapshot = await prisma.clientKpiSnapshot.update({ where: { id }, data })
    res.json({ success: true, snapshot })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

exports.deleteKpiSnapshot = async (req, res) => {
  try {
    const clientId = req.user.clientId
    const { goalId, id } = req.params

    const owned = await getOwnedGoal(goalId, clientId)
    if (owned.error) return res.status(owned.error.status).json({ message: owned.error.message })

    const existing = await prisma.clientKpiSnapshot.findUnique({ where: { id } })
    if (!existing || existing.goalId !== goalId) {
      return res.status(404).json({ message: 'KPI snapshot not found' })
    }

    await prisma.clientKpiSnapshot.delete({ where: { id } })
    res.json({ success: true, message: 'KPI snapshot deleted' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}
