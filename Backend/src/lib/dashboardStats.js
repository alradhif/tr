const prisma = require('../lib/prisma')

/** Approved TrackPlus donut labels — derived from real status + endDate. */
const UI_STATUS_BUCKETS = [
  { key: 'onTrack', label: 'على المسار', color: '#2E90FA' },
  { key: 'delayed', label: 'متأخر', color: '#F79009' },
  { key: 'stalled', label: 'متعثر', color: '#F04438' },
  { key: 'completed', label: 'مكتمل', color: '#17B26A' },
]

const RISK_BUCKET = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'high',
}

function monthKey(date) {
  return date
    .toLocaleString('en-US', { month: 'short' })
    .toUpperCase()
}

function emptyMonthBuckets() {
  const now = new Date()
  const months = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    months.push({
      key: `${d.getFullYear()}-${d.getMonth()}`,
      month: monthKey(d),
      low: 0,
      medium: 0,
      high: 0,
    })
  }
  return months
}

function classifyProjectUiStatus(status, endDate, now = new Date()) {
  const s = String(status || '').toUpperCase()
  if (s === 'COMPLETED') return 'completed'
  if (s === 'ON_HOLD' || s === 'CANCELLED') return 'stalled'
  if (endDate) {
    const end = new Date(endDate)
    if (!Number.isNaN(end.getTime()) && end < now && s === 'ACTIVE') return 'delayed'
  }
  return 'onTrack'
}

function projectListStatus(status, endDate) {
  const key = classifyProjectUiStatus(status, endDate)
  if (key === 'completed') return { status: 'completed', statusLabel: 'مكتمل' }
  if (key === 'stalled') return { status: 'stalled', statusLabel: 'متعثر' }
  if (key === 'delayed') return { status: 'late', statusLabel: 'متأخر' }
  return { status: 'on-track', statusLabel: 'على المسار' }
}

function buildUiStatusDistribution(projects) {
  const counts = { onTrack: 0, delayed: 0, stalled: 0, completed: 0 }
  for (const project of projects) {
    counts[classifyProjectUiStatus(project.status, project.endDate)] += 1
  }
  const total = Object.values(counts).reduce((a, b) => a + b, 0)
  if (!total) return []
  return UI_STATUS_BUCKETS.map((bucket) => ({
    label: bucket.label,
    value: Math.round((counts[bucket.key] / total) * 1000) / 10,
    color: bucket.color,
    count: counts[bucket.key],
  }))
}

async function platformProjectStats() {
  const [orgRows, clientRows] = await Promise.all([
    prisma.orgProject.findMany({
      select: { status: true, endDate: true, progressPct: true },
    }),
    prisma.clientProject.findMany({
      select: { status: true, endDate: true, progressPct: true },
    }),
  ])
  const rows = [...orgRows, ...clientRows]
  const statusCounts = {
    ACTIVE: 0,
    COMPLETED: 0,
    ON_HOLD: 0,
    CANCELLED: 0,
  }
  let progressSum = 0
  let progressN = 0
  for (const row of rows) {
    if (Object.prototype.hasOwnProperty.call(statusCounts, row.status)) {
      statusCounts[row.status] += 1
    }
    if (row.progressPct != null) {
      progressSum += row.progressPct
      progressN += 1
    }
  }
  return {
    totalProjects: rows.length,
    activeProjects: statusCounts.ACTIVE,
    completedProjects: statusCounts.COMPLETED,
    onHoldProjects: statusCounts.ON_HOLD,
    avgProgress: progressN ? Math.round(progressSum / progressN) : 0,
    projectStatuses: buildUiStatusDistribution(rows),
  }
}

