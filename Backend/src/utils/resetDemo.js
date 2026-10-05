const prisma = require('../lib/prisma')
const { assertDemoResetAllowed } = require('../lib/demoSafety')
const { resetDemoDatabase } = require('../services/demoService')

try {
  assertDemoResetAllowed()
} catch (error) {
  console.error(error.message)
  process.exit(1)
}

resetDemoDatabase()
  .then(() => {
    console.log('Demo database reset completed')
    return prisma.$disconnect()
  })
  .catch(async (error) => {
    console.error(error.message || 'Demo reset failed')
    await prisma.$disconnect()
    process.exit(1)
  })
