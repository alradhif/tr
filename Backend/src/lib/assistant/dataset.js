const prisma = require('../prisma')

/**
 * Loads what the signed-in user may see into plain records. Every query is scoped to the
 * user's own organization or client, exactly as their portal pages are; Jodayn and Super Admin
 * see the accounts they oversee. Statuses use the same rules and labels as the portal screens.
 */

const PROJECT_STATUS = {
  COMPLETED: { key: 'done', label: 'مكتمل' },
  ON_HOLD: { key: 'delay', label: 'تأخير' },
  CANCELLED: { key: 'blocked', label: 'متعثر' },
  ACTIVE: { key: 'track', label: 'على المسار' },
}
const APPROVAL_LABEL = { DRAFT: 'مسودة', PENDING: 'بانتظار الاعتماد', APPROVED: 'معتمد', REJECTED: 'مرفوض' }
const LEVEL_LABEL = { LOW: 'منخفض', MEDIUM: 'متوسط', HIGH: 'عالي', CRITICAL: 'حرج' }
const LEVEL_RANK = { LOW: 1, MEDIUM: 2, HIGH: 3, CRITICAL: 4 }
const RISK_STATUS_LABEL = { ACTIVE: 'نشط', MITIGATING: 'قيد المعالجة', CLOSED: 'مغلق' }
const REQUEST_LABEL = { PENDING: 'قيد الانتظار', UNDER_REVIEW: 'قيد المراجعة', APPROVED: 'معتمد', REJECTED: 'مرفوض' }
const REVIEW_LABEL = { NOT_SUBMITTED: 'لم يُرسل', PENDING: 'بانتظار الاعتماد', CHANGES_REQUESTED: 'مطلوب تعديل', APPROVED: 'معتمد' }
const GOAL_LABEL = { completed: 'مكتمل', delayed: 'متأخر', stalled: 'متعثر', onTrack: 'على المسار' }
const INVOICE_LABEL = { PENDING: 'مستحقة', PAID: 'مدفوعة', OVERDUE: 'متأخرة', CANCELLED: 'ملغاة' }

const num = (value) => (value === null || value === undefined ? null : Number(value))

function goalStatus(goal, now) {
  const status = String(goal.status || '').toUpperCase()
  if (status === 'ACHIEVED') return 'completed'
  if (status === 'MISSED') return 'delayed'
  if (status === 'NOT_STARTED') return 'stalled'
  if (goal.endDate && new Date(goal.endDate) < now) return 'delayed'
  return 'onTrack'
}

function paymentState(payment, now) {
  if (payment.paidAt) return 'paid'
  return new Date(payment.dueDate) < now ? 'overdue' : 'due'
}

function mapProject(p, extra = {}) {
  const status = PROJECT_STATUS[p.status] || PROJECT_STATUS.ACTIVE
  return {
    kind: 'project',
    id: p.id,
    name: p.name,
    type: p.type,
    description: p.description,
    statusKey: status.key,
    statusLabel: status.label,
    approval: p.approvalStatus,
    approvalLabel: APPROVAL_LABEL[p.approvalStatus] || p.approvalStatus,
    rejectionReason: p.rejectionReason,
    progress: num(p.progressPct) ?? 0,
    budget: num(p.budget),
    start: p.startDate,
    end: p.endDate,
    manager: p.orgProjectManagerName || p.clientProjectManagerName || p.manager?.name || null,
    company: p.executingCompany?.name || null,
    department: p.department?.name || null,
    owner: extra.owner || null,
    deliverables: (p.deliverables || []).map((d) => ({
      name: d.name,
      done: d.status === 'COMPLETED',
      progress: num(d.progressPct) ?? 0,
      review: d.reviewStatus || null,
      reviewLabel: d.reviewStatus ? REVIEW_LABEL[d.reviewStatus] : null,
      price: num(d.price),
      project: p.name,
    })),
    risks: (p.risks || []).map((r) => ({
      name: r.name,
      probability: r.probability,
      impact: r.impact,
      severity: Math.max(LEVEL_RANK[r.probability] || 0, LEVEL_RANK[r.impact] || 0),
      status: r.status,
      statusLabel: RISK_STATUS_LABEL[r.status] || r.status,
      open: r.status !== 'CLOSED',
      responsible: r.responsibleName,
      phone: r.responsiblePhone,
      email: r.responsibleEmail,
      project: p.name,
    })),
    changeRequests: (p.changeRequests || []).map((c) => ({
      title: c.title,
      status: c.status,
      statusLabel: REQUEST_LABEL[c.status] || c.status,
      priority: c.priority,
      impactOnCost: c.impactOnCost || null,
      impactOnSchedule: c.impactOnSchedule,
      project: p.name,
    })),
    contracts: (p.contracts || []).map((c) => c.name),
    goals: (p.goalLinks || []).map((link) => link.goal?.title).filter(Boolean),
  }
}

