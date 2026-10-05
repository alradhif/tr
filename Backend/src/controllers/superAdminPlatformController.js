const prisma = require('../lib/prisma')
const bcrypt = require('bcryptjs')
const { writeAuditLog } = require('../lib/audit')
const { buildSuperAdminDashboard } = require('../lib/dashboardStats')
const { createInvitedUser, generateTemporaryPassword, USER_SELECT } = require('../lib/portalUsers')
const { createForUsers } = require('../lib/notify')
const { deleteProjectFiles } = require('./projectAttachmentsController')

const DAY_MS = 24 * 60 * 60 * 1000

const PORTAL_USERS = {
  ORG: { model: () => prisma.orgUser, scopeKey: 'orgId', table: 'org_users', prefix: 'ORG' },
  CLIENT: { model: () => prisma.clientUser, scopeKey: 'clientId', table: 'client_users', prefix: 'CLIENT' },
  JODAYN: { model: () => prisma.jodaynUser, scopeKey: null, table: 'jodayn_users', prefix: 'JODAYN' },
}

const ACCOUNTS = {
  org: {
    type: 'ORG',
    model: () => prisma.orgAccount,
    users: () => prisma.orgUser,
    scopeKey: 'orgId',
    table: 'org_accounts',
  },
  client: {
    type: 'CLIENT',
    model: () => prisma.clientAccount,
    users: () => prisma.clientUser,
    scopeKey: 'clientId',
    table: 'client_accounts',
  },
}

function fail(res, err) {
  res.status(err.status || 500).json({ message: err.message })
}

function httpError(status, message) {
  return Object.assign(new Error(message), { status })
}

function portalOf(value) {
  const key = String(value || '').toUpperCase()
  if (!PORTAL_USERS[key]) throw httpError(400, 'Invalid portal type')
  return key
}

function accountOf(type) {
  const cfg = ACCOUNTS[String(type || '').toLowerCase()]
  if (!cfg) throw httpError(400, 'Invalid account type')
  return cfg
}

function accessLevel(role) {
  return String(role || '').endsWith('_UPPER_MGMT') ? 'UPPER' : 'DATA_ENTRY'
}

function userStatus(user) {
  if (!user.isActive) return { status: 'suspended', statusLabel: 'معلق' }
  if (user.pendingActivation) return { status: 'pending', statusLabel: 'غير نشط' }
  return { status: 'active', statusLabel: 'نشط' }
}

// ============ DASHBOARD ============

exports.getDashboard = async (req, res) => {
  try {
    res.json(await buildSuperAdminDashboard())
  } catch (err) {
    fail(res, err)
  }
}

// ============ SUBSCRIPTIONS ============

function positiveInt(value) {
  const n = Number(value)
  return Number.isFinite(n) && n > 0 ? Math.round(n) : null
}

async function subscribe({ accountType, accountId, packageId, createdBy, userLimit, storageLimitGb, startDate }) {
  if (!packageId) return null
  const pkg = await prisma.package.findUnique({ where: { id: packageId } })
  if (!pkg || !pkg.isActive) throw httpError(400, 'الباقة المختارة غير متاحة')
  const start = startDate && !Number.isNaN(new Date(startDate).getTime()) ? new Date(startDate) : new Date()
  return prisma.accountSubscription.create({
    data: {
      accountType,
      accountId,
      packageId,
      startDate: start,
      endDate: new Date(start.getTime() + (pkg.duration || 365) * DAY_MS),
      status: 'ACTIVE',
      paidAmount: pkg.price,
      userLimit: positiveInt(userLimit) ?? pkg.maxUsers,
      storageLimitGb: positiveInt(storageLimitGb) ?? pkg.storageGb,
      createdBy,
    },
    include: { package: true },
  })
}

// ============ TENANTS ============

/**
 * Creates an organization, client or Jodayn tenant. Organization and client tenants also
 * get their first upper-management user with one-time initial credentials.
 */
