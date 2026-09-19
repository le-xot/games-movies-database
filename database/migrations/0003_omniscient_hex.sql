CREATE TYPE "public"."WordleGameStatus" AS ENUM('IN_PROGRESS', 'WON', 'LOST');--> statement-breakpoint
CREATE TABLE "wordle_games" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"date" date NOT NULL,
	"answer" text NOT NULL,
	"guesses" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"status" "WordleGameStatus" DEFAULT 'IN_PROGRESS' NOT NULL,
	"createdAt" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
ALTER TABLE "wordle_games" ADD CONSTRAINT "wordle_games_userid_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
CREATE UNIQUE INDEX "wordle_games_userId_date_key" ON "wordle_games" USING btree ("userId","date");