/** Same progress the goals pages show: organizations count approved deliverables of linked projects. */
function goalProgress(g, executive) {
  if (executive) {
    const deliverables = (g.projectLinks || []).flatMap((link) => link.project?.deliverables || [])
    const approved = deliverables.filter((d) => d.reviewStatus === 'APPROVED').length
    return deliverables.length ? Math.round((approved / deliverables.length) * 100) : 0
  }
  return num(g.achievementPct) ?? num(g.progressPct) ?? 0
}

function mapGoal(g, now, owner, executive = false) {
  const key = goalStatus(g, now)
  return {
    kind: 'goal',
    id: g.id,
    name: g.title,
    description: g.description,
    statusKey: key,
    statusLabel: GOAL_LABEL[key],
    progress: goalProgress(g, executive),
    start: g.startDate,
    end: g.endDate,
    approved: Boolean(g.approvedAt),
    requiredOutputs: g.requiredOutputsCount,
    projects: (g.projectLinks || []).map((link) => link.project?.name).filter(Boolean),
    owner: owner || null,
  }
}

const projectInclude = (isOrg) => ({
  ...(isOrg ? { executingCompany: { select: { name: true } }, department: { select: { name: true } } } : {}),
  manager: { select: { name: true } },
  deliverables: { select: { name: true, status: true, progressPct: true, price: true, ...(isOrg ? { reviewStatus: true } : {}) } },
  risks: true,
  changeRequests: { select: { title: true, status: true, priority: true, impactOnCost: true, impactOnSchedule: true } },
  contracts: { select: { name: true } },
  goalLinks: { select: { goal: { select: { title: true } } } },
})

const goalInclude = { projectLinks: { select: { project: { select: { name: true } } } } }
const orgGoalInclude = { projectLinks: { select: { project: { select: { name: true, deliverables: { select: { reviewStatus: true } } } } } } }

async function loadOrg(user, now) {
  const scope = { orgId: user.orgId }
  const [projects, goals, payments, companies, departments] = await Promise.all([
    prisma.orgProject.findMany({ where: scope, include: projectInclude(true), orderBy: { createdAt: 'desc' } }),
    prisma.orgStrategicGoal.findMany({ where: scope, include: orgGoalInclude, orderBy: { createdAt: 'desc' } }),
    prisma.orgProjectPayment.findMany({
      where: scope,
      include: { project: { select: { name: true } }, company: { select: { name: true } } },
      orderBy: { dueDate: 'asc' },
    }),
    prisma.executingCompany.findMany({ where: scope, include: { projects: { select: { name: true, status: true } } } }),
    prisma.department.findMany({ where: scope, include: { projects: { select: { name: true, status: true } } } }),
  ])
  return {
    portal: 'ORG',
    projects: projects.map((p) => mapProject(p)),
    goals: goals.map((g) => mapGoal(g, now, null, true)),
    payments: payments.map((p) => ({
      kind: 'payment',
      id: p.id,
      name: p.title || p.invoiceNumber,
      number: p.invoiceNumber,
      amount: num(p.amount) ?? 0,
      due: p.dueDate,
      paidAt: p.paidAt,
      state: paymentState(p, now),
      project: p.project?.name || null,
      party: p.company?.name || null,
    })),
    companies: companies.map((c) => entityRecord('company', c)),
    departments: departments.map((d) => entityRecord('department', d)),
  }
}

function entityRecord(kind, e) {
  return {
    kind,
    id: e.id,
    name: e.name,
    manager: e.managerName || e.responsibleName || null,
    email: e.email,
    phone: e.phone,
    sector: e.sector || e.type || null,
    size: kind === 'company' ? e.teamCount : e.employeeCount,
    active: e.isActive !== false,
    projects: (e.projects || []).map((p) => ({ name: p.name, statusLabel: (PROJECT_STATUS[p.status] || PROJECT_STATUS.ACTIVE).label })),
  }
}

async function loadClient(user, now) {
  const scope = { clientId: user.clientId }
  const [projects, goals] = await Promise.all([
    prisma.clientProject.findMany({ where: scope, include: projectInclude(false), orderBy: { createdAt: 'desc' } }),
    prisma.clientStrategicGoal.findMany({ where: scope, include: goalInclude, orderBy: { createdAt: 'desc' } }),
  ])
  return { portal: 'CLIENT', projects: projects.map((p) => mapProject(p)), goals: goals.map((g) => mapGoal(g, now)), payments: [], companies: [], departments: [] }
}

