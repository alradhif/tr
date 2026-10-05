-- AlterTable
ALTER TABLE "org_accounts" ADD COLUMN IF NOT EXISTS "entityType" TEXT;
ALTER TABLE "org_accounts" ADD COLUMN IF NOT EXISTS "region" TEXT;
ALTER TABLE "org_accounts" ADD COLUMN IF NOT EXISTS "phone" TEXT;
ALTER TABLE "org_accounts" ADD COLUMN IF NOT EXISTS "crNumber" TEXT;

-- AlterTable
ALTER TABLE "client_accounts" ADD COLUMN IF NOT EXISTS "entityType" TEXT;
ALTER TABLE "client_accounts" ADD COLUMN IF NOT EXISTS "region" TEXT;
ALTER TABLE "client_accounts" ADD COLUMN IF NOT EXISTS "phone" TEXT;
ALTER TABLE "client_accounts" ADD COLUMN IF NOT EXISTS "crNumber" TEXT;
