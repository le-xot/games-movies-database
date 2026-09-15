DROP TABLE "auctions_history" CASCADE;--> statement-breakpoint
ALTER TABLE "records" ALTER COLUMN "type" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "records" ALTER COLUMN "type" SET DEFAULT 'WRITTEN'::text;--> statement-breakpoint
DROP TYPE "public"."RecordType";--> statement-breakpoint
CREATE TYPE "public"."RecordType" AS ENUM('WRITTEN', 'SUGGESTION', 'ORDER');--> statement-breakpoint
ALTER TABLE "records" ALTER COLUMN "type" SET DEFAULT 'WRITTEN'::"public"."RecordType";--> statement-breakpoint
ALTER TABLE "records" ALTER COLUMN "type" SET DATA TYPE "public"."RecordType" USING "type"::"public"."RecordType";