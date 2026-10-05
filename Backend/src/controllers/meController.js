const bcrypt = require('bcryptjs')
const prisma = require('../lib/prisma')
const { MIN_PASSWORD_LENGTH, findAccountById, isValidNewPassword, publicSessionUser } = require('../lib/accountAccess')
const { writeAuditLog } = require('../lib/audit')

const MODELS = {
  SUPER_ADMIN: () => prisma.superAdmin,
  JODAYN: () => prisma.jodaynUser,
  ORG: () => prisma.orgUser,
  CLIENT: () => prisma.clientUser,
}

function fail(res, err) {
  res.status(err.status || 500).json({ message: err.message })
}

async function currentUser(req) {
  const user = await findAccountById(req.user.type, req.user.userId)
  if (!user) throw Object.assign(new Error('User not found'), { status: 404 })
  return user
}

function profile(user, type) {
  return {
    ...publicSessionUser(user, type),
    createdAt: user.createdAt,
    activatedAt: user.activatedAt || null,
    lastLoginAt: user.lastLoginAt || null,
  }
}

exports.getMe = async (req, res) => {
  try {
    res.json({ user: profile(await currentUser(req), req.user.type) })
  } catch (err) {
    fail(res, err)
  }
}

/** Users can change their own display name; email and role are managed by their administrators. */
exports.updateMe = async (req, res) => {
  try {
    const name = String(req.body?.name || '').trim()
    if (!name) return res.status(400).json({ message: 'الاسم مطلوب' })
    if (name.length > 120) return res.status(400).json({ message: 'الاسم طويل جداً' })
    await MODELS[req.user.type]().update({ where: { id: req.user.userId }, data: { name } })
    res.json({ success: true, user: profile(await currentUser(req), req.user.type) })
  } catch (err) {
    fail(res, err)
  }
}

exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body || {}
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'كلمة المرور الحالية والجديدة مطلوبتان' })
    }
    if (!isValidNewPassword(newPassword)) {
      return res.status(400).json({ message: `كلمة المرور يجب أن تكون ${MIN_PASSWORD_LENGTH} أحرف على الأقل` })
    }
    const user = await currentUser(req)
    if (!(await bcrypt.compare(String(currentPassword), user.password))) {
      return res.status(400).json({ message: 'كلمة المرور الحالية غير صحيحة' })
    }
    if (await bcrypt.compare(String(newPassword), user.password)) {
      return res.status(400).json({ message: 'اختر كلمة مرور مختلفة عن الحالية' })
    }
    await MODELS[req.user.type]().update({
      where: { id: user.id },
      data: { password: await bcrypt.hash(String(newPassword), 10) },
    })
    await writeAuditLog({
      action: 'UPDATE',
      tableName: 'credentials',
      recordId: user.id,
      newData: { passwordChanged: true },
      performedBy: user.id,
      actorType: req.user.type,
    }).catch(() => {})
    res.json({ success: true })
  } catch (err) {
    fail(res, err)
  }
}

// ============ DASHBOARD LAYOUT ============

const PORTALS = ['org', 'client', 'jodayn', 'superadmin']

function portalParam(req) {
  const portal = String(req.params.portal || '').toLowerCase()
  if (!PORTALS.includes(portal)) throw Object.assign(new Error('Invalid portal'), { status: 400 })
  return portal
}

exports.getDashboardLayout = async (req, res) => {
  try {
    const portal = portalParam(req)
    const saved = await prisma.dashboardLayout.findUnique({
      where: { userId_actorType_portal: { userId: req.user.userId, actorType: req.user.type, portal } },
    })
    res.json({ layout: saved ? { widgetIds: saved.widgetIds, layout: saved.layout, updatedAt: saved.updatedAt } : null })
  } catch (err) {
    fail(res, err)
  }
}

exports.saveDashboardLayout = async (req, res) => {
  try {
    const portal = portalParam(req)
    const { widgetIds, layout } = req.body || {}
    if (!Array.isArray(widgetIds) || !widgetIds.every((id) => typeof id === 'string')) {
      return res.status(400).json({ message: 'widgetIds must be a list of widget ids' })
    }
    if (!Array.isArray(layout)) return res.status(400).json({ message: 'layout must be a list' })
    if (JSON.stringify(req.body).length > 50000) return res.status(413).json({ message: 'Layout too large' })
    const key = { userId: req.user.userId, actorType: req.user.type, portal }
    const saved = await prisma.dashboardLayout.upsert({
      where: { userId_actorType_portal: key },
      create: { ...key, widgetIds, layout },
      update: { widgetIds, layout },
    })
    res.json({ success: true, layout: { widgetIds: saved.widgetIds, layout: saved.layout, updatedAt: saved.updatedAt } })
  } catch (err) {
    fail(res, err)
  }
}

