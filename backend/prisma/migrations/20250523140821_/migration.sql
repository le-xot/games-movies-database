-- CreateEnum
CREATE TYPE "ThirdPartService" AS ENUM ('SPOTIFY');

-- CreateTable
CREATE TABLE "third_part_oauth_service_tokens" (
    "id" SERIAL NOT NULL,
    "service" "ThirdPartService" NOT NULL,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT NOT NULL,
    "obtainedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "third_part_oauth_service_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "third_part_oauth_service_tokens_service_key" ON "third_part_oauth_service_tokens"("service");
