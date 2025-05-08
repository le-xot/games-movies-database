/*
  Warnings:

  - Made the column `status` on table `games` required. This step will fail if there are existing NULL values in that column.
  - Made the column `type` on table `games` required. This step will fail if there are existing NULL values in that column.
  - Made the column `status` on table `videos` required. This step will fail if there are existing NULL values in that column.
  - Made the column `type` on table `videos` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "games" ALTER COLUMN "status" SET NOT NULL,
ALTER COLUMN "type" SET NOT NULL;

-- AlterTable
ALTER TABLE "videos" ALTER COLUMN "status" SET NOT NULL,
ALTER COLUMN "type" SET NOT NULL;
