-- CreateEnum
CREATE TYPE "LimitType" AS ENUM ('SUGGESTION');

-- CreateTable
CREATE TABLE "limits" (
    "name" "LimitType" NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 5
);

-- CreateIndex
CREATE UNIQUE INDEX "limits_name_key" ON "limits"("name");
