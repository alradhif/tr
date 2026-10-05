-- AlterTable
ALTER TABLE "client_users" ADD COLUMN     "pendingActivation" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "jodayn_users" ADD COLUMN     "pendingActivation" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "org_users" ADD COLUMN     "pendingActivation" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "account_invites" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "actorType" "ActorType" NOT NULL,
    "invitedBy" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "account_invites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "login_challenges" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "actorType" "ActorType" NOT NULL,
    "codeHash" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "login_challenges_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "account_invites_tokenHash_key" ON "account_invites"("tokenHash");

-- CreateIndex
CREATE INDEX "account_invites_userId_idx" ON "account_invites"("userId");

-- CreateIndex
CREATE INDEX "login_challenges_userId_idx" ON "login_challenges"("userId");
