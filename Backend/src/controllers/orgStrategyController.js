const prisma = require('../lib/prisma')

// ============ STRATEGY DOCUMENTS ============

exports.getDocuments = async (req, res) => {
  try {
    const orgId = req.user.orgId

    const documents = await prisma.orgStrategyDocument.findMany({
      where: { orgId },
      include: { goals: true },
      orderBy: { createdAt: 'desc' }
    })

    res.json({ count: documents.length, documents })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

exports.createDocument = async (req, res) => {
  try {
    const orgId = req.user.orgId
    const { title, fileUrl, fileType, status } = req.body

    if (!title || !fileUrl) {
      return res.status(400).json({ message: 'Required fields: title, fileUrl' })
    }

    const document = await prisma.orgStrategyDocument.create({
      data: {
        title,
        fileUrl,
        fileType,
        status,
        orgId,
        uploadedBy: req.user.userId
      }
    })

    res.json({ success: true, document })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

exports.getDocumentById = async (req, res) => {
  try {
    const orgId = req.user.orgId
    const { id } = req.params

    const document = await prisma.orgStrategyDocument.findUnique({
      where: { id },
      include: {
        goals: {
          include: {
            stages: true,
            projectLinks: true,
            kpiSnapshots: true
          }
        }
      }
    })

    if (!document) {
      return res.status(404).json({ message: 'Document not found' })
    }
    if (document.orgId !== orgId) {
      return res.status(403).json({ message: 'Access denied' })
    }

    res.json({ document })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

exports.updateDocument = async (req, res) => {
  try {
    const orgId = req.user.orgId
    const { id } = req.params

    const existing = await prisma.orgStrategyDocument.findUnique({ where: { id } })
    if (!existing) return res.status(404).json({ message: 'Document not found' })
    if (existing.orgId !== orgId) return res.status(403).json({ message: 'Access denied' })

    const data = { ...req.body }
    delete data.orgId
    delete data.uploadedBy
    delete data.id

    const document = await prisma.orgStrategyDocument.update({
      where: { id },
      data
    })

    res.json({ success: true, document })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

exports.deleteDocument = async (req, res) => {
  try {
    const orgId = req.user.orgId
    const { id } = req.params

    const existing = await prisma.orgStrategyDocument.findUnique({ where: { id } })
    if (!existing) return res.status(404).json({ message: 'Document not found' })
    if (existing.orgId !== orgId) return res.status(403).json({ message: 'Access denied' })

    await prisma.orgStrategyDocument.delete({ where: { id } })

    res.json({ success: true, message: 'Document deleted' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// ============ STRATEGIC GOALS ============

exports.getGoals = async (req, res) => {
  try {
    const orgId = req.user.orgId
    const { documentId } = req.query

    const where = { orgId }
    if (documentId) where.documentId = documentId

    const goals = await prisma.orgStrategicGoal.findMany({
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

exports.getDocumentGoals = async (req, res) => {
  try {
    const orgId = req.user.orgId
    const { documentId } = req.params

    const document = await prisma.orgStrategyDocument.findUnique({ where: { id: documentId } })
    if (!document) return res.status(404).json({ message: 'Document not found' })
    if (document.orgId !== orgId) return res.status(403).json({ message: 'Access denied' })

    const goals = await prisma.orgStrategicGoal.findMany({
      where: { documentId, orgId },
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

exports.createGoal = async (req, res) => {
  try {
    const orgId = req.user.orgId
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
      aiSummary
    } = req.body

    let documentId = req.body.documentId
    if (!documentId) {
      let document = await prisma.orgStrategyDocument.findFirst({ where: { orgId } })
      if (!document) {
        document = await prisma.orgStrategyDocument.create({
          data: {
            title: 'الخطة الاستراتيجية',
            fileUrl: 'demo://strategy',
            fileType: 'demo',
            status: 'EXTRACTED',
            orgId,
            uploadedBy: req.user.userId,
          },
        })
      }
      documentId = document.id
    }

    if (!title) {
      return res.status(400).json({ message: 'اسم الهدف مطلوب' })
    }

    const document = await prisma.orgStrategyDocument.findUnique({ where: { id: documentId } })
    if (!document) return res.status(404).json({ message: 'Document not found' })
    if (document.orgId !== orgId) return res.status(403).json({ message: 'Access denied' })

    const goal = await prisma.orgStrategicGoal.create({
      data: {
        documentId,
        orgId,
        title,
        description,
        requiredOutputsCount: requiredOutputsCount ?? 0,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        status,
        progressPct: progressPct ?? 0,
        achievementPct: achievementPct ?? 0,
        isAiExtracted: isAiExtracted !== undefined ? isAiExtracted : true,
        aiSummary
      }
    })

    res.json({ success: true, goal })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

exports.createDocumentGoal = async (req, res) => {
  try {
    const orgId = req.user.orgId
    const { documentId } = req.params
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
      aiSummary
    } = req.body

    if (!title) {
      return res.status(400).json({ message: 'Required field: title' })
    }

    const document = await prisma.orgStrategyDocument.findUnique({ where: { id: documentId } })
    if (!document) return res.status(404).json({ message: 'Document not found' })
    if (document.orgId !== orgId) return res.status(403).json({ message: 'Access denied' })

    const goal = await prisma.orgStrategicGoal.create({
      data: {
        documentId,
        orgId,
        title,
        description,
        requiredOutputsCount: requiredOutputsCount ?? 0,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        status,
        progressPct: progressPct ?? 0,
        achievementPct: achievementPct ?? 0,
        isAiExtracted: isAiExtracted !== undefined ? isAiExtracted : true,
        aiSummary
      }
    })

    res.json({ success: true, goal })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

exports.getGoalById = async (req, res) => {
  try {
    const orgId = req.user.orgId
    const { id } = req.params

    const goal = await prisma.orgStrategicGoal.findUnique({
      where: { id },
      include: {
        stages: true,
        projectLinks: { include: { project: { select: { id: true, name: true } } } },
        kpiSnapshots: true,
        document: { select: { id: true, title: true } }
      }
    })

    if (!goal) return res.status(404).json({ message: 'Goal not found' })
    if (goal.orgId !== orgId) return res.status(403).json({ message: 'Access denied' })

    res.json({ goal })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

exports.updateGoal = async (req, res) => {
  try {
    const orgId = req.user.orgId
    const { id } = req.params

    const existing = await prisma.orgStrategicGoal.findUnique({ where: { id } })
    if (!existing) return res.status(404).json({ message: 'Goal not found' })
    if (existing.orgId !== orgId) return res.status(403).json({ message: 'Access denied' })

    const data = { ...req.body }
    if (data.startDate) data.startDate = new Date(data.startDate)
    if (data.endDate) data.endDate = new Date(data.endDate)
    delete data.orgId
    delete data.documentId
    delete data.id

    const goal = await prisma.orgStrategicGoal.update({ where: { id }, data })
    res.json({ success: true, goal })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

exports.deleteGoal = async (req, res) => {
  try {
    const orgId = req.user.orgId
    const { id } = req.params

    const existing = await prisma.orgStrategicGoal.findUnique({ where: { id } })
    if (!existing) return res.status(404).json({ message: 'Goal not found' })
    if (existing.orgId !== orgId) return res.status(403).json({ message: 'Access denied' })

    await prisma.orgStrategicGoal.delete({ where: { id } })
    res.json({ success: true, message: 'Goal deleted' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// ============ GOAL STAGES ============

exports.getStages = async (req, res) => {
  try {
    const orgId = req.user.orgId
    const { goalId } = req.params

    const goal = await prisma.orgStrategicGoal.findUnique({ where: { id: goalId } })
    if (!goal) return res.status(404).json({ message: 'Goal not found' })
    if (goal.orgId !== orgId) return res.status(403).json({ message: 'Access denied' })

    const stages = await prisma.orgStrategicGoalStage.findMany({
      where: { goalId },
      orderBy: { createdAt: 'asc' }
    })

    res.json({ count: stages.length, stages })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

exports.createStage = async (req, res) => {
  try {
    const orgId = req.user.orgId
    const { goalId } = req.params
    const { stageName, startDate, endDate, status, progressPct } = req.body

    if (!stageName) {
      return res.status(400).json({ message: 'Required field: stageName' })
    }

    const goal = await prisma.orgStrategicGoal.findUnique({ where: { id: goalId } })
    if (!goal) return res.status(404).json({ message: 'Goal not found' })
    if (goal.orgId !== orgId) return res.status(403).json({ message: 'Access denied' })

    const stage = await prisma.orgStrategicGoalStage.create({
      data: {
        stageName,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        status,
        progressPct: progressPct ?? 0,
        goalId
      }
    })

    res.json({ success: true, stage })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

exports.updateStage = async (req, res) => {
  try {
    const orgId = req.user.orgId
    const { goalId, id } = req.params

    const goal = await prisma.orgStrategicGoal.findUnique({ where: { id: goalId } })
    if (!goal) return res.status(404).json({ message: 'Goal not found' })
    if (goal.orgId !== orgId) return res.status(403).json({ message: 'Access denied' })

    const existing = await prisma.orgStrategicGoalStage.findUnique({ where: { id } })
    if (!existing || existing.goalId !== goalId) {
      return res.status(404).json({ message: 'Stage not found' })
    }

    const data = { ...req.body }
    if (data.startDate) data.startDate = new Date(data.startDate)
    if (data.endDate) data.endDate = new Date(data.endDate)
    delete data.goalId
    delete data.id

    const stage = await prisma.orgStrategicGoalStage.update({ where: { id }, data })
    res.json({ success: true, stage })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

exports.deleteStage = async (req, res) => {
  try {
    const orgId = req.user.orgId
    const { goalId, id } = req.params

    const goal = await prisma.orgStrategicGoal.findUnique({ where: { id: goalId } })
    if (!goal) return res.status(404).json({ message: 'Goal not found' })
    if (goal.orgId !== orgId) return res.status(403).json({ message: 'Access denied' })

    const existing = await prisma.orgStrategicGoalStage.findUnique({ where: { id } })
    if (!existing || existing.goalId !== goalId) {
      return res.status(404).json({ message: 'Stage not found' })
    }

    await prisma.orgStrategicGoalStage.delete({ where: { id } })
    res.json({ success: true, message: 'Stage deleted' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// ============ GOAL–PROJECT LINKS ============

exports.getGoalLinks = async (req, res) => {
  try {
    const orgId = req.user.orgId
    const { goalId } = req.params

    const goal = await prisma.orgStrategicGoal.findUnique({ where: { id: goalId } })
    if (!goal) return res.status(404).json({ message: 'Goal not found' })
    if (goal.orgId !== orgId) return res.status(403).json({ message: 'Access denied' })

    const links = await prisma.orgGoalProjectLink.findMany({
      where: { goalId },
      include: { project: { select: { id: true, name: true, status: true } } },
      orderBy: { createdAt: 'desc' }
    })

    res.json({ count: links.length, links })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

exports.createGoalLink = async (req, res) => {
  try {
    const orgId = req.user.orgId
    const { goalId } = req.params
    const {
      projectId,
      relevanceScore,
      aiNotes,
      isAiLinked,
      actionTaken,
      projectStatus
    } = req.body

    if (!projectId) {
      return res.status(400).json({ message: 'Required field: projectId' })
    }

    const goal = await prisma.orgStrategicGoal.findUnique({ where: { id: goalId } })
    if (!goal) return res.status(404).json({ message: 'Goal not found' })
    if (goal.orgId !== orgId) return res.status(403).json({ message: 'Access denied' })

    const project = await prisma.orgProject.findUnique({ where: { id: projectId } })
    if (!project || project.orgId !== orgId) {
      return res.status(400).json({ message: 'Invalid project: must belong to same org' })
    }

    const link = await prisma.orgGoalProjectLink.create({
      data: {
        goalId,
        projectId,
        relevanceScore: relevanceScore ?? 0,
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

exports.updateGoalLink = async (req, res) => {
  try {
    const orgId = req.user.orgId
    const { goalId, id } = req.params

    const goal = await prisma.orgStrategicGoal.findUnique({ where: { id: goalId } })
    if (!goal) return res.status(404).json({ message: 'Goal not found' })
    if (goal.orgId !== orgId) return res.status(403).json({ message: 'Access denied' })

    const existing = await prisma.orgGoalProjectLink.findUnique({ where: { id } })
    if (!existing || existing.goalId !== goalId) {
      return res.status(404).json({ message: 'Link not found' })
    }

    const data = { ...req.body }
    delete data.goalId
    delete data.projectId
    delete data.id

    const link = await prisma.orgGoalProjectLink.update({ where: { id }, data })
    res.json({ success: true, link })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

exports.deleteGoalLink = async (req, res) => {
  try {
    const orgId = req.user.orgId
    const { goalId, id } = req.params

    const goal = await prisma.orgStrategicGoal.findUnique({ where: { id: goalId } })
    if (!goal) return res.status(404).json({ message: 'Goal not found' })
    if (goal.orgId !== orgId) return res.status(403).json({ message: 'Access denied' })

    const existing = await prisma.orgGoalProjectLink.findUnique({ where: { id } })
    if (!existing || existing.goalId !== goalId) {
      return res.status(404).json({ message: 'Link not found' })
    }

    await prisma.orgGoalProjectLink.delete({ where: { id } })
    res.json({ success: true, message: 'Link deleted' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// ============ KPI SNAPSHOTS ============

exports.getKpiSnapshots = async (req, res) => {
  try {
    const orgId = req.user.orgId
    const { goalId } = req.params

    const goal = await prisma.orgStrategicGoal.findUnique({ where: { id: goalId } })
    if (!goal) return res.status(404).json({ message: 'Goal not found' })
    if (goal.orgId !== orgId) return res.status(403).json({ message: 'Access denied' })

    const snapshots = await prisma.orgKpiSnapshot.findMany({
      where: { goalId },
      orderBy: [{ year: 'desc' }, { quarter: 'desc' }]
    })

    res.json({ count: snapshots.length, snapshots })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

exports.createKpiSnapshot = async (req, res) => {
  try {
    const orgId = req.user.orgId
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

    if (!quarter || year === undefined) {
      return res.status(400).json({ message: 'Required fields: quarter, year' })
    }

    const goal = await prisma.orgStrategicGoal.findUnique({ where: { id: goalId } })
    if (!goal) return res.status(404).json({ message: 'Goal not found' })
    if (goal.orgId !== orgId) return res.status(403).json({ message: 'Access denied' })

    const snapshot = await prisma.orgKpiSnapshot.create({
      data: {
        quarter,
        year,
        progressPct: progressPct ?? 0,
        achievementPct: achievementPct ?? 0,
        linkedProjectsCount: linkedProjectsCount ?? 0,
        completedProjectsCount: completedProjectsCount ?? 0,
        status,
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

exports.updateKpiSnapshot = async (req, res) => {
  try {
    const orgId = req.user.orgId
    const { goalId, id } = req.params

    const goal = await prisma.orgStrategicGoal.findUnique({ where: { id: goalId } })
    if (!goal) return res.status(404).json({ message: 'Goal not found' })
    if (goal.orgId !== orgId) return res.status(403).json({ message: 'Access denied' })

    const existing = await prisma.orgKpiSnapshot.findUnique({ where: { id } })
    if (!existing || existing.goalId !== goalId) {
      return res.status(404).json({ message: 'KPI snapshot not found' })
    }

    const data = { ...req.body }
    delete data.goalId
    delete data.id

    const snapshot = await prisma.orgKpiSnapshot.update({ where: { id }, data })
    res.json({ success: true, snapshot })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

exports.deleteKpiSnapshot = async (req, res) => {
  try {
    const orgId = req.user.orgId
    const { goalId, id } = req.params

    const goal = await prisma.orgStrategicGoal.findUnique({ where: { id: goalId } })
    if (!goal) return res.status(404).json({ message: 'Goal not found' })
    if (goal.orgId !== orgId) return res.status(403).json({ message: 'Access denied' })

    const existing = await prisma.orgKpiSnapshot.findUnique({ where: { id } })
    if (!existing || existing.goalId !== goalId) {
      return res.status(404).json({ message: 'KPI snapshot not found' })
    }

    await prisma.orgKpiSnapshot.delete({ where: { id } })
    res.json({ success: true, message: 'KPI snapshot deleted' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}
