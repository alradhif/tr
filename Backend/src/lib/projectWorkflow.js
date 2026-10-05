const prisma = require('./prisma')
const { createForUsers } = require('./notify')

const KINDS = {
  ORG: {
    project: () => prisma.orgProject,
    deliverable: () => prisma.orgDeliverable,
    user: () => prisma.orgUser,
    scopeKey: 'orgId',
    upperRole: 'ORG_UPPER_MGMT',
    entryRole: 'ORG_DATA_ENTRY',
    basePath: '/org/projects',
  },
  CLIENT: {
    project: () => prisma.clientProject,
    deliverable: () => prisma.clientDeliverable,
    user: () => prisma.clientUser,
    scopeKey: 'clientId',
    upperRole: 'CLIENT_UPPER_MGMT',
    entryRole: 'CLIENT_DATA_ENTRY',
    basePath: '/client/projects',
  },
}

const PROJECT_STATUSES = ['ACTIVE', 'ON_HOLD', 'COMPLETED', 'CANCELLED']

// Columns a project form may write. Everything else (scope, approval fields, ids) is server-owned.
const EDITABLE_FIELDS = {
  ORG: [
    'name', 'type', 'classification', 'description', 'startDate', 'endDate', 'budget', 'profitMargin',
    'managerId', 'departmentId', 'executingCompanyId', 'orgProjectManagerName', 'clientProjectManagerName',
    'orgEmail', 'clientEmail', 'orgPhone', 'clientPhone', 'criticalPath', 'status', 'progressPct',
  ],
  CLIENT: [
    'name', 'type', 'classification', 'description', 'startDate', 'endDate', 'budget', 'profit', 'profitMargin',
    'managerId', 'orgProjectManagerName', 'clientProjectManagerName', 'orgEmail', 'clientEmail', 'orgPhone',
    'clientPhone', 'criticalPath', 'status', 'progressPct',
  ],
}

function httpError(status, message) {
  return Object.assign(new Error(message), { status })
}

/**
 * Builds the update payload for a project. Status and progress are management decisions,
 * so Data Entry cannot change them; the manager must belong to the same account.
 */
async function buildProjectUpdate(kind, body, existing, role) {
  const cfg = KINDS[kind]
  const data = {}
  for (const key of EDITABLE_FIELDS[kind]) {
    if (body[key] !== undefined) data[key] = body[key]
  }
  const isManager = role === cfg.upperRole || role === 'SUPER_ADMIN'
  if (!isManager) {
    delete data.status
    delete data.progressPct
  }
  if (data.status !== undefined && !PROJECT_STATUSES.includes(data.status)) {
    throw httpError(400, 'Invalid project status')
  }
  if (data.progressPct !== undefined) {
    const pct = Number(data.progressPct)
    if (!Number.isFinite(pct) || pct < 0 || pct > 100) throw httpError(400, 'progressPct must be between 0 and 100')
    data.progressPct = Math.round(pct)
  }
  for (const key of ['startDate', 'endDate']) {
    if (data[key] === undefined) continue
    const date = new Date(data[key])
    if (!data[key] || Number.isNaN(date.getTime())) throw httpError(400, `Invalid ${key}`)
    data[key] = date
  }
  const start = data.startDate || existing.startDate
  const end = data.endDate || existing.endDate
  if (start && end && new Date(end) < new Date(start)) throw httpError(400, 'تاريخ النهاية يجب أن يكون بعد تاريخ البداية')
  for (const key of ['budget', 'profit', 'profitMargin']) {
    if (data[key] === undefined) continue
    if (data[key] === '' || data[key] === null) data[key] = 0
    if (!Number.isFinite(Number(data[key])) || Number(data[key]) < 0) throw httpError(400, `Invalid ${key}`)
  }
  for (const key of ['departmentId', 'executingCompanyId']) {
    if (data[key] === '') data[key] = null
  }
  if (data.name !== undefined && !String(data.name).trim()) throw httpError(400, 'اسم المشروع مطلوب')
  if (data.managerId) {
    const manager = await cfg.user().findUnique({ where: { id: data.managerId } })
    if (!manager || manager[cfg.scopeKey] !== existing[cfg.scopeKey]) {
      throw httpError(400, 'Invalid manager: must belong to the same account')
    }
  }
  if (kind === 'ORG') {
    if (data.departmentId) {
      const dept = await prisma.department.findUnique({ where: { id: data.departmentId } })
      if (!dept || dept.orgId !== existing.orgId) throw httpError(400, 'Invalid department')
    }
    if (data.executingCompanyId) {
      const company = await prisma.executingCompany.findUnique({ where: { id: data.executingCompanyId } })
      if (!company || company.orgId !== existing.orgId) throw httpError(400, 'Invalid executing company')
    }
  }
  return data
}