async function loadProjectSubmitters(projects, { tableName, userModel }) {
  if (!projects.length) return {}
  const logs = await prisma.auditLog.findMany({
    where: {
      tableName,
      recordId: { in: projects.map((p) => p.id) },
      action: 'UPDATE',
    },
    orderBy: { createdAt: 'desc' },
    take: 80,
    select: { recordId: true, performedBy: true, newData: true },
  })
  const userIdByProject = {}
  for (const log of logs) {
    if (userIdByProject[log.recordId]) continue
    const payload = log.newData && typeof log.newData === 'object' ? log.newData : {}
    if (payload.approvalStatus === 'PENDING') userIdByProject[log.recordId] = log.performedBy
  }
  const userIds = [...new Set(Object.values(userIdByProject))]
  if (userIds.length === 0) return {}
  const users = await userModel.findMany({
    where: { id: { in: userIds } },
    select: { id: true, name: true },
  })
  const nameById = Object.fromEntries(users.map((u) => [u.id, u.name]))
  return Object.fromEntries(
    Object.entries(userIdByProject).map(([projectId, userId]) => [projectId, nameById[userId] || null]),
  )
}

/**
 * Shared Org/Client project-portal dashboard payload.
 * @param {'ORG'|'CLIENT'} kind
 * @param {string} accountId orgId or clientId
 * @param {{ role?: string }} [options]
 */
/** "منذ 3 ساعات"-style label for the dashboard alerts. */
function relativeTimeLabel(value, now = new Date()) {
  const minutes = Math.floor((now.getTime() - new Date(value).getTime()) / 60000)
  if (minutes < 1) return 'الآن'
  if (minutes < 60) return minutes === 1 ? 'منذ دقيقة' : minutes === 2 ? 'منذ دقيقتين' : `منذ ${minutes} دقيقة`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return hours === 1 ? 'منذ ساعة' : hours === 2 ? 'منذ ساعتين' : `منذ ${hours} ساعات`
  const days = Math.floor(hours / 24)
  if (days === 1) return 'أمس'
  if (days === 2) return 'منذ يومين'
  if (days < 7) return `منذ ${days} أيام`
  return new Date(value).toLocaleDateString('en-GB')
}

/** The dashboard shows three alerts, as in the design: one of each kind first, then the rest in order. */
function pickTodayAlerts(alerts, limit = 3) {
  const picked = []
  for (const type of ['approval', 'risk', 'deliverable']) {
    const first = alerts.find((alert) => alert.type === type)
    if (first) picked.push(first)
  }
  for (const alert of alerts) {
    if (picked.length >= limit) break
    if (!picked.includes(alert)) picked.push(alert)
  }
  return picked.slice(0, limit)
}