exports.createTenant = async (req, res) => {
  try {
    const body = req.body || {}
    const tenantType = String(body.tenantType || '').toUpperCase()
    const name = String(body.name || '').trim()
    if (!['ORG', 'CLIENT', 'JODAYN'].includes(tenantType)) {
      return res.status(400).json({ message: 'نوع المستأجر مطلوب' })
    }
    if (!name) return res.status(400).json({ message: 'اسم الجهة مطلوب' })
    const managerName = String(body.managerName || '').trim()
    const managerEmail = String(body.managerEmail || '').trim().toLowerCase()
    if (!managerName || !managerEmail) {
      return res.status(400).json({ message: 'اسم وبريد مدير الحساب مطلوبان' })
    }

    if (tenantType === 'JODAYN') {
      const { user, temporaryPassword } = await createInvitedUser({
        type: 'JODAYN',
        name: managerName || name,
        email: managerEmail,
        role: 'JODAYN_UPPER_MGMT',
        invitedBy: req.user.userId,
        invitedByType: 'SUPER_ADMIN',
      })
      return res.json({ success: true, tenantType, jodaynUser: { ...user, tenantType }, temporaryPassword })
    }

    let sectorId = body.sectorId
    if (sectorId) {
      const sector = await prisma.sector.findUnique({ where: { id: sectorId } })
      if (!sector) return res.status(400).json({ message: 'القطاع غير موجود' })
    } else {
      const first = await prisma.sector.findFirst({ orderBy: { name: 'asc' } })
      if (!first) return res.status(400).json({ message: 'أنشئ قطاعاً أولاً قبل إضافة مستأجر' })
      sectorId = first.id
    }

    const common = {
      name,
      branch: body.branch || body.region || null,
      entityType: body.entityType || null,
      region: body.region || body.branch || null,
      phone: body.phone || null,
      crNumber: body.crNumber || null,
      sectorId,
      contractDuration: body.contractDuration != null ? String(body.contractDuration) : null,
      contractStatus: 'ACTIVE',
      createdBy: req.user.userId,
    }
    const cfg = tenantType === 'ORG' ? ACCOUNTS.org : ACCOUNTS.client
    // Check the manager email before creating anything so a duplicate does not leave a half-made tenant
    const emailUsed = await Promise.all([
      prisma.orgUser.findUnique({ where: { email: managerEmail } }),
      prisma.clientUser.findUnique({ where: { email: managerEmail } }),
      prisma.jodaynUser.findUnique({ where: { email: managerEmail } }),
      prisma.superAdmin.findUnique({ where: { email: managerEmail } }),
    ])
    if (emailUsed.some(Boolean)) return res.status(400).json({ message: 'البريد الإلكتروني مستخدم مسبقاً' })

    const account = await cfg.model().create({
      data: tenantType === 'ORG' ? { ...common, domain: body.domain || null } : { ...common, managerName },
      include: { sector: true },
    })
    let manager
    try {
      manager = await createInvitedUser({
        type: tenantType,
        name: managerName,
        email: managerEmail,
        role: `${tenantType}_UPPER_MGMT`,
        scopeId: account.id,
        invitedBy: req.user.userId,
        invitedByType: 'SUPER_ADMIN',
      })
    } catch (err) {
      await cfg.model().delete({ where: { id: account.id } }).catch(() => {})
      throw err
    }
    const subscription = await subscribe({
      accountType: tenantType,
      accountId: account.id,
      packageId: body.packageId,
      createdBy: req.user.userId,
      userLimit: body.userLimit,
      storageLimitGb: body.storageLimitGb,
      startDate: body.subscriptionStart,
    })
    await writeAuditLog({
      action: 'CREATE',
      tableName: cfg.table,
      recordId: account.id,
      newData: { name: account.name, manager: managerEmail, packageId: body.packageId || null },
      performedBy: req.user.userId,
      actorType: 'SUPER_ADMIN',
    })
    const payload = {
      ...account,
      tenantType,
      subscription,
      adminName: manager.user.name,
      adminEmail: manager.user.email,
    }
    res.json({
      success: true,
      tenantType,
      [tenantType === 'ORG' ? 'org' : 'client']: payload,
      manager: manager.user,
      temporaryPassword: manager.temporaryPassword,
    })
  } catch (err) {
    fail(res, err)
  }
}