/** Submission goes to every upper manager of the account plus the project's assigned manager. */
async function notifyProjectSubmitted(kind, project, submitterName) {
  const cfg = KINDS[kind]
  const approvers = await cfg.user().findMany({
    where: { [cfg.scopeKey]: project[cfg.scopeKey], role: cfg.upperRole, isActive: true },
    select: { id: true },
  })
  const managerIsApprover = await cfg.user().findFirst({
    where: { id: project.managerId, role: cfg.upperRole, isActive: true },
    select: { id: true },
  })
  await createForUsers(
    [...approvers.map((user) => user.id), managerIsApprover?.id],
    kind,
    {
      title: 'مشروع بانتظار الموافقة',
      message: `أرسل ${submitterName || 'مدخل البيانات'} المشروع «${project.name}» للموافقة`,
      type: 'APPROVAL',
      link: `${cfg.basePath}/${project.id}`,
    },
  )
}

/** The decision goes back to whoever submitted the project (or all data entry users if unknown). */
async function notifyProjectDecision(kind, project, decision, reason) {
  const cfg = KINDS[kind]
  let recipients = project.submittedById ? [project.submittedById] : []
  if (recipients.length === 0) {
    const entries = await cfg.user().findMany({
      where: { [cfg.scopeKey]: project[cfg.scopeKey], role: cfg.entryRole, isActive: true },
      select: { id: true },
    })
    recipients = entries.map((user) => user.id)
  }
  const approved = decision === 'APPROVED'
  await createForUsers(recipients, kind, {
    title: approved ? 'تم اعتماد المشروع' : 'أُعيد المشروع للتعديل',
    message: approved
      ? `تم اعتماد المشروع «${project.name}»`
      : `تم رفض المشروع «${project.name}» وإعادته للتعديل: ${reason}`,
    type: approved ? 'APPROVAL' : 'REJECTION',
    link: `${cfg.basePath}/${project.id}`,
  })
}

/**
 * Progress is derived from deliverables: the average of their progress, where a completed
 * deliverable counts as 100%. Projects without deliverables keep their stored value.
 */
async function recomputeProjectProgress(kind, projectId) {
  const cfg = KINDS[kind]
  const deliverables = await cfg.deliverable().findMany({
    where: { projectId },
    select: { status: true, progressPct: true },
  })
  if (deliverables.length === 0) return null
  const total = deliverables.reduce(
    (sum, item) => sum + (item.status === 'COMPLETED' ? 100 : Math.max(0, Math.min(100, item.progressPct || 0))),
    0,
  )
  const progressPct = Math.round(total / deliverables.length)
  await cfg.project().update({ where: { id: projectId }, data: { progressPct } })
  return progressPct
}

/** Spent budget = price of completed deliverables; committed = price of all deliverables. */
async function projectFinancials(kind, projectId, budget) {
  const cfg = KINDS[kind]
  const deliverables = await cfg.deliverable().findMany({
    where: { projectId },
    select: { status: true, price: true },
  })
  const spent = deliverables
    .filter((item) => item.status === 'COMPLETED')
    .reduce((sum, item) => sum + Number(item.price || 0), 0)
  const committed = deliverables.reduce((sum, item) => sum + Number(item.price || 0), 0)
  const total = Number(budget || 0)
  return { budget: total, spent, committed, remaining: Math.max(0, total - spent) }
}

const DELIVERABLE_STATUSES = ['ACTIVE', 'COMPLETED']

/** Validates deliverable status/progress/price; completing a deliverable sets it to 100%. */
function normalizeDeliverableInput(data) {
  const out = { ...data }
  if (out.status !== undefined && out.status !== null) {
    if (!DELIVERABLE_STATUSES.includes(out.status)) throw httpError(400, 'Invalid deliverable status')
  } else {
    delete out.status
  }
  if (out.progressPct !== undefined && out.progressPct !== null) {
    const pct = Number(out.progressPct)
    if (!Number.isFinite(pct) || pct < 0 || pct > 100) throw httpError(400, 'progressPct must be between 0 and 100')
    out.progressPct = Math.round(pct)
  }
  if (out.price !== undefined && out.price !== null && out.price !== '') {
    if (!Number.isFinite(Number(out.price)) || Number(out.price) < 0) throw httpError(400, 'Invalid price')
  }
  if (out.status === 'COMPLETED') out.progressPct = 100
  return out
}

/**
 * Route guard for writes to a project's sub-records (phases, risks, deliverables, ...).
 * Data Entry cannot change a project while it waits for management approval.
 */
function nestedWriteGuard(kind) {
  const cfg = KINDS[kind]
  return async (req, res, next) => {
    try {
      if (req.user.role !== cfg.entryRole) return next()
      const project = await cfg.project().findUnique({
        where: { id: req.params.projectId },
        select: { approvalStatus: true },
      })
      if (project?.approvalStatus === 'PENDING') {
        return res.status(403).json({ message: 'لا يمكن تعديل المشروع أثناء انتظار الموافقة' })
      }
      next()
    } catch (err) {
      res.status(500).json({ message: err.message })
    }
  }
}

module.exports = {
  KINDS,
  normalizeDeliverableInput,
  nestedWriteGuard,
  PROJECT_STATUSES,
  buildProjectUpdate,
  httpError,
  notifyProjectDecision,
  notifyProjectSubmitted,
  projectFinancials,
  recomputeProjectProgress,
}