async function buildProjectPortalDashboard(kind, accountId, options = {}) {
  const isOrg = kind === 'ORG'
  const isManager = isOrg
    ? options.role === 'ORG_UPPER_MGMT' || options.role === 'SUPER_ADMIN'
    : options.role === 'CLIENT_UPPER_MGMT' || options.role === 'SUPER_ADMIN'
  const projectModel = isOrg ? prisma.orgProject : prisma.clientProject
  const riskModel = isOrg ? prisma.orgRisk : prisma.clientRisk
  const deliverableModel = isOrg ? prisma.orgDeliverable : prisma.clientDeliverable
  const changeModel = isOrg ? prisma.orgChangeRequest : prisma.clientChangeRequest
  // A null accountId covers every account of this kind (used by the Jodayn portal).
  const accountFilter = accountId == null ? {} : isOrg ? { orgId: accountId } : { clientId: accountId }
  const projectScope = accountId == null ? {} : { project: accountFilter }

  const now = new Date()
  const weekAhead = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1)

  const [
    totalProjects,
    activeProjects,
    completedProjects,
    onHoldProjects,
    cancelledProjects,
    pendingRequests,
    projects,
    statusRows,
    progressAgg,
    openRisks,
    risksRecent,
    activeDeliverables,
    recentDeliverables,
    pendingChangeRequests,
    highRisks,
    pendingProjectApprovals,
    pendingApprovalProjects,
  ] = await Promise.all([
    projectModel.count({ where: accountFilter }),
    projectModel.count({ where: { ...accountFilter, status: 'ACTIVE' } }),
    projectModel.count({ where: { ...accountFilter, status: 'COMPLETED' } }),
    projectModel.count({ where: { ...accountFilter, status: 'ON_HOLD' } }),
    projectModel.count({ where: { ...accountFilter, status: 'CANCELLED' } }),
    changeModel.count({ where: { ...projectScope, status: 'PENDING' } }),
    projectModel.findMany({
      where: accountFilter,
      orderBy: { updatedAt: 'desc' },
      take: 8,
      select: {
        id: true,
        name: true,
        status: true,
        endDate: true,
        progressPct: true,
        ...(isOrg
          ? { executingCompany: { select: { name: true } } }
          : { client: { select: { name: true } } }),
      },
    }),
    projectModel.findMany({
      where: accountFilter,
      select: { status: true, endDate: true },
    }),
    projectModel.aggregate({
      where: accountFilter,
      _avg: { progressPct: true },
    }),
    riskModel.findMany({
      where: { ...projectScope, status: 'ACTIVE' },
      select: { impact: true, probability: true },
    }),
    riskModel.findMany({
      where: { ...projectScope, createdAt: { gte: sixMonthsAgo } },
      select: { impact: true, createdAt: true },
    }),
    deliverableModel.count({
      where: { ...projectScope, status: 'ACTIVE' },
    }),
    deliverableModel.findMany({
      where: projectScope,
      orderBy: { updatedAt: 'desc' },
      take: 8,
      select: {
        id: true,
        name: true,
        projectId: true,
        project: { select: { name: true } },
        createdAt: true,
        status: true,
      },
    }),
    changeModel.findMany({
      where: { ...projectScope, status: 'PENDING' },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: { id: true, title: true, createdAt: true, projectId: true, project: { select: { name: true } } },
    }),
    riskModel.findMany({
      where: {
        ...projectScope,
        status: 'ACTIVE',
        impact: { in: ['HIGH', 'CRITICAL'] },
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: { id: true, name: true, impact: true, createdAt: true, projectId: true, project: { select: { name: true } } },
    }),
    isManager
      ? projectModel.count({ where: { ...accountFilter, approvalStatus: 'PENDING' } })
      : Promise.resolve(0),
    isManager
      ? projectModel.findMany({
          where: { ...accountFilter, approvalStatus: 'PENDING' },
          orderBy: { updatedAt: 'desc' },
          take: 8,
          select: {
            id: true,
            name: true,
            updatedAt: true,
            createdAt: true,
            manager: { select: { name: true } },
          },
        })
      : Promise.resolve([]),
  ])

  const openRiskCounts = { high: 0, medium: 0, low: 0 }
  for (const risk of openRisks) {
    const bucket = RISK_BUCKET[risk.impact] || 'medium'
    openRiskCounts[bucket] += 1
  }

  const monthBuckets = emptyMonthBuckets()
  const monthIndex = new Map(monthBuckets.map((m, i) => [m.key, i]))
  for (const risk of risksRecent) {
    const d = new Date(risk.createdAt)
    const key = `${d.getFullYear()}-${d.getMonth()}`
    const idx = monthIndex.get(key)
    if (idx == null) continue
    const bucket = RISK_BUCKET[risk.impact] || 'medium'
    monthBuckets[idx][bucket] += 1
  }

  const projectStatuses = buildUiStatusDistribution(statusRows)

  const deliverablesThisWeek = recentDeliverables.filter((d) => {
    const created = new Date(d.createdAt)
    return created >= new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) && created <= weekAhead
  }).length

  const submitterByProject = await loadProjectSubmitters(pendingApprovalProjects, {
    tableName: isOrg ? 'org_projects' : 'client_projects',
    userModel: isOrg ? prisma.orgUser : prisma.clientUser,
  })
  const projectBasePath = options.projectBasePath || (isOrg ? '/org/projects' : '/client/projects')

  const todayAlerts = pickTodayAlerts([
    ...pendingApprovalProjects.map((p) => {
      const submittedBy = submitterByProject[p.id] || p.manager?.name
      return {
        id: `project-approval-${p.id}`,
        type: 'approval',
        title: 'طلب مصادقة جديد',
        subtitle: submittedBy ? `${p.name} — ${submittedBy}` : p.name,
        time: relativeTimeLabel(p.updatedAt || p.createdAt, now),
        href: `${projectBasePath}/${p.id}`,
      }
    }),
    ...pendingChangeRequests.map((cr) => ({
      id: `cr-${cr.id}`,
      type: 'approval',
      title: 'طلب تغيير جديد',
      subtitle: `${cr.project?.name || 'مشروع'} — ${cr.title}`,
      time: relativeTimeLabel(cr.createdAt, now),
      href: `${projectBasePath}/${cr.projectId}`,
    })),
    ...highRisks.map((r) => ({
      id: `risk-${r.id}`,
      type: 'risk',
      title: r.impact === 'CRITICAL' ? 'خطر حرج جديد' : 'خطر مرتفع جديد',
      subtitle: `${r.project?.name || 'مشروع'} — ${r.name}`,
      time: relativeTimeLabel(r.createdAt, now),
      href: `${projectBasePath}/${r.projectId}`,
    })),
    ...recentDeliverables
      .filter((d) => d.status === 'ACTIVE')
      .map((d) => ({
        id: `del-${d.id}`,
        type: 'deliverable',
        title: 'مخرج قيد التنفيذ',
        subtitle: `${d.name} — ${d.project?.name || 'مشروع'}`,
        time: relativeTimeLabel(d.createdAt, now),
        href: `${projectBasePath}/${d.projectId}`,
      })),
  ])

  return {
    live: true,
    totalProjects,
    activeProjects,
    completedProjects,
    onHoldProjects,
    pendingRequests: pendingRequests + pendingProjectApprovals,
    pendingProjectApprovals,
    avgProgress: Math.round(progressAgg._avg.progressPct ?? 0),
    upcomingDeliverables: activeDeliverables,
    deliverablesThisWeek,
    openRisks: openRiskCounts,
    risksByMonth: monthBuckets.map(({ month, low, medium, high }) => ({
      month,
      low,
      medium,
      high,
    })),
    projectStatuses,
    todayAlerts,
    deliverables: recentDeliverables.map((d) => ({
      id: d.id,
      projectId: d.projectId,
      title: d.name,
      project: d.project?.name || '—',
    })),
    projects: projects.map((p) => {
      const mapped = projectListStatus(p.status, p.endDate)
      return {
        id: p.id,
        title: p.name,
        company: isOrg
          ? p.executingCompany?.name || '—'
          : p.client?.name || '—',
        progress: p.progressPct ?? 0,
        status: mapped.status,
        statusLabel: mapped.statusLabel,
      }
    }),
  }
}