async function storageUsedBytes(cfg, accountId) {
  const where = { project: { [cfg.scopeKey]: accountId } }
  const sum = (rows) => Number(rows?._sum?.fileSize || 0)
  if (cfg.type === 'ORG') {
    const [projectFiles, deliverableFiles, requestFiles] = await Promise.all([
      prisma.orgProjectAttachment.aggregate({ where, _sum: { fileSize: true } }),
      prisma.orgDeliverableAttachment.aggregate({ where: { deliverable: where }, _sum: { fileSize: true } }),
      prisma.orgChangeRequestAttachment.aggregate({ where: { request: where }, _sum: { fileSize: true } }),
    ])
    return sum(projectFiles) + sum(deliverableFiles) + sum(requestFiles)
  }
  const [projectFiles, deliverableFiles, requestFiles] = await Promise.all([
    prisma.clientProjectAttachment.aggregate({ where, _sum: { fileSize: true } }),
    prisma.clientDeliverableAttachment.aggregate({ where: { deliverable: where }, _sum: { fileSize: true } }),
    prisma.clientChangeRequestAttachment.aggregate({ where: { request: where }, _sum: { fileSize: true } }),
  ])
  return sum(projectFiles) + sum(deliverableFiles) + sum(requestFiles)
}

/** Full tenant view for the Super Admin details page: users, usage, subscription, last activity. */
exports.getAccountDetails = async (req, res) => {
  try {
    const cfg = accountOf(req.params.type)
    const account = await cfg.model().findUnique({ where: { id: req.params.id }, include: { sector: true } })
    if (!account) return res.status(404).json({ message: 'Account not found' })
    const [users, subscription, projectCount, storageBytes] = await Promise.all([
      cfg.users().findMany({ where: { [cfg.scopeKey]: account.id }, select: USER_SELECT, orderBy: { createdAt: 'asc' } }),
      prisma.accountSubscription.findFirst({
        where: { accountType: cfg.type, accountId: account.id, status: 'ACTIVE' },
        include: { package: true },
        orderBy: { createdAt: 'desc' },
      }),
      (cfg.type === 'ORG' ? prisma.orgProject : prisma.clientProject).count({ where: { [cfg.scopeKey]: account.id } }),
      storageUsedBytes(cfg, account.id),
    ])
    const lastActivity = await prisma.activityLog.findFirst({
      where: { userId: { in: users.map((user) => user.id) }, action: { in: ['LOGIN', 'FIRST_LOGIN'] } },
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true },
    })
    const admin = users.find((user) => user.role === `${cfg.type}_UPPER_MGMT`) || users[0]
    res.json({
      account: {
        ...account,
        tenantType: cfg.type,
        adminName: admin?.name || account.managerName || null,
        adminEmail: admin?.email || null,
        subscription,
      },
      users: users.map((user) => ({ ...user, accessLevel: accessLevel(user.role), ...userStatus(user) })),
      usage: {
        projects: projectCount,
        activeUsers: users.filter((user) => user.isActive && !user.pendingActivation).length,
        totalUsers: users.length,
        userLimit: subscription?.userLimit ?? subscription?.package?.maxUsers ?? null,
        storageBytes,
        storageLimitGb: subscription?.storageLimitGb ?? subscription?.package?.storageGb ?? null,
      },
      lastActivityAt: lastActivity?.createdAt || null,
    })
  } catch (err) {
    fail(res, err)
  }
}

const EDITABLE_ACCOUNT_FIELDS = ['name', 'domain', 'branch', 'entityType', 'region', 'phone', 'crNumber', 'managerName', 'sectorId', 'contractDuration']

