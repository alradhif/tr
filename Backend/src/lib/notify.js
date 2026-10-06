const prisma = require('./prisma')

async function createForUsers(userIds, actorType, { title, message, type, link }) {
  let ids = [...new Set(userIds.filter(Boolean))]
  if (ids.length === 0) return
  // Users who switched off in-app notifications in their settings are skipped.
  const optedOut = await prisma.userPreference.findMany({
    where: { userId: { in: ids }, actorType, notifyInApp: false },
    select: { userId: true },
  })
  if (optedOut.length) {
    const skip = new Set(optedOut.map((row) => row.userId))
    ids = ids.filter((id) => !skip.has(id))
    if (ids.length === 0) return
  }
  await prisma.notification.createMany({
    data: ids.map((userId) => ({ title, message, type, link: link || null, userId, actorType })),
  })
}

async function notifyOrgUsers({ orgId, roles, title, message, type, link, alsoUserIds = [] }) {
  const users = await prisma.orgUser.findMany({
    where: {
      orgId,
      isActive: true,
      ...(roles ? { role: { in: roles } } : {}),
    },
    select: { id: true },
  })
  await createForUsers([...users.map((user) => user.id), ...alsoUserIds], 'ORG', { title, message, type, link })
}

async function notifyClientUsers({ clientId, roles, title, message, type, link, alsoUserIds = [] }) {
  const users = await prisma.clientUser.findMany({
    where: {
      clientId,
      isActive: true,
      ...(roles ? { role: { in: roles } } : {}),
    },
    select: { id: true },
  })
  await createForUsers([...users.map((user) => user.id), ...alsoUserIds], 'CLIENT', { title, message, type, link })
}

async function notifyUser({ userId, title, message, type, link, actorType = 'ORG' }) {
  await createForUsers([userId], actorType, { title, message, type, link })
}

module.exports = { notifyOrgUsers, notifyClientUsers, notifyUser, createForUsers }
