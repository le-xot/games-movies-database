/*
  Warnings:

  - You are about to drop the column `profile_image_url` on the `users` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "users" DROP COLUMN "profile_image_url",
ADD COLUMN     "profileImageUrl" TEXT;
