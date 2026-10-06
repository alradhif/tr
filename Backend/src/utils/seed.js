const bcrypt = require('bcryptjs')
const prisma = require('../lib/prisma')
const { assertConnectedToDemoDatabase } = require('../lib/demoSafety')
const { seedMockBaseline } = require('./demoBaseline')

async function findOrCreate(model, where, create) {
  const existing = await model.findFirst({ where })
  if (existing) return existing
  return model.create({ data: create })
}

async function ensureActiveSubscription({ accountType, accountId, packageId, createdBy, paidAmount }) {
  const existing = await prisma.accountSubscription.findFirst({
    where: { accountType, accountId, packageId, status: 'ACTIVE' },
  })
  if (existing) return existing
  return prisma.accountSubscription.create({
    data: {
      accountType,
      accountId,
      packageId,
      startDate: new Date(),
      endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      paidAmount,
      status: 'ACTIVE',
      createdBy,
    },
  })
}

async function seedDatabase() {
  // Seeding wipes nothing, but it must still only ever write into the demo database.
  await assertConnectedToDemoDatabase(prisma)

  const hashed = await bcrypt.hash('Demo1234', 10)
  const adminHashed = await bcrypt.hash('admin123456', 10)

  // ── Super Admin ──────────────────────────────────────────────
  const admin = await prisma.superAdmin.upsert({
    where: { email: 'admin@trackplus.com' },
    update: { password: adminHashed, isActive: true, name: 'Super Admin' },
    create: {
      name: 'Super Admin',
      email: 'admin@trackplus.com',
      password: adminHashed,
      isActive: true,
    },
  })
  console.log('Super Admin:', admin.email)

  // ── Jodayn users (both roles) ────────────────────────────────
  // Keep legacy email as upper-mgmt so existing docs/scripts keep working
  const jodaynUpper = await prisma.jodaynUser.upsert({
    where: { email: 'fai@jodayn.com' },
    update: {
      password: hashed,
      isActive: true,
      role: 'JODAYN_UPPER_MGMT',
      name: 'Fai (Upper Mgmt)',
    },
    create: {
      name: 'Fai (Upper Mgmt)',
      email: 'fai@jodayn.com',
      password: hashed,
      role: 'JODAYN_UPPER_MGMT',
      isActive: true,
    },
  })
  console.log('Jodayn Upper:', jodaynUpper.email)

  const jodaynEntry = await prisma.jodaynUser.upsert({
    where: { email: 'fai.entry@jodayn.com' },
    update: {
      password: hashed,
      isActive: true,
      role: 'JODAYN_DATA_ENTRY',
      name: 'Fai (Data Entry)',
    },
    create: {
      name: 'Fai (Data Entry)',
      email: 'fai.entry@jodayn.com',
      password: hashed,
      role: 'JODAYN_DATA_ENTRY',
      isActive: true,
    },
  })
  console.log('Jodayn Data Entry:', jodaynEntry.email)

  // ── Sector ───────────────────────────────────────────────────
  const sector = await findOrCreate(
    prisma.sector,
    { name: 'Government' },
    { name: 'Government', managerName: 'Khalid Al-Mansour' },
  )
  console.log('Sector:', sector.id)

  // ── Org Account ──────────────────────────────────────────────
  let orgAccount =
    (await prisma.orgAccount.findFirst({ where: { domain: 'acme.trackplus.com' } })) ||
    (await prisma.orgAccount.findFirst({ where: { name: 'Acme Org' } }))

  if (!orgAccount) {
    orgAccount = await prisma.orgAccount.create({
      data: {
        name: 'Acme Org',
        sectorId: sector.id,
        createdBy: admin.id,
        entityType: 'خاصة',
        region: 'الرياض',
        phone: '0500000000',
        crNumber: '7001234567',
        domain: 'acme.trackplus.com',
      },
    })
  } else {
    orgAccount = await prisma.orgAccount.update({
      where: { id: orgAccount.id },
      data: {
        name: 'Acme Org',
        domain: 'acme.trackplus.com',
        entityType: orgAccount.entityType || 'خاصة',
        region: orgAccount.region || 'الرياض',
        phone: orgAccount.phone || '0500000000',
        crNumber: orgAccount.crNumber || '7001234567',
        sectorId: orgAccount.sectorId || sector.id,
      },
    })
  }
  console.log('Org Account:', orgAccount.id)

  // Legacy upper-mgmt email kept for compatibility
  const orgUpper = await prisma.orgUser.upsert({
    where: { email: 'seed.orguser@acme.com' },
    update: {
      password: hashed,
      isActive: true,
      orgId: orgAccount.id,
      name: 'Seed Org Upper Mgmt',
      role: 'ORG_UPPER_MGMT',
    },
    create: {
      name: 'Seed Org Upper Mgmt',
      email: 'seed.orguser@acme.com',
      password: hashed,
      role: 'ORG_UPPER_MGMT',
      orgId: orgAccount.id,
    },
  })
  console.log('Org Upper:', orgUpper.email)

  const orgEntry = await prisma.orgUser.upsert({
    where: { email: 'seed.orguser.entry@acme.com' },
    update: {
      password: hashed,
      isActive: true,
      orgId: orgAccount.id,
      name: 'Seed Org Data Entry',
      role: 'ORG_DATA_ENTRY',
    },
    create: {
      name: 'Seed Org Data Entry',
      email: 'seed.orguser.entry@acme.com',
      password: hashed,
      role: 'ORG_DATA_ENTRY',
      orgId: orgAccount.id,
    },
  })
  console.log('Org Data Entry:', orgEntry.email)

  // ── Client Account ───────────────────────────────────────────
  let clientAccount =
    (await prisma.clientAccount.findFirst({ where: { name: 'Acme Client' } })) ||
    (await prisma.clientAccount.findFirst({
      where: { crNumber: '7009876543' },
    }))

  if (!clientAccount) {
    clientAccount = await prisma.clientAccount.create({
      data: {
        name: 'Acme Client',
        managerName: 'Sara Al-Client',
        sectorId: sector.id,
        createdBy: admin.id,
        entityType: 'خاصة',
        region: 'جدة',
        phone: '0550000000',
        crNumber: '7009876543',
        branch: 'جدة',
        contractStatus: 'ACTIVE',
        description: 'Seed client account for role testing',
      },
    })
  } else {
    clientAccount = await prisma.clientAccount.update({
      where: { id: clientAccount.id },
      data: {
        name: 'Acme Client',
        managerName: clientAccount.managerName || 'Sara Al-Client',
        entityType: clientAccount.entityType || 'خاصة',
        region: clientAccount.region || 'جدة',
        phone: clientAccount.phone || '0550000000',
        crNumber: clientAccount.crNumber || '7009876543',
        branch: clientAccount.branch || 'جدة',
        sectorId: clientAccount.sectorId || sector.id,
        isActive: true,
      },
    })
  }
  console.log('Client Account:', clientAccount.id)

  const clientUpper = await prisma.clientUser.upsert({
    where: { email: 'seed.clientuser.mgmt@acme-client.com' },
    update: {
      password: hashed,
      isActive: true,
      clientId: clientAccount.id,
      name: 'Seed Client Upper Mgmt',
      role: 'CLIENT_UPPER_MGMT',
    },
    create: {
      name: 'Seed Client Upper Mgmt',
      email: 'seed.clientuser.mgmt@acme-client.com',
      password: hashed,
      role: 'CLIENT_UPPER_MGMT',
      clientId: clientAccount.id,
    },
  })
  console.log('Client Upper:', clientUpper.email)

  const clientEntry = await prisma.clientUser.upsert({
    where: { email: 'seed.clientuser.entry@acme-client.com' },
    update: {
      password: hashed,
      isActive: true,
      clientId: clientAccount.id,
      name: 'Seed Client Data Entry',
      role: 'CLIENT_DATA_ENTRY',
    },
    create: {
      name: 'Seed Client Data Entry',
      email: 'seed.clientuser.entry@acme-client.com',
      password: hashed,
      role: 'CLIENT_DATA_ENTRY',
      clientId: clientAccount.id,
    },
  })
  console.log('Client Data Entry:', clientEntry.email)

  // ── Packages ─────────────────────────────────────────────────
  const packageSeeds = [
    { name: 'FREE', label: 'Free', packageType: 'اساسية', price: 0, duration: 365, billingCycle: 'YEARLY', storageGb: 5, maxUsers: 5, maxProjects: 3, features: ['إدارة الحسابات'] },
    { name: 'DEMO', label: 'Demo', packageType: 'اساسية', price: 0, duration: 30, billingCycle: 'MONTHLY', storageGb: 10, maxUsers: 10, maxProjects: 5, features: ['إدارة الحسابات', 'تصدير البيانات'] },
    { name: 'BASIC', label: 'Basic', packageType: 'متقدمة', price: 999, duration: 365, billingCycle: 'YEARLY', storageGb: 50, maxUsers: 25, maxProjects: 15, features: ['إدارة الحسابات', 'تصدير البيانات'] },
    { name: 'PREMIUM', label: 'Premium', packageType: 'متقدمة', price: 2499, duration: 365, billingCycle: 'YEARLY', storageGb: 200, maxUsers: 50, maxProjects: 40, features: ['إدارة الحسابات', 'تصدير البيانات', 'إدارة الفوترة'] },
    { name: 'ENTERPRISE', label: 'Enterprise', packageType: 'مؤسسية', price: 5000, duration: 365, billingCycle: 'YEARLY', storageGb: 1024, maxUsers: 100, maxProjects: 100, features: ['إدارة الحسابات', 'تصدير البيانات', 'إدارة الفوترة'] },
  ]
  for (const seed of packageSeeds) {
    await prisma.package.upsert({
      where: { name: seed.name },
      update: {},
      create: seed,
    })
  }
  const pkg = await prisma.package.findUnique({ where: { name: 'ENTERPRISE' } })
  console.log('Packages seeded; default:', pkg?.name)

  const orgSub = await ensureActiveSubscription({
    accountType: 'ORG',
    accountId: orgAccount.id,
    packageId: pkg.id,
    createdBy: admin.id,
    paidAmount: 5000,
  })
  console.log('Org Subscription:', orgSub.id)

  const clientSub = await ensureActiveSubscription({
    accountType: 'CLIENT',
    accountId: clientAccount.id,
    packageId: pkg.id,
    createdBy: admin.id,
    paidAmount: 5000,
  })
  console.log('Client Subscription:', clientSub.id)

  const department = await findOrCreate(
    prisma.department,
    { orgId: orgAccount.id, name: 'تطوير البرمجيات' },
    {
      name: 'تطوير البرمجيات',
      type: 'التقنية',
      managerName: 'عبدالعزيز سالم',
      description: 'إدارة مسؤولة عن تطوير الأنظمة',
      orgId: orgAccount.id,
    },
  )

  const company = await findOrCreate(
    prisma.executingCompany,
    { orgId: orgAccount.id, name: 'شركة الحلول التقنية' },
    {
      name: 'شركة الحلول التقنية',
      description: 'شركة منفذة للمشاريع التجريبية',
      orgId: orgAccount.id,
    },
  )

  await seedMockBaseline({
    admin,
    sector,
    orgAccount,
    clientAccount,
    orgUpper,
    orgEntry,
    clientUpper,
    department,
    company,
  })

  console.log('\nDemo seed completed for mock baseline.')

}

if (require.main === module) {
  seedDatabase()
    .then(() => prisma.$disconnect())
    .catch(async (err) => {
      console.error(err)
      await prisma.$disconnect()
      process.exit(1)
    })
}

module.exports = { seedDatabase, seedSharedDemoRecords: seedMockBaseline }
