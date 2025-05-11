-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('USER', 'ADMIN');

-- CreateEnum
CREATE TYPE "RecordStatus" AS ENUM ('QUEUE', 'PROGRESS', 'DROP', 'UNFINISHED', 'DONE');

-- CreateEnum
CREATE TYPE "RecordType" AS ENUM ('HANDWRITTEN', 'SUGGESTION', 'AUCTION', 'ORDER');

-- CreateEnum
CREATE TYPE "RecordGenre" AS ENUM ('GAME', 'MOVIE', 'ANIME', 'CARTOON', 'SERIES');

-- CreateEnum
CREATE TYPE "RecordGrade" AS ENUM ('DISLIKE', 'BEER', 'LIKE', 'RECOMMEND');

-- CreateEnum
CREATE TYPE "LimitType" AS ENUM ('SUGGESTION');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "login" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "profileImageUrl" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#333333',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "records" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "link" TEXT NOT NULL,
    "posterUrl" TEXT NOT NULL,
    "status" "RecordStatus" DEFAULT 'QUEUE',
    "type" "RecordType" DEFAULT 'HANDWRITTEN',
    "genre" "RecordGenre",
    "grade" "RecordGrade",
    "episode" TEXT,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "limits" (
    "name" "LimitType" NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 5
);

-- CreateIndex
CREATE UNIQUE INDEX "users_id_key" ON "users"("id");

-- CreateIndex
CREATE UNIQUE INDEX "users_login_key" ON "users"("login");

-- CreateIndex
CREATE INDEX "users_id_login_idx" ON "users"("id", "login");

-- CreateIndex
CREATE INDEX "records_title_idx" ON "records"("title");

-- CreateIndex
CREATE UNIQUE INDEX "limits_name_key" ON "limits"("name");

-- AddForeignKey
ALTER TABLE "records" ADD CONSTRAINT "records_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