function mapInvoice(i, now) {
  const late = i.status !== 'PAID' && i.status !== 'CANCELLED' && new Date(i.dueDate) < now
  const state = i.status === 'PAID' ? 'paid' : i.status === 'CANCELLED' ? 'cancelled' : late || i.status === 'OVERDUE' ? 'overdue' : 'due'
  return {
    kind: 'payment',
    id: i.id,
    name: i.invoiceNumber,
    number: i.invoiceNumber,
    amount: num(i.totalWithVat) ?? num(i.amount) ?? 0,
    remaining: num(i.remainingAmount),
    due: i.dueDate,
    paidAt: i.status === 'PAID' ? i.updatedAt : null,
    state,
    statusLabel: INVOICE_LABEL[i.status] || i.status,
    project: i.projectName || null,
    party: i.clientName || i.org?.name || i.client?.name || null,
  }
}

async function loadJodayn(user, now) {
  const [orgProjects, clientProjects, orgGoals, clientGoals, invoices, departments, orgs, clients] = await Promise.all([
    prisma.orgProject.findMany({ include: { ...projectInclude(true), org: { select: { name: true } } } }),
    prisma.clientProject.findMany({ include: { ...projectInclude(false), client: { select: { name: true } } } }),
    prisma.orgStrategicGoal.findMany({ include: { ...goalInclude, org: { select: { name: true } } } }),
    prisma.clientStrategicGoal.findMany({ include: { ...goalInclude, client: { select: { name: true } } } }),
    prisma.invoice.findMany({ include: { org: { select: { name: true } }, client: { select: { name: true } } }, orderBy: { dueDate: 'asc' } }),
    prisma.department.findMany({ include: { projects: { select: { name: true, status: true } } } }),
    prisma.orgAccount.findMany({ select: { id: true, name: true, isActive: true, region: true, contractStatus: true } }),
    prisma.clientAccount.findMany({ select: { id: true, name: true, isActive: true, region: true, contractStatus: true } }),
  ])
  return {
    portal: 'JODAYN',
    projects: [
      ...orgProjects.map((p) => mapProject(p, { owner: p.org?.name })),
      ...clientProjects.map((p) => mapProject(p, { owner: p.client?.name })),
    ],
    goals: [...orgGoals.map((g) => mapGoal(g, now, g.org?.name)), ...clientGoals.map((g) => mapGoal(g, now, g.client?.name))],
    payments: invoices.map((i) => mapInvoice(i, now)),
    companies: [],
    departments: departments.map((d) => entityRecord('department', d)),
    accounts: [...orgs.map((a) => ({ ...a, type: 'جهة' })), ...clients.map((a) => ({ ...a, type: 'عميل' }))].map((a) => ({
      kind: 'account',
      id: a.id,
      name: a.name,
      type: a.type,
      active: a.isActive,
      region: a.region,
      contract: a.contractStatus,
    })),
  }
}

async function loadSuperAdmin(now) {
  const [orgs, clients, subscriptions, packages, orgUsers, clientUsers] = await Promise.all([
    prisma.orgAccount.findMany({ select: { id: true, name: true, isActive: true, region: true, contractStatus: true } }),
    prisma.clientAccount.findMany({ select: { id: true, name: true, isActive: true, region: true, contractStatus: true } }),
    prisma.accountSubscription.findMany({ include: { package: { select: { label: true, name: true } } } }),
    prisma.package.findMany({ select: { name: true, label: true, price: true, maxUsers: true, isActive: true } }),
    prisma.orgUser.count(),
    prisma.clientUser.count(),
  ])
  const names = new Map([...orgs, ...clients].map((a) => [a.id, a.name]))
  return {
    portal: 'SUPER_ADMIN',
    projects: [],
    goals: [],
    payments: [],
    companies: [],
    departments: [],
    accounts: [...orgs.map((a) => ({ ...a, type: 'جهة' })), ...clients.map((a) => ({ ...a, type: 'عميل' }))].map((a) => ({
      kind: 'account',
      id: a.id,
      name: a.name,
      type: a.type,
      active: a.isActive,
      region: a.region,
      contract: a.contractStatus,
    })),
    subscriptions: subscriptions.map((s) => ({
      account: names.get(s.accountId) || '—',
      packageName: s.package?.label || s.package?.name,
      status: s.status,
      end: s.endDate,
      expiringSoon: s.status === 'ACTIVE' && new Date(s.endDate) - now < 30 * 86400000,
    })),
    packages: packages.map((p) => ({ name: p.label || p.name, price: num(p.price), maxUsers: p.maxUsers, active: p.isActive })),
    userCount: orgUsers + clientUsers,
  }
}

async function loadDataset(user) {
  const now = new Date()
  if (user.type === 'ORG') return loadOrg(user, now)
  if (user.type === 'CLIENT') return loadClient(user, now)
  if (user.type === 'JODAYN') return loadJodayn(user, now)
  return loadSuperAdmin(now)
}

module.exports = { loadDataset, LEVEL_LABEL, LEVEL_RANK, REVIEW_LABEL }
