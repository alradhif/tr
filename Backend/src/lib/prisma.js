const { PrismaClient } = require('@prisma/client')
const { PrismaPg } = require('@prisma/adapter-pg')
const pg = require('pg')
const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '../../.env') })

// Single shared connection pool for the entire app
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)

// Single Prisma Client instance shared across all controllers
const prisma = new PrismaClient({ adapter })

module.exports = prisma