exports.resetDashboardLayout = async (req, res) => {
  try {
    const portal = portalParam(req)
    await prisma.dashboardLayout.deleteMany({ where: { userId: req.user.userId, actorType: req.user.type, portal } })
    res.json({ success: true })
  } catch (err) {
    fail(res, err)
  }
}

// ============ SEARCH ============

const contains = (q) => ({ contains: q, mode: 'insensitive' })

/** Global search, limited to what the signed-in user's portal may see. */
exports.search = async (req, res) => {
  try {
    const q = String(req.query.q || '').trim()
    if (q.length < 2) return res.json({ results: [] })
    const take = 6
    const { type, orgId, clientId } = req.user
    let results = []

    if (type === 'ORG') {
      const [projects, departments, companies, goals] = await Promise.all([
        prisma.orgProject.findMany({ where: { orgId, name: contains(q) }, select: { id: true, name: true }, take }),
        prisma.department.findMany({ where: { orgId, name: contains(q) }, select: { id: true, name: true }, take }),
        prisma.executingCompany.findMany({ where: { orgId, name: contains(q) }, select: { id: true, name: true }, take }),
        prisma.orgStrategicGoal.findMany({ where: { orgId, title: contains(q) }, select: { id: true, title: true }, take }),
      ])
      results = [
        ...projects.map((p) => ({ kind: 'project', label: p.name, link: `/org/projects/${p.id}` })),
        ...departments.map((d) => ({ kind: 'department', label: d.name, link: `/org/departments/${d.id}` })),
        ...companies.map((c) => ({ kind: 'company', label: c.name, link: `/org/companies/${c.id}` })),
        ...goals.map((g) => ({ kind: 'goal', label: g.title, link: `/org/goals/${g.id}` })),
      ]
    } else if (type === 'CLIENT') {
      const [projects, goals] = await Promise.all([
        prisma.clientProject.findMany({ where: { clientId, name: contains(q) }, select: { id: true, name: true }, take }),
        prisma.clientStrategicGoal.findMany({ where: { clientId, title: contains(q) }, select: { id: true, title: true }, take }),
      ])
      results = [
        ...projects.map((p) => ({ kind: 'project', label: p.name, link: `/client/projects/${p.id}` })),
        ...goals.map((g) => ({ kind: 'goal', label: g.title, link: `/client/goals/${g.id}` })),
      ]
    } else if (type === 'JODAYN') {
      const [orgs, clients, invoices, sectors] = await Promise.all([
        prisma.orgAccount.findMany({ where: { name: contains(q) }, select: { id: true, name: true }, take }),
        prisma.clientAccount.findMany({ where: { name: contains(q) }, select: { id: true, name: true }, take }),
        prisma.invoice.findMany({
          where: { OR: [{ invoiceNumber: contains(q) }, { clientName: contains(q) }] },
          select: { id: true, invoiceNumber: true, clientName: true },
          take,
        }),
        prisma.sector.findMany({ where: { name: contains(q) }, select: { id: true, name: true }, take }),
      ])
      results = [
        ...orgs.map((o) => ({ kind: 'org', label: o.name, link: '/jodayn/org-accounts' })),
        ...clients.map((c) => ({ kind: 'client', label: c.name, link: '/jodayn/client-accounts' })),
        ...invoices.map((i) => ({ kind: 'invoice', label: `${i.invoiceNumber} · ${i.clientName}`, link: '/jodayn/invoices' })),
        ...sectors.map((s) => ({ kind: 'sector', label: s.name, link: '/jodayn/sectors' })),
      ]
    } else if (type === 'SUPER_ADMIN') {
      const userWhere = { OR: [{ name: contains(q) }, { email: contains(q) }] }
      const [orgs, clients, orgUsers, clientUsers, jodaynUsers] = await Promise.all([
        prisma.orgAccount.findMany({ where: { name: contains(q) }, select: { id: true, name: true }, take }),
        prisma.clientAccount.findMany({ where: { name: contains(q) }, select: { id: true, name: true }, take }),
        prisma.orgUser.findMany({ where: userWhere, select: { id: true, name: true, email: true }, take }),
        prisma.clientUser.findMany({ where: userWhere, select: { id: true, name: true, email: true }, take }),
        prisma.jodaynUser.findMany({ where: userWhere, select: { id: true, name: true, email: true }, take }),
      ])
      results = [
        ...orgs.map((o) => ({ kind: 'tenant', label: o.name, link: `/super-admin/tenants?id=org-${o.id}` })),
        ...clients.map((c) => ({ kind: 'tenant', label: c.name, link: `/super-admin/tenants?id=client-${c.id}` })),
        ...[...orgUsers, ...clientUsers, ...jodaynUsers].map((u) => ({
          kind: 'user',
          label: `${u.name} · ${u.email}`,
          link: `/super-admin/users?q=${encodeURIComponent(u.email)}`,
        })),
      ]
    }
    res.json({ results })
  } catch (err) {
    fail(res, err)
  }
}
