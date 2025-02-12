-- DropIndex
DROP INDEX "users_username_key";

-- AlterTable
ALTER TABLE "users"
    ADD COLUMN "login" TEXT,
  ADD COLUMN "twitchId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "users_login_key" ON "users"("login");

-- CreateIndex
CREATE UNIQUE INDEX "users_twitchId_key" ON "users"("twitchId");