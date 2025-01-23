/*
  Warnings:

  - You are about to drop the column `password` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `username` on the `users` table. All the data in the column will be lost.
  - Made the column `login` on table `users` required. This step will fail if there are existing NULL values in that column.
  - Made the column `twitchId` on table `users` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "users" DROP COLUMN "password",
DROP COLUMN "username",
ALTER COLUMN "login" SET NOT NULL,
ALTER COLUMN "twitchId" SET NOT NULL;
