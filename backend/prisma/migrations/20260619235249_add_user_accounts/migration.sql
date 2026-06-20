-- CreateEnum (idempotent)
DO $$ BEGIN
  CREATE TYPE "Platform" AS ENUM ('TWITCH', 'KICK');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- CreateTable (idempotent)
CREATE TABLE IF NOT EXISTS "user_accounts" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "platform" "Platform" NOT NULL,
    "platformUserId" TEXT NOT NULL,
    "platformLogin" TEXT NOT NULL,
    "platformAvatar" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "user_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex (idempotent)
CREATE UNIQUE INDEX IF NOT EXISTS "user_accounts_platform_platformUserId_key" ON "user_accounts"("platform", "platformUserId");
CREATE UNIQUE INDEX IF NOT EXISTS "user_accounts_userId_platform_key" ON "user_accounts"("userId", "platform");

-- AddForeignKey (idempotent)
DO $$ BEGIN
  ALTER TABLE "user_accounts" ADD CONSTRAINT "user_accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