exports.updateAccount = async (req, res) => {
  try {
    const cfg = accountOf(req.params.type)
    const current = await cfg.model().findUnique({ where: { id: req.params.id } })
    if (!current) return res.status(404).json({ message: 'Account not found' })
    const data = {}
    for (const key of EDITABLE_ACCOUNT_FIELDS) {
      if (req.body?.[key] === undefined) continue
      if (key === 'domain' && cfg.type !== 'ORG') continue
      if (key === 'managerName' && cfg.type !== 'CLIENT') continue
      data[key] = req.body[key] === '' ? null : req.body[key]
    }
    if (typeof req.body?.isActive === 'boolean') data.isActive = req.body.isActive
    if (data.name !== undefined && !String(data.name || '').trim()) return res.status(400).json({ message: 'اسم الجهة مطلوب' })
    if (data.sectorId) {
      const sector = await prisma.sector.findUnique({ where: { id: data.sectorId } })
      if (!sector) return res.status(400).json({ message: 'القطاع غير موجود' })
    } else delete data.sectorId
    if (data.contractDuration != null) data.contractDuration = String(data.contractDuration)
    const updated = await cfg.model().update({ where: { id: current.id }, data, include: { sector: true } })
    if (req.body?.packageId) {
      await prisma.accountSubscription.updateMany({
        where: { accountType: cfg.type, accountId: current.id, status: 'ACTIVE' },
        data: { status: 'CANCELLED' },
      })
      await subscribe({ accountType: cfg.type, accountId: current.id, packageId: req.body.packageId, createdBy: req.user.userId })
    }
    await writeAuditLog({
      action: 'UPDATE',
      tableName: cfg.table,
      recordId: current.id,
      oldData: Object.fromEntries(Object.keys(data).map((key) => [key, current[key]])),
      newData: { ...data, packageId: req.body?.packageId },
      performedBy: req.user.userId,
      actorType: 'SUPER_ADMIN',
    })
    res.json({ success: true, account: updated })
  } catch (err) {
    fail(res, err)
  }
}

/**
 * Permanently deletes an organization or client tenant with all of its data and uploaded files.
 * The request must repeat the tenant name as confirmation.
 */
exports.deleteAccount = async (req, res) => {
  try {
    const cfg = accountOf(req.params.type)
    const account = await cfg.model().findUnique({ where: { id: req.params.id } })
    if (!account) return res.status(404).json({ message: 'Account not found' })
    if (String(req.body?.confirmName || '').trim() !== account.name) {
      return res.status(400).json({ message: 'اكتب اسم الجهة لتأكيد الحذف' })
    }
    const scope = { [cfg.scopeKey]: account.id }
    const portal = cfg.type === 'ORG' ? 'org' : 'client'
    const projectModel = cfg.type === 'ORG' ? prisma.orgProject : prisma.clientProject
    const projects = await projectModel.findMany({ where: scope, select: { id: true } })
    const users = await cfg.users().findMany({ where: scope, select: { id: true } })
    const userIds = users.map((user) => user.id)

    const steps = cfg.type === 'ORG'
      ? [
          prisma.orgProject.deleteMany({ where: scope }),
          prisma.orgStrategicGoal.deleteMany({ where: scope }),
          prisma.orgStrategyDocument.deleteMany({ where: scope }),
          prisma.department.deleteMany({ where: scope }),
          prisma.executingCompany.deleteMany({ where: scope }),
        ]
      : [
          prisma.clientProject.deleteMany({ where: scope }),
          prisma.clientStrategicGoal.deleteMany({ where: scope }),
          prisma.clientStrategyDocument.deleteMany({ where: scope }),
        ]
    await prisma.$transaction([
      ...steps,
      prisma.invoice.deleteMany({ where: scope }),
      prisma.revenueForecast.deleteMany({ where: scope }),
      prisma.financialReport.deleteMany({ where: scope }),
      prisma.notification.deleteMany({ where: { userId: { in: userIds }, actorType: cfg.type } }),
      prisma.accountInvite.deleteMany({ where: { userId: { in: userIds } } }),
      prisma.loginChallenge.deleteMany({ where: { userId: { in: userIds } } }),
      prisma.passwordResetToken.deleteMany({ where: { userId: { in: userIds } } }),
      prisma.dashboardLayout.deleteMany({ where: { userId: { in: userIds } } }),
      cfg.users().deleteMany({ where: scope }),
      prisma.accountSubscription.deleteMany({ where: { accountType: cfg.type, accountId: account.id } }),
      cfg.model().delete({ where: { id: account.id } }),
    ])
    for (const project of projects) {
      await deleteProjectFiles(portal, project.id).catch(() => {})
    }
    await writeAuditLog({
      action: 'DELETE',
      tableName: cfg.table,
      recordId: account.id,
      oldData: { name: account.name, projects: projects.length, users: userIds.length },
      performedBy: req.user.userId,
      actorType: 'SUPER_ADMIN',
    })
    res.json({ success: true, deleted: { projects: projects.length, users: userIds.length } })
  } catch (err) {
    fail(res, err)
  }
}

