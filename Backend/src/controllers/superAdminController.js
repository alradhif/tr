const bcrypt = require('bcryptjs')
const prisma = require('../lib/prisma')
const { writeAuditLog } = require('../lib/audit')

// ============ PACKAGES ============

// Create Package
exports.createPackage = async (req, res) => {
  try {
    const { name, price, duration, maxUsers, maxProjects } = req.body
    const pkg = await prisma.package.create({
      data: { name, price, duration, maxUsers, maxProjects }
    })
    res.json({ success: true, package: pkg })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// List Packages
exports.getPackages = async (req, res) => {
  try {
    const packages = await prisma.package.findMany({
      where: { isActive: true },
      orderBy: { price: 'asc' }
    })
    res.json({ packages })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

async function attachSubscriptions(accounts, accountType) {
  if (!accounts.length) return accounts
  const ids = accounts.map((a) => a.id)
  const subscriptions = await prisma.accountSubscription.findMany({
    where: {
      accountType,
      accountId: { in: ids },
      status: 'ACTIVE'
    },
    include: { package: true },
    orderBy: { createdAt: 'desc' }
  })
  const byAccount = new Map()
  for (const sub of subscriptions) {
    if (!byAccount.has(sub.accountId)) byAccount.set(sub.accountId, sub)
  }
  return accounts.map((account) => ({
    ...account,
    subscription: byAccount.get(account.id) || null
  }))
}

// ============ ACCOUNTS ============

// Create Org Account
exports.createOrgAccount = async (req, res) => {
  try {
    const {
      name,
      domain,
      branch,
      entityType,
      region,
      phone,
      crNumber,
      sectorId,
      contractDuration,
      packageId
    } = req.body
    const org = await prisma.orgAccount.create({
      data: {
        name,
        domain,
        branch: branch || region || null,
        entityType: entityType || null,
        region: region || branch || null,
        phone: phone || null,
        crNumber: crNumber || null,
        sectorId,
        contractDuration: contractDuration != null ? String(contractDuration) : null,
        contractStatus: 'ACTIVE',
        createdBy: req.user.userId
      },
      include: { sector: true }
    })
    let subscription = null
    if (packageId) {
      subscription = await prisma.accountSubscription.create({
        data: {
          accountType: 'ORG',
          accountId: org.id,
          packageId,
          startDate: new Date(),
          endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          status: 'ACTIVE',
          createdBy: req.user.userId
        },
        include: { package: true }
      })
    }
    await writeAuditLog({
      action: 'CREATE',
      tableName: 'org_accounts',
      recordId: org.id,
      newData: org,
      performedBy: req.user.userId,
      actorType: 'SUPER_ADMIN'
    })
    res.json({ success: true, org: { ...org, subscription } })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// Create Client Account
exports.createClientAccount = async (req, res) => {
  try {
    const {
      name,
      managerName,
      sectorId,
      branch,
      entityType,
      region,
      phone,
      crNumber,
      packageId
    } = req.body
    const client = await prisma.clientAccount.create({
      data: {
        name,
        managerName,
        branch: branch || region || null,
        entityType: entityType || null,
        region: region || branch || null,
        phone: phone || null,
        crNumber: crNumber || null,
        sectorId,
        contractStatus: 'ACTIVE',
        createdBy: req.user.userId
      },
      include: { sector: true }
    })
    let subscription = null
    if (packageId) {
      subscription = await prisma.accountSubscription.create({
        data: {
          accountType: 'CLIENT',
          accountId: client.id,
          packageId,
          startDate: new Date(),
          endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          status: 'ACTIVE',
          createdBy: req.user.userId
        },
        include: { package: true }
      })
    }
    await writeAuditLog({
      action: 'CREATE',
      tableName: 'client_accounts',
      recordId: client.id,
      newData: client,
      performedBy: req.user.userId,
      actorType: 'SUPER_ADMIN'
    })
    res.json({ success: true, client: { ...client, subscription } })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// Get All Accounts
exports.getAllAccounts = async (req, res) => {
  try {
    const [rawOrgs, rawClients, jodaynUsers, orgUsers] = await Promise.all([
      prisma.orgAccount.findMany({
        include: { sector: true },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.clientAccount.findMany({
        include: { sector: true },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.jodaynUser.findMany({
        select: { id: true, name: true, email: true, role: true, isActive: true, pendingActivation: true, createdAt: true }
      }),
      prisma.orgUser.findMany({
        select: { id: true, name: true, email: true, orgId: true, createdAt: true },
        orderBy: { createdAt: 'asc' }
      })
    ])

    const firstOrgUserByOrg = new Map()
    for (const user of orgUsers) {
      if (!firstOrgUserByOrg.has(user.orgId)) firstOrgUserByOrg.set(user.orgId, user)
    }

    const orgsWithSubs = await attachSubscriptions(rawOrgs, 'ORG')
    const clientsWithSubs = await attachSubscriptions(rawClients, 'CLIENT')

    const [orgCounts, clientCounts, clientAdmins] = await Promise.all([
      prisma.orgUser.groupBy({ by: ['orgId', 'isActive', 'pendingActivation'], _count: { _all: true } }),
      prisma.clientUser.groupBy({ by: ['clientId', 'isActive', 'pendingActivation'], _count: { _all: true } }),
      prisma.clientUser.findMany({
        where: { role: 'CLIENT_UPPER_MGMT' },
        select: { name: true, email: true, clientId: true },
        orderBy: { createdAt: 'asc' }
      })
    ])
    const tally = (rows, key) => {
      const map = new Map()
      for (const row of rows) {
        const entry = map.get(row[key]) || { userCount: 0, activeUsers: 0 }
        entry.userCount += row._count._all
        if (row.isActive && !row.pendingActivation) entry.activeUsers += row._count._all
        map.set(row[key], entry)
      }
      return map
    }
    const orgTally = tally(orgCounts, 'orgId')
    const clientTally = tally(clientCounts, 'clientId')
    const firstClientAdmin = new Map()
    for (const user of clientAdmins) {
      if (!firstClientAdmin.has(user.clientId)) firstClientAdmin.set(user.clientId, user)
    }

    const orgs = orgsWithSubs.map((org) => {
      const admin = firstOrgUserByOrg.get(org.id)
      return {
        ...org,
        adminName: admin?.name || null,
        adminEmail: admin?.email || null,
        ...(orgTally.get(org.id) || { userCount: 0, activeUsers: 0 })
      }
    })
    const clients = clientsWithSubs.map((client) => {
      const admin = firstClientAdmin.get(client.id)
      return {
        ...client,
        adminName: admin?.name || client.managerName || null,
        adminEmail: admin?.email || null,
        ...(clientTally.get(client.id) || { userCount: 0, activeUsers: 0 })
      }
    })

    res.json({ orgs, clients, jodaynUsers })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// Toggle Account Active/Inactive
exports.toggleAccount = async (req, res) => {
  try {
    const { type, id } = req.params
    let updated
    let oldData
    let tableName

    if (type === 'org') {
      const current = await prisma.orgAccount.findUnique({ where: { id } })
      if (!current) return res.status(404).json({ message: 'Org account not found' })
      oldData = current
      tableName = 'org_accounts'
      updated = await prisma.orgAccount.update({
        where: { id },
        data: { isActive: !current.isActive }
      })
    } else if (type === 'client') {
      const current = await prisma.clientAccount.findUnique({ where: { id } })
      if (!current) return res.status(404).json({ message: 'Client account not found' })
      oldData = current
      tableName = 'client_accounts'
      updated = await prisma.clientAccount.update({
        where: { id },
        data: { isActive: !current.isActive }
      })
    } else if (type === 'jodayn') {
      const current = await prisma.jodaynUser.findUnique({ where: { id } })
      if (!current) return res.status(404).json({ message: 'Jodayn user not found' })
      oldData = current
      tableName = 'jodayn_users'
      updated = await prisma.jodaynUser.update({
        where: { id },
        data: { isActive: !current.isActive }
      })
    } else {
      return res.status(400).json({ message: 'Invalid account type' })
    }

    await writeAuditLog({
      action: 'UPDATE',
      tableName,
      recordId: id,
      oldData,
      newData: updated,
      performedBy: req.user.userId,
      actorType: 'SUPER_ADMIN'
    })

    res.json({ success: true, updated })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// ============ SECTORS ============

// إنشاء قطاع جديد
exports.createSector = async (req, res) => {
  try {
    const {
      name,
      managerName,
      budget,
      profit,
      employeeCount,
      departmentCount,
      annualRevenue
    } = req.body

    if (!name) {
      return res.status(400).json({ message: 'Sector name is required' })
    }

    if (!managerName) {
      return res.status(400).json({ message: 'Manager name is required' })
    }

    const existing = await prisma.sector.findFirst({ where: { name } })
    if (existing) {
      return res.status(400).json({ message: 'Sector already exists' })
    }

    const sector = await prisma.sector.create({
      data: {
        name,
        managerName,
        budget,
        profit,
        employeeCount,
        departmentCount,
        annualRevenue
      }
    })

    res.json({ success: true, sector })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// جلب كل القطاعات
exports.getSectors = async (req, res) => {
  try {
    const sectors = await prisma.sector.findMany({
      orderBy: { name: 'asc' }
    })
    res.json({ sectors })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// ============ JODAYN USERS ============

// Create Jodayn User
exports.createJodaynUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body
    const hashed = await bcrypt.hash(password, 10)
    const user = await prisma.jodaynUser.create({
      data: { name, email, password: hashed, role }
    })
    res.json({ success: true, user: { id: user.id, name: user.name, email: user.email, role: user.role } })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// ============ ORG USERS (by Super Admin) ============

// إنشاء أول مستخدم للجهة
exports.createOrgUserBySuperAdmin = async (req, res) => {
  try {
    const { name, email, password, role, orgId } = req.body

    if (!name || !email || !password || !role || !orgId) {
      return res.status(400).json({
        message: 'All fields are required: name, email, password, role, orgId'
      })
    }

    const org = await prisma.orgAccount.findUnique({ where: { id: orgId } })
    if (!org) {
      return res.status(404).json({ message: 'Org account not found' })
    }

    const existing = await prisma.orgUser.findUnique({ where: { email } })
    if (existing) {
      return res.status(400).json({ message: 'Email already exists' })
    }

    const hashed = await bcrypt.hash(password, 10)

    const user = await prisma.orgUser.create({
      data: {
        name,
        email,
        password: hashed,
        role,
        orgId,
        isActive: true
      }
    })

    res.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        orgId: user.orgId
      }
    })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}