/** Project-portfolio dashboard across every organization and client account. */
async function buildPlatformProjectDashboard() {
  const [org, client] = await Promise.all([
    buildProjectPortalDashboard('ORG', null, { projectBasePath: '/jodayn/projects/org' }),
    buildProjectPortalDashboard('CLIENT', null, { projectBasePath: '/jodayn/projects/client' }),
  ])
  const sum = (key) => (org[key] || 0) + (client[key] || 0)
  const totalProjects = sum('totalProjects')
  const statusByLabel = new Map()
  for (const row of [...org.projectStatuses, ...client.projectStatuses]) {
    const current = statusByLabel.get(row.label)
    statusByLabel.set(row.label, current ? { ...current, count: (current.count || 0) + (row.count || 0) } : { ...row })
  }
  const projectStatuses = [...statusByLabel.values()].map((row) => ({
    ...row,
    value: totalProjects ? Math.round(((row.count || 0) / totalProjects) * 1000) / 10 : 0,
  }))

  return {
    totalProjects,
    activeProjects: sum('activeProjects'),
    completedProjects: sum('completedProjects'),
    onHoldProjects: sum('onHoldProjects'),
    pendingRequests: sum('pendingRequests'),
    pendingProjectApprovals: 0,
    avgProgress: totalProjects
      ? Math.round((org.avgProgress * org.totalProjects + client.avgProgress * client.totalProjects) / totalProjects)
      : 0,
    upcomingDeliverables: sum('upcomingDeliverables'),
    deliverablesThisWeek: sum('deliverablesThisWeek'),
    openRisks: {
      high: org.openRisks.high + client.openRisks.high,
      medium: org.openRisks.medium + client.openRisks.medium,
      low: org.openRisks.low + client.openRisks.low,
    },
    risksByMonth: org.risksByMonth.map((month, i) => ({
      month: month.month,
      low: month.low + (client.risksByMonth[i]?.low || 0),
      medium: month.medium + (client.risksByMonth[i]?.medium || 0),
      high: month.high + (client.risksByMonth[i]?.high || 0),
    })),
    projectStatuses,
    todayAlerts: pickTodayAlerts([...org.todayAlerts, ...client.todayAlerts]),
    deliverables: [...org.deliverables, ...client.deliverables].slice(0, 8),
    projects: [...org.projects, ...client.projects].slice(0, 8),
  }
}

