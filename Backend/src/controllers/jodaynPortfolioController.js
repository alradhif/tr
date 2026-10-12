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
        select: { ...projectSelect, org: { select: { name: true } } },
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
