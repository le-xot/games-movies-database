ALTER TABLE "users" ADD COLUMN "avatarFrameId" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "unlockedAvatarFrameIds" text[] DEFAULT '{}' NOT NULL;