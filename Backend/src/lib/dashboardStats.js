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
async function buildProjectPortalDashboard(kind, accountId, options = {}) {
  const isOrg = kind === 'ORG'
  const isManager = isOrg
    ? options.role === 'ORG_UPPER_MGMT' || options.role === 'SUPER_ADMIN'
    : options.role === 'CLIENT_UPPER_MGMT' || options.role === 'SUPER_ADMIN'
  const projectModel = isOrg ? prisma.orgProject : prisma.clientProject
  const riskModel = isOrg ? prisma.orgRisk : prisma.clientRisk
  const deliverableModel = isOrg ? prisma.orgDeliverable : prisma.clientDeliverable
  const changeModel = isOrg ? prisma.orgChangeRequest : prisma.clientChangeRequest
  const accountFilter = isOrg ? { orgId: accountId } : { clientId: accountId }
  const projectScope = { project: accountFilter }

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
        project: { select: { name: true } },
        createdAt: true,
        status: true,
      },
    }),
    changeModel.findMany({
      where: { ...projectScope, status: 'PENDING' },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: { id: true, title: true, createdAt: true },
    }),
    riskModel.findMany({
      where: {
        ...projectScope,
        status: 'ACTIVE',
        impact: { in: ['HIGH', 'CRITICAL'] },
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: { id: true, name: true, impact: true, createdAt: true },
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
  const projectBasePath = isOrg ? '/org/projects' : '/client/projects'

  const todayAlerts = [
    ...pendingApprovalProjects.map((p) => ({
      id: `project-approval-${p.id}`,
      type: 'approval',
      title: p.name,
      subtitle: 'مشروع بانتظار موافقتك',
      submittedBy: submitterByProject[p.id] || p.manager?.name || null,
      time: new Date(p.updatedAt || p.createdAt).toLocaleDateString('ar-SA'),
      href: `${projectBasePath}/${p.id}`,
      projectId: p.id,
      canDecide: true,
    })),
    ...pendingChangeRequests.map((cr) => ({
      id: `cr-${cr.id}`,
      type: 'approval',
      title: cr.title,
      subtitle: 'طلب تغيير بانتظار الموافقة',
      time: new Date(cr.createdAt).toLocaleDateString('ar-SA'),
    })),
    ...highRisks.map((r) => ({
      id: `risk-${r.id}`,
      type: 'risk',
      title: r.name,
      subtitle: `مخاطرة ${r.impact === 'CRITICAL' ? 'حرجة' : 'مرتفعة'}`,
      time: new Date(r.createdAt).toLocaleDateString('ar-SA'),
    })),
    ...recentDeliverables
      .filter((d) => d.status === 'ACTIVE')
      .slice(0, 3)
      .map((d) => ({
        id: `del-${d.id}`,
        type: 'deliverable',
        title: d.name,
        subtitle: d.project?.name || 'مخرج نشط',
        time: new Date(d.createdAt).toLocaleDateString('ar-SA'),
      })),
  ].slice(0, 8)

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
  }
}

async function buildSuperAdminDashboard() {
  const now = new Date()
  const in30 = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

  const [
    activeOrgs,
    activeClients,
    inactiveOrgs,
    inactiveClients,
    endingSubs,
    packageGroups,
    recentOrgs,
    recentClients,
    auditLogs,
  ] = await Promise.all([
    prisma.orgAccount.count({ where: { isActive: true } }),
    prisma.clientAccount.count({ where: { isActive: true } }),
    prisma.orgAccount.count({ where: { isActive: false } }),
    prisma.clientAccount.count({ where: { isActive: false } }),
    prisma.accountSubscription.findMany({
      where: { status: 'ACTIVE', endDate: { lte: in30, gte: now } },
      include: { package: true },
    }),
    prisma.accountSubscription.groupBy({
      by: ['packageId'],
      where: { status: 'ACTIVE' },
      _count: { packageId: true },
    }),
    prisma.orgAccount.findMany({
      orderBy: { createdAt: 'desc' },
      take: 6,
      select: { id: true, name: true, isActive: true },
    }),
    prisma.clientAccount.findMany({
      orderBy: { createdAt: 'desc' },
      take: 6,
      select: { id: true, name: true, isActive: true },
    }),
    prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 8,
      select: { id: true, action: true, tableName: true, createdAt: true },
    }),
  ])

  const projectStats = await platformProjectStats()

  const packages = await prisma.package.findMany({ select: { id: true, name: true } })
  const pkgName = new Map(packages.map((p) => [p.id, p.name]))
  const planTotal = packageGroups.reduce((s, g) => s + g._count.packageId, 0) || 1
  const planColors = {
    FREE: '#A1A1AA',
    DEMO: '#2E90FA',
    BASIC: '#17B26A',
    PREMIUM: '#F79009',
    ENTERPRISE: '#7A5AF8',
  }

  return {
    live: true,
    portal: 'superadmin',
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
    latestTenants: [
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
    ].slice(0, 8),
    latestActions: auditLogs.map((log) => ({
      id: log.id,
      title: `${log.action} — ${log.tableName}`,
    })),
    tenantAlerts: endingSubs.slice(0, 8).map((s) => ({
      id: s.id,
      type: 'renewal',
      title: `اشتراك ${pkgName.get(s.packageId) || ''} ينتهي خلال 30 يوماً`,
      subtitle: s.accountType,
      time: new Date(s.endDate).toLocaleDateString('ar-SA'),
    })),
    ...projectStats,
    // Explicitly NOT setting totalRevenue / subscriptionsRevenueByMonth
  }
}

module.exports = {
  buildProjectPortalDashboard,
  buildJodaynDashboard,
  buildSuperAdminDashboard,
}
