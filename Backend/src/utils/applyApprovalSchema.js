const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '../../.env') })
const { Client } = require('pg')
const { getDatabaseName } = require('../lib/demoSafety')

async function main() {
  const name = getDatabaseName()
  if (name !== 'trackplus_demo') {
    console.error('refused: active database is not trackplus_demo')
    process.exit(1)
  }

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    connectionTimeoutMillis: 8000,
  })
  await client.connect()
  try {
    const current = await client.query('SELECT current_database() AS name')
    if (current.rows[0].name !== 'trackplus_demo') {
      console.error('refused: connected database is not trackplus_demo')
      process.exit(1)
    }
    console.log('confirmed database trackplus_demo')

    const enums = await client.query(`
      SELECT e.enumlabel
      FROM pg_enum e
      JOIN pg_type t ON t.oid = e.enumtypid
      WHERE t.typname = 'ApprovalStatus'
    `)
    const labels = enums.rows.map((row) => row.enumlabel)
    console.log('ApprovalStatus values:', labels.join(','))
    if (!labels.includes('DRAFT')) {
      await client.query(`ALTER TYPE "ApprovalStatus" ADD VALUE 'DRAFT'`)
      console.log('added DRAFT')
    }
    await client.query(`ALTER TABLE "org_projects" ALTER COLUMN "approvalStatus" SET DEFAULT 'DRAFT'`)
    console.log('org_projects default is DRAFT')

    const cols = await client.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'client_projects' AND column_name = 'approvalStatus'
    `)
    if (cols.rows.length === 0) {
      await client.query(`
        ALTER TABLE "client_projects"
        ADD COLUMN "approvalStatus" "ApprovalStatus" NOT NULL DEFAULT 'DRAFT',
        ADD COLUMN "approvedAt" TIMESTAMP(3),
        ADD COLUMN "approvedBy" TEXT,
        ADD COLUMN "rejectionReason" TEXT
      `)
      await client.query(`
        UPDATE "client_projects"
        SET "approvalStatus" = 'APPROVED',
            "approvedAt" = COALESCE("updatedAt", NOW())
        WHERE "approvalStatus" = 'DRAFT'
      `)
      console.log('added client project approval columns and kept existing rows APPROVED')
    } else {
      console.log('client project approval columns already present')
    }
  } finally {
    await client.end()
  }
}

main().catch((error) => {
  console.error(error.message)
  process.exit(1)
})
