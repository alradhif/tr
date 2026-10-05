const prisma = require('./prisma')

const UI_ONLY_KEYS = [
  'stages',
  'phases',
  'outputs',
  'parties',
  'ui',
  'uiStatus',
  'executingEntity',
  'category',
  'contractNumber',
  'contractingEntity',
  'contractDate',
  'contractEndDate',
  'contractStatus',
  'contractValue',
  'contractStartDate',
  'totalBudget',
  'scopeMain',
  'scopeExcluded',
  'deliverables',
  'assumptions',
  'constraints',
  'attachments',
]

function safeDate(value, fallback) {
  if (!value) return fallback ? new Date(fallback) : null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? (fallback ? new Date(fallback) : null) : date
}

function uiSnapshot(body) {
  return JSON.stringify({
    uiStatus: body.uiStatus || '',
    executingEntity: body.executingEntity || '',
    contractNumber: body.contractNumber || '',
    contractingEntity: body.contractingEntity || '',
    contractDate: body.contractDate || '',
    contractEndDate: body.contractEndDate || '',
    contractStatus: body.contractStatus || '',
    contractValue: body.contractValue || '',
    contractStartDate: body.contractStartDate || '',
    totalBudget: body.totalBudget || '',
    parties: body.parties || [],
    stages: body.stages || [],
    outputs: body.outputs || [],
    scopeMain: body.scopeMain || '',
    scopeExcluded: body.scopeExcluded || '',
    deliverables: body.deliverables || [],
    assumptions: body.assumptions || [],
    constraints: body.constraints || [],
    attachments: body.attachments || [],
  })
}

function stripUiFields(body) {
  const data = { ...body }
  for (const key of UI_ONLY_KEYS) delete data[key]
  return data
}

const DETAIL_MODELS = {
  ORG: { phase: () => prisma.orgProjectPhase, deliverable: () => prisma.orgDeliverable, team: () => prisma.orgProjectTeamMember, project: () => prisma.orgProject },
  CLIENT: { phase: () => prisma.clientProjectPhase, deliverable: () => prisma.clientDeliverable, team: () => prisma.clientProjectTeamMember, project: () => prisma.clientProject },
}

/**
 * Saves the form-only parts of a project (stages, outputs, parties and the UI snapshot).
 * Each list is replaced only when the request actually sends it, so a partial update such as a
 * status change never deletes the project's phases, deliverables or team.
 */
async function saveProjectDetails(kind, projectId, body) {
  const models = DETAIL_MODELS[kind]
  if (Array.isArray(body.stages)) {
    await models.phase().deleteMany({ where: { projectId } })
    for (const stage of body.stages) {
      const startDate = safeDate(stage.startDate, body.startDate)
      const endDate = safeDate(stage.endDate, body.endDate)
      if (!startDate || !endDate) continue
      await models.phase().create({
        data: {
          title: stage.name || stage.title || 'مرحلة',
          startDate,
          endDate,
          scope: stage.status || '',
          notes: JSON.stringify(stage.activities || []),
          projectId,
        },
      })
    }
  }

  if (Array.isArray(body.outputs)) {
    await models.deliverable().deleteMany({ where: { projectId } })
    for (const output of body.outputs) {
      if (!output?.name) continue
      await models.deliverable().create({
        data: {
          name: output.name,
          description: output.description || output.stage || '',
          projectId,
        },
      })
    }
  }

  if (Array.isArray(body.parties)) {
    await models.team().deleteMany({ where: { projectId, source: 'FORM' } })
    for (const party of body.parties) {
      const parts = String(party).split('·').map((part) => part.trim()).filter(Boolean)
      await models.team().create({
        data: {
          name: parts[0] || String(party),
          email: parts.find((part) => part.includes('@')) || null,
          role: 'طرف مشروع',
          source: 'FORM',
          projectId,
        },
      })
    }
  }

  if (UI_ONLY_KEYS.some((key) => body[key] !== undefined)) {
    await models.project().update({
      where: { id: projectId },
      data: { criticalPath: uiSnapshot(body) },
    })
  }
}

function saveOrgProjectDetails(projectId, body) {
  return saveProjectDetails('ORG', projectId, body)
}

function saveClientProjectDetails(projectId, body) {
  return saveProjectDetails('CLIENT', projectId, body)
}

module.exports = {
  stripUiFields,
  saveOrgProjectDetails,
  saveClientProjectDetails,
}
