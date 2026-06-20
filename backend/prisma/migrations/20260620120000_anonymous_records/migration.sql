-- DropForeignKey (idempotent)
DO $$ BEGIN
  ALTER TABLE "records" DROP CONSTRAINT "records_userId_fkey";
EXCEPTION
  WHEN undefined_object THEN null;
END $$;

-- DropColumn (idempotent)
DO $$ BEGIN
  ALTER TABLE "records" DROP COLUMN "userId";
EXCEPTION
  WHEN undefined_column THEN null;
END $$;

-- CreateTable (idempotent)
CREATE TABLE IF NOT EXISTS "suggestion_ownerships" (
    "id" SERIAL NOT NULL,
    "recordId" INTEGER NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "suggestion_ownerships_pkey" PRIMARY KEY ("id")
);

-- CreateIndex (idempotent)
CREATE UNIQUE INDEX IF NOT EXISTS "suggestion_ownerships_recordId_key" ON "suggestion_ownerships"("recordId");

-- AddForeignKey (idempotent)
DO $$ BEGIN
  ALTER TABLE "suggestion_ownerships" ADD CONSTRAINT "suggestion_ownerships_recordId_fkey" FOREIGN KEY ("recordId") REFERENCES "records"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- AddForeignKey (idempotent)
DO $$ BEGIN
  ALTER TABLE "suggestion_ownerships" ADD CONSTRAINT "suggestion_ownerships_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