async function buildJodaynDashboard() {
  const now = new Date()
  const in30 = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

  const [
    sectorCount,
    orgCount,
    clientCount,
    activeOrgs,
    activeClients,
    inactiveOrgs,
    inactiveClients,
    invoiceCount,
    pendingInvoices,
    forecastCount,
    reportCount,
    recentOrgs,
    recentClients,
    endingSubs,
    packageGroups,
  ] = await Promise.all([
    prisma.sector.count(),
    prisma.orgAccount.count(),
    prisma.clientAccount.count(),
    prisma.orgAccount.count({ where: { isActive: true } }),
    prisma.clientAccount.count({ where: { isActive: true } }),
    prisma.orgAccount.count({ where: { isActive: false } }),
    prisma.clientAccount.count({ where: { isActive: false } }),
    prisma.invoice.count(),
    prisma.invoice.count({ where: { status: 'PENDING' } }),
    prisma.revenueForecast.count(),
    prisma.financialReport.count(),
    prisma.orgAccount.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: { id: true, name: true, isActive: true, createdAt: true },
    }),
    prisma.clientAccount.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: { id: true, name: true, isActive: true, createdAt: true },
    }),
    prisma.accountSubscription.findMany({
      where: {
        status: 'ACTIVE',
        endDate: { lte: in30, gte: now },
      },
      include: { package: true },
      take: 10,
    }),
    prisma.accountSubscription.groupBy({
      by: ['packageId'],
      where: { status: 'ACTIVE' },
      _count: { packageId: true },
    }),
  ])

  const invoices = await prisma.invoice.findMany({
    select: { totalWithVat: true, issueDate: true },
  })
  const totalRevenue = invoices.reduce((sum, invoice) => sum + Number(invoice.totalWithVat || 0), 0)
  const revenueNow = new Date()
  const revenueBuckets = []
  for (let i = 11; i >= 0; i -= 1) {
    const date = new Date(revenueNow.getFullYear(), revenueNow.getMonth() - i, 1)
    revenueBuckets.push({
      key: `${date.getFullYear()}-${date.getMonth()}`,
      month: monthKey(date),
      amount: 0,
    })
  }
  const revenueIndex = new Map(revenueBuckets.map((bucket, index) => [bucket.key, index]))
  for (const invoice of invoices) {
    const issued = new Date(invoice.issueDate)
    const key = `${issued.getFullYear()}-${issued.getMonth()}`
    const index = revenueIndex.get(key)
    if (index == null) continue
    revenueBuckets[index].amount += Number(invoice.totalWithVat || 0)
  }

  const projectStats = await platformProjectStats()

  const packages = await prisma.package.findMany({
    select: { id: true, name: true },
  })
  const pkgName = new Map(packages.map((p) => [p.id, p.name]))
  const planTotal = packageGroups.reduce((s, g) => s + g._count.packageId, 0) || 1
  const planColors = {
    FREE: '#A1A1AA',
    DEMO: '#2E90FA',
    BASIC: '#17B26A',
    PREMIUM: '#F79009',
    ENTERPRISE: '#7A5AF8',
  }

  const latestTenants = [
    ...recentOrgs.map((o) => ({
      id: `org-${o.id}`,
      name: o.name,
      status: o.isActive ? 'active' : 'suspended',
      statusLabel: o.isActive ? 'نشط' : 'معلق',
    })),
    ...recentClients.map((c) => ({
      id: `client-${c.id}`,
      name: c.name,
      status: c.isActive ? 'active' : 'suspended',
      statusLabel: c.isActive ? 'نشط' : 'معلق',
    })),
  ].slice(0, 8)

  return {
    live: true,
    portal: 'jodayn',
    sectorCount,
    orgAccounts: orgCount,
    clientAccounts: clientCount,
    invoiceCount,
    pendingInvoices,
    forecastCount,
    reportCount,
    // Map into SA tenant widget fields for shared widgets
    activeTenants: activeOrgs + activeClients,
    subscriptionsEndingSoon: endingSubs.length,
    tenantStatusBreakdown: [
      { name: 'نشط', value: activeOrgs + activeClients, color: '#17B26A' },
      { name: 'معلق', value: inactiveOrgs + inactiveClients, color: '#F04438' },
    ],
    tenantsByPlan: packageGroups.map((g) => {
      const name = pkgName.get(g.packageId) || '—'
      return {
        label: name,
        value: Math.round((g._count.packageId / planTotal) * 1000) / 10,
        color: planColors[name] || '#71717A',
        count: g._count.packageId,
      }
    }),
    latestTenants,
    tenantAlerts: endingSubs.map((s) => ({
      id: s.id,
      type: 'renewal',
      title: `اشتراك ${pkgName.get(s.packageId) || ''} ينتهي قريباً`,
      subtitle: s.accountType === 'ORG' ? 'حساب جهة' : 'حساب عميل',
      time: new Date(s.endDate).toLocaleDateString('ar-SA'),
    })),
    totalRevenue,
    revenueByMonth: revenueBuckets.map(({ month, amount }) => ({ month, amount })),
    latestActions: [
      { id: 'inv', title: `${invoiceCount} فاتورة مسجّلة` },
      { id: 'fc', title: `${forecastCount} توقّع إيراد` },
      { id: 'rp', title: `${reportCount} تقرير مالي` },
      { id: 'sec', title: `${sectorCount} قطاع` },
    ],
    ...projectStats,
    ...(await buildPlatformProjectDashboard()),
  }
}

