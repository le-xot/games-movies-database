-- CreateTable
CREATE TABLE "suggestion_rules" (
    "genre" "RecordGenre" NOT NULL,
    "permission" BOOLEAN NOT NULL DEFAULT true
);

-- CreateIndex
CREATE UNIQUE INDEX "suggestion_rules_genre_key" ON "suggestion_rules"("genre");
