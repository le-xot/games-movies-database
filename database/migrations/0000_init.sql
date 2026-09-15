CREATE TYPE "public"."LimitType" AS ENUM('SUGGESTION');--> statement-breakpoint
CREATE TYPE "public"."Platform" AS ENUM('TWITCH', 'KICK', 'TELEGRAM');--> statement-breakpoint
CREATE TYPE "public"."RecordGenre" AS ENUM('GAME', 'MOVIE', 'ANIME', 'CARTOON', 'SERIES');--> statement-breakpoint
CREATE TYPE "public"."RecordGrade" AS ENUM('DISLIKE', 'BEER', 'LIKE', 'RECOMMEND');--> statement-breakpoint
CREATE TYPE "public"."RecordStatus" AS ENUM('QUEUE', 'PROGRESS', 'DROP', 'UNFINISHED', 'DONE', 'NOTINTERESTED');--> statement-breakpoint
CREATE TYPE "public"."RecordType" AS ENUM('WRITTEN', 'SUGGESTION', 'AUCTION', 'ORDER');--> statement-breakpoint
CREATE TYPE "public"."ThirdPartService" AS ENUM('SPOTIFY');--> statement-breakpoint
CREATE TYPE "public"."UserRole" AS ENUM('USER', 'ADMIN');--> statement-breakpoint
CREATE TABLE "auctions_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"winnerId" integer NOT NULL,
	"createdAt" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "likes" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"recordId" integer NOT NULL,
	"createdAt" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "limits" (
	"name" "LimitType" NOT NULL,
	"quantity" integer DEFAULT 5 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "records" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"link" text NOT NULL,
	"posterUrl" text NOT NULL,
	"status" "RecordStatus" DEFAULT 'QUEUE',
	"type" "RecordType" DEFAULT 'WRITTEN',
	"genre" "RecordGenre",
	"grade" "RecordGrade",
	"episode" text,
	"createdAt" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"extra" jsonb
);
--> statement-breakpoint
CREATE TABLE "suggestion_ownerships" (
	"id" serial PRIMARY KEY NOT NULL,
	"recordId" integer NOT NULL,
	"userId" text NOT NULL,
	"createdAt" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "suggestion_rules" (
	"genre" "RecordGenre" NOT NULL,
	"permission" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "third_part_oauth_service_tokens" (
	"id" serial PRIMARY KEY NOT NULL,
	"service" "ThirdPartService" NOT NULL,
	"accessToken" text NOT NULL,
	"refreshToken" text NOT NULL,
	"obtainedAt" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"expiresAt" timestamp (3) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_accounts" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"platform" "Platform" NOT NULL,
	"platformUserId" text NOT NULL,
	"platformLogin" text NOT NULL,
	"platformAvatar" text,
	"createdAt" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"login" text NOT NULL,
	"role" "UserRole" DEFAULT 'USER' NOT NULL,
	"profileImageUrl" text NOT NULL,
	"color" text DEFAULT '#333333' NOT NULL,
	"createdAt" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"hasCustomAvatar" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
ALTER TABLE "auctions_history" ADD CONSTRAINT "auctions_history_winnerId_fkey" FOREIGN KEY ("winnerId") REFERENCES "public"."records"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "likes" ADD CONSTRAINT "likes_userid_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "likes" ADD CONSTRAINT "likes_recordId_fkey" FOREIGN KEY ("recordId") REFERENCES "public"."records"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "suggestion_ownerships" ADD CONSTRAINT "suggestion_ownerships_recordId_fkey" FOREIGN KEY ("recordId") REFERENCES "public"."records"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "suggestion_ownerships" ADD CONSTRAINT "suggestion_ownerships_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "user_accounts" ADD CONSTRAINT "user_accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
CREATE UNIQUE INDEX "likes_userId_recordId_key" ON "likes" USING btree ("userId","recordId");--> statement-breakpoint
CREATE UNIQUE INDEX "limits_name_key" ON "limits" USING btree ("name");--> statement-breakpoint
CREATE INDEX "records_title_idx" ON "records" USING btree ("title");--> statement-breakpoint
CREATE UNIQUE INDEX "suggestion_ownerships_recordId_key" ON "suggestion_ownerships" USING btree ("recordId");--> statement-breakpoint
CREATE UNIQUE INDEX "suggestion_rules_genre_key" ON "suggestion_rules" USING btree ("genre");--> statement-breakpoint
CREATE UNIQUE INDEX "third_part_oauth_service_tokens_service_key" ON "third_part_oauth_service_tokens" USING btree ("service");--> statement-breakpoint
CREATE UNIQUE INDEX "user_accounts_platform_platformUserId_key" ON "user_accounts" USING btree ("platform","platformUserId");--> statement-breakpoint
CREATE UNIQUE INDEX "user_accounts_userId_platform_key" ON "user_accounts" USING btree ("userId","platform");--> statement-breakpoint
CREATE UNIQUE INDEX "users_id_key" ON "users" USING btree ("id");--> statement-breakpoint
CREATE INDEX "users_login_idx" ON "users" USING btree ("login");