const AUDIT_ACTION = { CREATE: 'إنشاء', UPDATE: 'تعديل', DELETE: 'حذف' }
const AUDIT_SUBJECT = {
  org_accounts: 'مستأجر',
  client_accounts: 'مستأجر',
  org_users: 'مستخدم',
  client_users: 'مستخدم',
  jodayn_users: 'مستخدم',
  packages: 'باقة',
  credentials: 'بيانات دخول',
}

function auditTitle(log) {
  const name = log.newData?.name || log.oldData?.name || ''
  return `${AUDIT_ACTION[log.action] || log.action} ${AUDIT_SUBJECT[log.tableName] || log.tableName}${name ? ` ${name}` : ''}`
}

const STATUS_COLORS = { active: '#17B26A', trial: '#F79009', suspended: '#F04438' }
const MONTH_NAMES = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر']

async function buildSuperAdminDashboard() {
  const now = new Date()
  const in30 = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

  const [orgs, clients, subscriptions, packages, auditLogs, pendingOrgUsers, pendingClientUsers] = await Promise.all([
    prisma.orgAccount.findMany({ orderBy: { createdAt: 'desc' }, select: { id: true, name: true, isActive: true, createdAt: true } }),
    prisma.clientAccount.findMany({ orderBy: { createdAt: 'desc' }, select: { id: true, name: true, isActive: true, createdAt: true } }),
    prisma.accountSubscription.findMany({ where: { status: { in: ['ACTIVE', 'DEMO'] } } }),
    prisma.package.findMany({ select: { id: true, name: true, label: true } }),
    prisma.auditLog.findMany({ orderBy: { createdAt: 'desc' }, take: 3 }),
    prisma.orgUser.findFirst({ where: { pendingActivation: true }, orderBy: { createdAt: 'desc' }, select: { name: true, createdAt: true, org: { select: { name: true } } } }),
    prisma.clientUser.findFirst({ where: { pendingActivation: true }, orderBy: { createdAt: 'desc' }, select: { name: true, createdAt: true, client: { select: { name: true } } } }),
  ])

  const packageById = new Map(packages.map((pkg) => [pkg.id, pkg]))
  const subByAccount = new Map(subscriptions.map((sub) => [sub.accountId, sub]))
  const accounts = [
    ...orgs.map((account) => ({ ...account, ref: `org-${account.id}` })),
    ...clients.map((account) => ({ ...account, ref: `client-${account.id}` })),
  ].map((account) => {
    const sub = subByAccount.get(account.id)
    const trial = packageById.get(sub?.packageId)?.name === 'DEMO'
    const status = !account.isActive ? 'suspended' : trial ? 'trial' : 'active'
    return { ...account, sub, status }
  })
  const STATUS_LABEL = { active: 'نشط', trial: 'تجربة', suspended: 'معلّق' }
  const countOf = (status) => accounts.filter((account) => account.status === status).length

  const planCounts = new Map()
  for (const sub of subscriptions) planCounts.set(sub.packageId, (planCounts.get(sub.packageId) || 0) + 1)
  const planTotal = subscriptions.length || 1
  const planColors = { FREE: '#A1A1AA', DEMO: '#8E8F97', BASIC: '#F04438', PREMIUM: '#F79009', ENTERPRISE: '#0C0C0D' }

  // Tenants on the platform at the end of each of the last 7 months, by current status.
  const tenantsByStatusMonth = Array.from({ length: 7 }, (_, index) => {
    const monthEnd = new Date(now.getFullYear(), now.getMonth() - 5 + index, 0, 23, 59, 59)
    const counted = accounts.filter((account) => new Date(account.sub?.startDate || account.createdAt) <= monthEnd)
    const of = (status) => counted.filter((account) => account.status === status).length
    return { month: MONTH_NAMES[monthEnd.getMonth()], active: of('active'), trial: of('trial'), suspended: of('suspended') }
  })

  const trialEnding = accounts
    .filter((account) => account.status === 'trial' && account.sub)
    .sort((a, b) => new Date(a.sub.endDate) - new Date(b.sub.endDate))[0]
  const pendingUser = pendingOrgUsers || pendingClientUsers
  const suspended = accounts.find((account) => account.status === 'suspended')
  const tenantAlerts = [
    trialEnding && {
      id: `trial-${trialEnding.id}`,
      type: 'renewal',
      title: `تجربة «${trialEnding.name}» تنتهي في ${new Date(trialEnding.sub.endDate).toISOString().slice(0, 10)}`,
      subtitle: 'Demo',
      time: relativeTimeLabel(trialEnding.sub.createdAt, now),
    },
    pendingUser && {
      id: 'unused-invite',
      type: 'unused-invite',
      title: 'دعوة تفعيل لم تُستخدم بعد',
      subtitle: `${pendingUser.name} · ${pendingUser.org?.name || pendingUser.client?.name || ''}`,
      time: relativeTimeLabel(pendingUser.createdAt, now),
    },
    suspended && {
      id: `suspended-${suspended.id}`,
      type: 'trial-expired',
      title: `اشتراك «${suspended.name}» معلّق`,
      subtitle: packageById.get(suspended.sub?.packageId)?.label || '—',
      time: relativeTimeLabel(suspended.createdAt, now),
    },
  ].filter(Boolean)

  const projectStats = await platformProjectStats()

  return {
    live: true,
    portal: 'superadmin',
    activeTenants: countOf('active'),
    subscriptionsEndingSoon: subscriptions.filter((sub) => sub.endDate >= now && sub.endDate <= in30).length,
    totalRevenue: subscriptions.reduce((total, sub) => total + Number(sub.paidAmount || 0), 0),
    tenantStatusBreakdown: ['suspended', 'trial', 'active'].map((status) => ({
      name: STATUS_LABEL[status],
      value: countOf(status),
      color: STATUS_COLORS[status],
    })),
    tenantsByStatusMonth,
    tenantsByPlan: [...planCounts.entries()]
      .map(([packageId, count]) => {
        const pkg = packageById.get(packageId)
        return {
          label: pkg?.label || pkg?.name || '—',
          value: Math.round((count / planTotal) * 1000) / 10,
          color: planColors[pkg?.name] || '#71717A',
          count,
        }
      })
      .sort((a, b) => b.count - a.count),
    latestTenants: accounts.slice(0, 3).map((account) => ({
      id: account.ref,
      name: account.name,
      status: account.status,
      statusLabel: STATUS_LABEL[account.status],
    })),
    latestActions: auditLogs.map((log) => ({ id: log.id, title: auditTitle(log) })),
    tenantAlerts,
    ...projectStats,
  }
}

module.exports = {
  buildProjectPortalDashboard,
  buildJodaynDashboard,
  buildSuperAdminDashboard,
}
