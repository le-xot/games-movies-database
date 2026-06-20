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

-- Data Migration: Add newId column (skip if already exists)
DO $$ BEGIN
  ALTER TABLE "users" ADD COLUMN "newId" TEXT;
EXCEPTION
  WHEN duplicate_column THEN null;
END $$;

-- Generate UUIDs for newId (only for rows where newId is null)
UPDATE "users" SET "newId" = gen_random_uuid()::text WHERE "newId" IS NULL;

-- Data Migration: Create user_accounts for existing Twitch users (skip if already have accounts)
INSERT INTO "user_accounts" ("userId", "platform", "platformUserId", "platformLogin", "platformAvatar")
SELECT "newId", 'TWITCH', "id", "login", "profileImageUrl" FROM "users"
WHERE "id" NOT IN (SELECT "platformUserId" FROM "user_accounts" WHERE "platform" = 'TWITCH')
  AND "newId" IS NOT NULL;

-- Data Migration: Drop FK constraints before updating
ALTER TABLE "records" DROP CONSTRAINT IF EXISTS "records_userId_fkey";
ALTER TABLE "likes" DROP CONSTRAINT IF EXISTS "likes_userId_fkey";

-- Data Migration: Update FK references (only if newId column exists and is populated)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'newId') THEN
    UPDATE "records" SET "userId" = (
      SELECT "newId" FROM "users" WHERE "users"."id" = "records"."userId"
    ) WHERE "userId" IS NOT NULL AND EXISTS (SELECT 1 FROM "users" WHERE "users"."id" = "records"."userId");

    UPDATE "likes" SET "userId" = (
      SELECT "newId" FROM "users" WHERE "users"."id" = "likes"."userId"
    ) WHERE EXISTS (SELECT 1 FROM "users" WHERE "users"."id" = "likes"."userId");
  END IF;
END $$;

-- Data Migration: Swap columns (only if old "id" column still exists as Twitch ID)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'newId')
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'id') THEN
    -- Check if id is still the Twitch ID (not UUID) by checking if it matches platformUserId pattern
    IF EXISTS (SELECT 1 FROM "users" WHERE "id" ~ '^[0-9]+$') THEN
      ALTER TABLE "users" DROP CONSTRAINT "users_pkey";
      ALTER TABLE "users" DROP COLUMN "id";
      ALTER TABLE "users" RENAME COLUMN "newId" TO "id";
      ALTER TABLE "users" ALTER COLUMN "id" SET NOT NULL;
      ALTER TABLE "users" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text;
      ALTER TABLE "users" ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");
    END IF;
  END IF;
END $$;

-- Data Migration: Recreate FK constraints
ALTER TABLE "records" ADD CONSTRAINT "records_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "likes" ADD CONSTRAINT "likes_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey (user_accounts)
ALTER TABLE "user_accounts" ADD CONSTRAINT "user_accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
