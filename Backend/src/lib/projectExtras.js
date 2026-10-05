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

async function saveOrgProjectDetails(projectId, body) {
  const stages = Array.isArray(body.stages) ? body.stages : []
  await prisma.orgProjectPhase.deleteMany({ where: { projectId } })
  for (const stage of stages) {
    const startDate = safeDate(stage.startDate, body.startDate)
    const endDate = safeDate(stage.endDate, body.endDate)
    if (!startDate || !endDate) continue
    await prisma.orgProjectPhase.create({
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

  const outputs = Array.isArray(body.outputs) ? body.outputs : []
  await prisma.orgDeliverable.deleteMany({ where: { projectId } })
  for (const output of outputs) {
    if (!output?.name) continue
    await prisma.orgDeliverable.create({
      data: {
        name: output.name,
        description: output.description || output.stage || '',
        projectId,
      },
    })
  }

  const parties = Array.isArray(body.parties) ? body.parties : []
  await prisma.orgProjectTeamMember.deleteMany({ where: { projectId } })
  for (const party of parties) {
    const parts = String(party).split('·').map((part) => part.trim()).filter(Boolean)
    await prisma.orgProjectTeamMember.create({
      data: {
        name: parts[0] || String(party),
        email: parts.find((part) => part.includes('@')) || null,
        role: 'طرف مشروع',
        source: 'FORM',
        projectId,
      },
    })
  }

  await prisma.orgProject.update({
    where: { id: projectId },
    data: { criticalPath: uiSnapshot(body) },
  })
}

async function saveClientProjectDetails(projectId, body) {
  const stages = Array.isArray(body.stages) ? body.stages : []
  await prisma.clientProjectPhase.deleteMany({ where: { projectId } })
  for (const stage of stages) {
    const startDate = safeDate(stage.startDate, body.startDate)
    const endDate = safeDate(stage.endDate, body.endDate)
    if (!startDate || !endDate) continue
    await prisma.clientProjectPhase.create({
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

  const outputs = Array.isArray(body.outputs) ? body.outputs : []
  await prisma.clientDeliverable.deleteMany({ where: { projectId } })
  for (const output of outputs) {
    if (!output?.name) continue
    await prisma.clientDeliverable.create({
      data: {
        name: output.name,
        description: output.description || output.stage || '',
        projectId,
      },
    })
  }

  const parties = Array.isArray(body.parties) ? body.parties : []
  await prisma.clientProjectTeamMember.deleteMany({ where: { projectId } })
  for (const party of parties) {
    const parts = String(party).split('·').map((part) => part.trim()).filter(Boolean)
    await prisma.clientProjectTeamMember.create({
      data: {
        name: parts[0] || String(party),
        email: parts.find((part) => part.includes('@')) || null,
        role: 'طرف مشروع',
        source: 'FORM',
        projectId,
      },
    })
  }

  await prisma.clientProject.update({
    where: { id: projectId },
    data: { criticalPath: uiSnapshot(body) },
  })
}

module.exports = {
  stripUiFields,
  saveOrgProjectDetails,
  saveClientProjectDetails,
}
