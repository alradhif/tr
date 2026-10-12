-- AlterTable
ALTER TABLE "invoices" ADD COLUMN "autoRenew" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "assetOwner" TEXT;
