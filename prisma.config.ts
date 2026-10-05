import { config } from 'dotenv'
import { resolve } from 'path'
import { defineConfig, env } from 'prisma/config'

// Load Backend/.env when running Prisma CLI from the project root
config({ path: resolve(__dirname, 'Backend/.env') })

export default defineConfig({
  schema: 'Backend/prisma/schema.prisma',
  migrations: {
    path: 'Backend/prisma/migrations',
    seed: 'node Backend/src/utils/seed.js',
  },
  datasource: {
    url: env('DATABASE_URL'),
  },
})
