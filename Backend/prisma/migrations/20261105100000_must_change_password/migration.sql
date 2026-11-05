ALTER TABLE "org_users" ADD COLUMN "mustChangePassword" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "client_users" ADD COLUMN "mustChangePassword" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "jodayn_users" ADD COLUMN "mustChangePassword" BOOLEAN NOT NULL DEFAULT false;

-- Invited accounts that have not signed in yet still hold a temporary password.
UPDATE "org_users" SET "mustChangePassword" = true WHERE "pendingActivation" = true;
UPDATE "client_users" SET "mustChangePassword" = true WHERE "pendingActivation" = true;
UPDATE "jodayn_users" SET "mustChangePassword" = true WHERE "pendingActivation" = true;