/** Sends an in-app notification to every active user of a tenant. */
exports.notifyAccount = async (req, res) => {
  try {
    const cfg = accountOf(req.params.type)
    const title = String(req.body?.title || '').trim()
    const message = String(req.body?.message || '').trim()
    if (!title || !message) return res.status(400).json({ message: 'العنوان والرسالة مطلوبان' })
    const account = await cfg.model().findUnique({ where: { id: req.params.id } })
    if (!account) return res.status(404).json({ message: 'Account not found' })
    const users = await cfg.users().findMany({ where: { [cfg.scopeKey]: account.id, isActive: true }, select: { id: true } })
    await createForUsers(users.map((user) => user.id), cfg.type, { title, message, type: 'SYSTEM' })
    res.json({ success: true, recipients: users.length })
  } catch (err) {
    fail(res, err)
  }
}

function csvCell(value) {
  if (value === null || value === undefined) return ''
  const text = value instanceof Date ? value.toISOString() : String(value)
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

function toCsv(rows, columns) {
  return [columns.join(','), ...rows.map((row) => columns.map((column) => csvCell(row[column])).join(','))].join('\n')
}

/** Exports a tenant's users and projects as a UTF-8 CSV file. */
exports.exportAccount = async (req, res) => {
  try {
    const cfg = accountOf(req.params.type)
    const account = await cfg.model().findUnique({ where: { id: req.params.id } })
    if (!account) return res.status(404).json({ message: 'Account not found' })
    const scope = { [cfg.scopeKey]: account.id }
    const projectModel = cfg.type === 'ORG' ? prisma.orgProject : prisma.clientProject
    const [users, projects] = await Promise.all([
      cfg.users().findMany({ where: scope, select: USER_SELECT, orderBy: { createdAt: 'asc' } }),
      projectModel.findMany({
        where: scope,
        select: { id: true, name: true, status: true, approvalStatus: true, progressPct: true, budget: true, startDate: true, endDate: true },
        orderBy: { createdAt: 'asc' },
      }),
    ])
    const csv = [
      `# ${account.name}`,
      '# Users',
      toCsv(users.map((user) => ({ ...user, status: userStatus(user).statusLabel })), ['name', 'email', 'role', 'status', 'createdAt', 'lastLoginAt']),
      '',
      '# Projects',
      toCsv(projects, ['name', 'status', 'approvalStatus', 'progressPct', 'budget', 'startDate', 'endDate']),
    ].join('\n')
    res.setHeader('Content-Type', 'text/csv; charset=utf-8')
    res.setHeader('Content-Disposition', `attachment; filename="tenant-${account.id}.csv"`)
    res.send(`﻿${csv}`)
  } catch (err) {
    fail(res, err)
  }
}

// ============ USERS ACROSS PORTALS ============

exports.getPlatformUsers = async (req, res) => {
  try {
    const [orgUsers, clientUsers, jodaynUsers] = await Promise.all([
      prisma.orgUser.findMany({ select: { ...USER_SELECT, orgId: true, org: { select: { name: true } } } }),
      prisma.clientUser.findMany({ select: { ...USER_SELECT, clientId: true, client: { select: { name: true } } } }),
      prisma.jodaynUser.findMany({ select: USER_SELECT }),
    ])
    const shape = (portalType, accountName) => (user) => ({
      ...user,
      org: undefined,
      client: undefined,
      portalType,
      accessLevel: accessLevel(user.role),
      accountName: accountName(user),
      ...userStatus(user),
    })
    const users = [
      ...orgUsers.map(shape('ORG', (user) => user.org?.name || null)),
      ...clientUsers.map(shape('CLIENT', (user) => user.client?.name || null)),
      ...jodaynUsers.map(shape('JODAYN', () => 'جودين')),
    ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    res.json({ count: users.length, users })
  } catch (err) {
    fail(res, err)
  }
}

exports.createPlatformUser = async (req, res) => {
  try {
    const portalType = portalOf(req.body?.portalType)
    const cfg = PORTAL_USERS[portalType]
    const level = req.body?.accessLevel === 'UPPER' ? 'UPPER_MGMT' : req.body?.accessLevel === 'DATA_ENTRY' ? 'DATA_ENTRY' : null
    if (!level) return res.status(400).json({ message: 'مستوى الصلاحية مطلوب' })
    let scopeId = null
    if (cfg.scopeKey) {
      scopeId = req.body?.[cfg.scopeKey]
      const account = scopeId
        ? await (portalType === 'ORG' ? prisma.orgAccount : prisma.clientAccount).findUnique({ where: { id: scopeId } })
        : null
      if (!account) return res.status(400).json({ message: 'اختر الجهة التابع لها المستخدم' })
    }
    const { user, temporaryPassword } = await createInvitedUser({
      type: portalType,
      name: req.body?.name,
      email: req.body?.email,
      role: `${cfg.prefix}_${level}`,
      scopeId,
      invitedBy: req.user.userId,
      invitedByType: 'SUPER_ADMIN',
      initialPassword: req.body?.password ? String(req.body.password) : undefined,
    })
    res.json({
      success: true,
      user: { ...user, portalType, accessLevel: accessLevel(user.role), [cfg.scopeKey || 'scope']: scopeId, ...userStatus(user) },
      temporaryPassword,
    })
  } catch (err) {
    fail(res, err)
  }
}

/** Changes a user's access level and/or active flag from Super Admin. */
exports.updatePlatformUser = async (req, res) => {
  try {
    const portalType = portalOf(req.params.portal)
    const cfg = PORTAL_USERS[portalType]
    const current = await cfg.model().findUnique({ where: { id: req.params.id } })
    if (!current) return res.status(404).json({ message: 'User not found' })
    const data = {}
    if (req.body?.accessLevel) {
      if (!['UPPER', 'DATA_ENTRY'].includes(req.body.accessLevel)) return res.status(400).json({ message: 'Invalid access level' })
      data.role = `${cfg.prefix}_${req.body.accessLevel === 'UPPER' ? 'UPPER_MGMT' : 'DATA_ENTRY'}`
    }
    if (typeof req.body?.isActive === 'boolean') data.isActive = req.body.isActive
    if (typeof req.body?.name === 'string' && req.body.name.trim()) data.name = req.body.name.trim()
    if (!Object.keys(data).length) return res.status(400).json({ message: 'لا توجد تغييرات' })
    const user = await cfg.model().update({ where: { id: current.id }, data, select: USER_SELECT })
    await writeAuditLog({
      action: 'UPDATE',
      tableName: cfg.table,
      recordId: current.id,
      oldData: Object.fromEntries(Object.keys(data).map((key) => [key, current[key]])),
      newData: data,
      performedBy: req.user.userId,
      actorType: 'SUPER_ADMIN',
    })
    res.json({ success: true, user: { ...user, portalType, accessLevel: accessLevel(user.role), ...userStatus(user) } })
  } catch (err) {
    fail(res, err)
  }
}

/** Issues new one-time credentials; the account returns to "غير نشط" until its next first login. */
exports.resetPlatformUserCredentials = async (req, res) => {
  try {
    const portalType = portalOf(req.params.portal)
    const cfg = PORTAL_USERS[portalType]
    const current = await cfg.model().findUnique({ where: { id: req.params.id } })
    if (!current) return res.status(404).json({ message: 'User not found' })
    const temporaryPassword = generateTemporaryPassword()
    await cfg.model().update({
      where: { id: current.id },
      data: { password: await bcrypt.hash(temporaryPassword, 10), pendingActivation: true, activatedAt: null },
    })
    await writeAuditLog({
      action: 'UPDATE',
      tableName: cfg.table,
      recordId: current.id,
      newData: { credentialsReset: true },
      performedBy: req.user.userId,
      actorType: 'SUPER_ADMIN',
    })
    res.json({ success: true, user: { id: current.id, name: current.name, email: current.email }, temporaryPassword })
  } catch (err) {
    fail(res, err)
  }
}

// ============ PACKAGES ============

const BILLING_CYCLES = ['MONTHLY', 'YEARLY']

function packageInput(body, partial) {
  const data = {}
  const has = (key) => body[key] !== undefined && body[key] !== null && body[key] !== ''
  if (has('label')) data.label = String(body.label).trim()
  if (has('name')) data.name = String(body.name).trim().toUpperCase().replace(/\s+/g, '_')
  if (!partial && !data.name && data.label) data.name = data.label.toUpperCase().replace(/\s+/g, '_')
  if (!partial && !data.name) throw httpError(400, 'اسم الباقة مطلوب')
  if (has('packageType')) data.packageType = String(body.packageType)
  if (has('billingCycle')) {
    if (!BILLING_CYCLES.includes(body.billingCycle)) throw httpError(400, 'Invalid billing cycle')
    data.billingCycle = body.billingCycle
    data.duration = body.billingCycle === 'MONTHLY' ? 30 : 365
  }
  for (const key of ['price', 'maxUsers', 'maxProjects', 'storageGb', 'duration']) {
    if (!has(key)) continue
    const value = Number(body[key])
    if (!Number.isFinite(value) || value < 0) throw httpError(400, `Invalid ${key}`)
    data[key] = key === 'price' ? value : Math.round(value)
  }
  if (Array.isArray(body.features)) data.features = body.features.map(String)
  if (typeof body.isActive === 'boolean') data.isActive = body.isActive
  return data
}

async function withTenantCounts(packages) {
  const counts = await prisma.accountSubscription.groupBy({
    by: ['packageId'],
    where: { status: 'ACTIVE' },
    _count: { packageId: true },
  })
  const byId = new Map(counts.map((row) => [row.packageId, row._count.packageId]))
  return packages.map((pkg) => ({ ...pkg, tenants: byId.get(pkg.id) || 0 }))
}

exports.listAllPackages = async (req, res) => {
  try {
    const packages = await prisma.package.findMany({ orderBy: { price: 'asc' } })
    res.json({ packages: await withTenantCounts(packages) })
  } catch (err) {
    fail(res, err)
  }
}

exports.createPackage = async (req, res) => {
  try {
    const data = packageInput(req.body || {}, false)
    if (await prisma.package.findUnique({ where: { name: data.name } })) {
      return res.status(400).json({ message: 'توجد باقة بنفس الاسم' })
    }
    const pkg = await prisma.package.create({ data })
    await writeAuditLog({ action: 'CREATE', tableName: 'packages', recordId: pkg.id, newData: data, performedBy: req.user.userId, actorType: 'SUPER_ADMIN' })
    res.json({ success: true, package: { ...pkg, tenants: 0 } })
  } catch (err) {
    fail(res, err)
  }
}

exports.updatePackage = async (req, res) => {
  try {
    const current = await prisma.package.findUnique({ where: { id: req.params.id } })
    if (!current) return res.status(404).json({ message: 'Package not found' })
    const data = packageInput(req.body || {}, true)
    if (data.name && data.name !== current.name && (await prisma.package.findUnique({ where: { name: data.name } }))) {
      return res.status(400).json({ message: 'توجد باقة بنفس الاسم' })
    }
    const pkg = await prisma.package.update({ where: { id: current.id }, data })
    await writeAuditLog({ action: 'UPDATE', tableName: 'packages', recordId: pkg.id, newData: data, performedBy: req.user.userId, actorType: 'SUPER_ADMIN' })
    const [withCount] = await withTenantCounts([pkg])
    res.json({ success: true, package: withCount })
  } catch (err) {
    fail(res, err)
  }
}

/** A package that still has subscriptions is deactivated instead of deleted. */
exports.deletePackage = async (req, res) => {
  try {
    const current = await prisma.package.findUnique({ where: { id: req.params.id } })
    if (!current) return res.status(404).json({ message: 'Package not found' })
    const inUse = await prisma.accountSubscription.count({ where: { packageId: current.id } })
    if (inUse > 0) {
      return res.status(409).json({ message: `الباقة مرتبطة بـ ${inUse} اشتراك. عطّلها بدلاً من حذفها` })
    }
    await prisma.package.delete({ where: { id: current.id } })
    await writeAuditLog({ action: 'DELETE', tableName: 'packages', recordId: current.id, oldData: { name: current.name }, performedBy: req.user.userId, actorType: 'SUPER_ADMIN' })
    res.json({ success: true })
  } catch (err) {
    fail(res, err)
  }
}

// ============ AUDIT SUMMARY ============

async function performerNames(ids) {
  const unique = [...new Set(ids.filter(Boolean))]
  if (!unique.length) return new Map()
  const [admins, jodayn, org, client] = await Promise.all([
    prisma.superAdmin.findMany({ where: { id: { in: unique } }, select: { id: true, name: true } }),
    prisma.jodaynUser.findMany({ where: { id: { in: unique } }, select: { id: true, name: true } }),
    prisma.orgUser.findMany({ where: { id: { in: unique } }, select: { id: true, name: true } }),
    prisma.clientUser.findMany({ where: { id: { in: unique } }, select: { id: true, name: true } }),
  ])
  return new Map([...admins, ...jodayn, ...org, ...client].map((user) => [user.id, user.name]))
}

/** Real figures for the audit page header: failed sign-ins and the most active performer (last 7 days). */
exports.getAuditSummary = async (req, res) => {
  try {
    const since = new Date(Date.now() - 7 * DAY_MS)
    const [failedLogins, totalChanges, topPerformers, recentFailures] = await Promise.all([
      prisma.activityLog.count({ where: { action: 'LOGIN_FAILED', createdAt: { gte: since } } }),
      prisma.auditLog.count({ where: { createdAt: { gte: since } } }),
      prisma.auditLog.groupBy({
        by: ['performedBy'],
        where: { createdAt: { gte: since } },
        _count: { performedBy: true },
        orderBy: { _count: { performedBy: 'desc' } },
        take: 1,
      }),
      prisma.activityLog.findMany({
        where: { action: 'LOGIN_FAILED' },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: { id: true, userId: true, actorType: true, details: true, createdAt: true },
      }),
    ])
    const names = await performerNames([topPerformers[0]?.performedBy, ...recentFailures.map((row) => row.userId)])
    res.json({
      periodDays: 7,
      failedLogins,
      totalChanges,
      mostActive: topPerformers[0]
        ? { userId: topPerformers[0].performedBy, name: names.get(topPerformers[0].performedBy) || null, count: topPerformers[0]._count.performedBy }
        : null,
      recentFailures: recentFailures.map((row) => ({ ...row, name: names.get(row.userId) || null })),
    })
  } catch (err) {
    fail(res, err)
  }
}

exports.performerNames = performerNames
