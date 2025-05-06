-- CreateEnum
CREATE TYPE "SuggestionsType" AS ENUM ('WATCH', 'GAME');

-- CreateTable
CREATE TABLE "suggestions" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "link" TEXT NOT NULL,
    "type" "SuggestionsType" NOT NULL,
    "posterUrl" TEXT,
    "grade" TEXT,
    "genre" "PrismaGenres",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "suggestions_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "suggestions" ADD CONSTRAINT "suggestions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
