const prisma = require('./prisma')

async function notifyOrgUsers({ orgId, roles, title, message, type }) {
  const users = await prisma.orgUser.findMany({
    where: {
      orgId,
      isActive: true,
      ...(roles ? { role: { in: roles } } : {}),
    },
    select: { id: true },
  })
  if (users.length === 0) return
  await prisma.notification.createMany({
    data: users.map((user) => ({
      title,
      message,
      type,
      userId: user.id,
      actorType: 'ORG',
    })),
  })
}

async function notifyClientUsers({ clientId, roles, title, message, type }) {
  const users = await prisma.clientUser.findMany({
    where: {
      clientId,
      isActive: true,
      ...(roles ? { role: { in: roles } } : {}),
    },
    select: { id: true },
  })
  if (users.length === 0) return
  await prisma.notification.createMany({
    data: users.map((user) => ({
      title,
      message,
      type,
      userId: user.id,
      actorType: 'CLIENT',
    })),
  })
}

async function notifyUser({ userId, title, message, type, actorType = 'ORG' }) {
  if (!userId) return
  await prisma.notification.create({
    data: {
      title,
      message,
      type,
      userId,
      actorType,
    },
  })
}

module.exports = { notifyOrgUsers, notifyClientUsers, notifyUser }
