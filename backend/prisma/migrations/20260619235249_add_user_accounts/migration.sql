-- CreateEnum
CREATE TYPE "Platform" AS ENUM ('TWITCH', 'KICK');

-- CreateTable
CREATE TABLE "user_accounts" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "platform" "Platform" NOT NULL,
    "platformUserId" TEXT NOT NULL,
    "platformLogin" TEXT NOT NULL,
    "platformAvatar" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_accounts_platform_platformUserId_key" ON "user_accounts"("platform", "platformUserId");

-- CreateIndex
CREATE UNIQUE INDEX "user_accounts_userId_platform_key" ON "user_accounts"("userId", "platform");

-- Data Migration: Add newId column and generate UUIDs
ALTER TABLE "users" ADD COLUMN "newId" TEXT;
UPDATE "users" SET "newId" = gen_random_uuid();

-- Data Migration: Create user_accounts for existing Twitch users
INSERT INTO "user_accounts" ("userId", "platform", "platformUserId", "platformLogin", "platformAvatar")
SELECT COALESCE("newId", gen_random_uuid()), 'TWITCH', "id", "login", "profileImageUrl" FROM "users";

-- Data Migration: Drop FK constraints before updating
ALTER TABLE "records" DROP CONSTRAINT IF EXISTS "records_userId_fkey";
ALTER TABLE "likes" DROP CONSTRAINT IF EXISTS "likes_userId_fkey";

-- Data Migration: Update FK references
UPDATE "records" SET "userId" = (
  SELECT "newId" FROM "users" WHERE "users"."id" = "records"."userId"
) WHERE "userId" IS NOT NULL;

UPDATE "likes" SET "userId" = (
  SELECT "newId" FROM "users" WHERE "users"."id" = "likes"."userId"
);

UPDATE "user_accounts" SET "userId" = (
  SELECT "newId" FROM "users" WHERE "users"."id" = "user_accounts"."userId"
);

-- Data Migration: Swap columns
ALTER TABLE "users" DROP CONSTRAINT "users_pkey";
ALTER TABLE "users" DROP COLUMN "id";
ALTER TABLE "users" RENAME COLUMN "newId" TO "id";
ALTER TABLE "users" ALTER COLUMN "id" SET NOT NULL;
ALTER TABLE "users" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();
ALTER TABLE "users" ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");

-- Data Migration: Recreate FK constraints
ALTER TABLE "records" ADD CONSTRAINT "records_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "likes" ADD CONSTRAINT "likes_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey (user_accounts)
ALTER TABLE "user_accounts" ADD CONSTRAINT "user_accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
