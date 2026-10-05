const { getDatabaseName, assertDemoResetAllowed } = require('../lib/demoSafety')

function expect(condition, message) {
  if (!condition) {
    console.error(message)
    process.exitCode = 1
    return
  }
  console.log(`ok: ${message}`)
}

expect(getDatabaseName('postgresql://user:secret@localhost:5432/trackplus') === 'trackplus', 'parses trackplus')
expect(getDatabaseName('postgresql://user:secret@localhost:5432/trackplus_demo') === 'trackplus_demo', 'parses trackplus_demo')
expect(getDatabaseName('postgresql://user:secret@localhost:5432/trackplus_demo?sslmode=disable') === 'trackplus_demo', 'strips query')

const previousMode = process.env.DEMO_MODE
const previousUrl = process.env.DATABASE_URL
process.env.DEMO_MODE = 'true'
process.env.DATABASE_URL = 'postgresql://user:secret@localhost:5432/trackplus'
try {
  assertDemoResetAllowed()
  expect(false, 'reset must refuse trackplus')
} catch (error) {
  expect(error.message.includes('trackplus_demo'), 'reset refuses any other database name')
}

process.env.DEMO_MODE = 'false'
process.env.DATABASE_URL = 'postgresql://user:secret@localhost:5432/trackplus_demo'
try {
  assertDemoResetAllowed()
  expect(false, 'reset must refuse when DEMO_MODE is not true')
} catch (error) {
  expect(error.message.includes('DEMO_MODE'), 'reset refuses when DEMO_MODE is not true')
}

process.env.DEMO_MODE = previousMode
process.env.DATABASE_URL = previousUrl
