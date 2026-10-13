const prisma = require('../lib/prisma')

// Read-only views of every organization's and client's strategic goals and
// projects, for the Jodayn portal (which oversees all accounts).

const projectSelect = {
  id: true,
  name: true,
  status: true,
  approvalStatus: true,
  progressPct: true,
  startDate: true,
  endDate: true,
  budget: true,
  _count: { select: { deliverables: true } },
}

exports.getGoals = async (req, res) => {
  try {
    const [orgGoals, clientGoals] = await Promise.all([
      prisma.orgStrategicGoal.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
          org: { select: { name: true } },
          projectLinks: { select: { id: true, project: { select: { name: true } } } },
        },
      }),
      prisma.clientStrategicGoal.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
          client: { select: { name: true } },
          projectLinks: { select: { id: true, project: { select: { name: true } } } },
        },
      }),
    ])

    const goals = [
      ...orgGoals.map(({ org, ...goal }) => ({ ...goal, ownerType: 'org', ownerName: org?.name ?? null })),
      ...clientGoals.map(({ client, ...goal }) => ({ ...goal, ownerType: 'client', ownerName: client?.name ?? null })),
    ]

    res.json({ count: goals.length, goals })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

exports.getProjects = async (req, res) => {
  try {
    const [orgProjects, clientProjects] = await Promise.all([
      prisma.orgProject.findMany({
        orderBy: { createdAt: 'desc' },
        select: { ...projectSelect, departmentId: true, orgId: true, org: { select: { name: true } } },
      }),
      prisma.clientProject.findMany({
        orderBy: { createdAt: 'desc' },
        select: { ...projectSelect, client: { select: { name: true } } },
      }),
    ])

    const projects = [
      ...orgProjects.map(({ org, ...project }) => ({ ...project, ownerType: 'org', ownerName: org?.name ?? null })),
      ...clientProjects.map(({ client, ...project }) => ({
        ...project,
        ownerType: 'client',
        ownerName: client?.name ?? null,
      })),
    ]

    res.json({ count: projects.length, projects })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// One client account with its projects, users and financial reports (client detail page).
exports.getClient = async (req, res) => {
  try {
    const client = await prisma.clientAccount.findUnique({
      where: { id: req.params.id },
      include: {
        sector: { select: { name: true } },
        clientProjects: {
          orderBy: { createdAt: 'desc' },
          select: { ...projectSelect },
        },
        clientUsers: {
          orderBy: { createdAt: 'asc' },
          select: { id: true, name: true, email: true, role: true, isActive: true },
        },
        reports: {
          orderBy: { createdAt: 'desc' },
          select: { id: true, type: true, period: true, totalContractsValue: true, netProfit: true },
        },
      },
    })
    if (!client) return res.status(404).json({ message: 'Client not found' })

    const { clientProjects, clientUsers, reports, ...account } = client
    res.json({ client: account, projects: clientProjects, users: clientUsers, reports })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// ---- Departments across every organization (Jodayn الإدارات) ----

// Every organization's departments, with the organization's name.
exports.getDepartments = async (req, res) => {
  try {
    const departments = await prisma.department.findMany({
      include: { employees: true, org: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
    })
    res.json({ count: departments.length, departments })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// Lets the organization department handlers serve Jodayn: scope the request to the
// department's organization (or to body.orgId when creating one).
exports.scopeToDepartmentOrg = async (req, res, next) => {
  try {
    let orgId = req.body?.orgId
    if (req.params.id) {
      const department = await prisma.department.findUnique({ where: { id: req.params.id }, select: { orgId: true } })
      if (!department) return res.status(404).json({ message: 'Department not found' })
      orgId = department.orgId
    }
    if (!orgId) return res.status(400).json({ message: 'Required field: orgId' })
    const org = await prisma.orgAccount.findUnique({ where: { id: orgId }, select: { id: true } })
    if (!org) return res.status(404).json({ message: 'Organization not found' })
    req.user = { ...req.user, orgId }
    next()
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}
