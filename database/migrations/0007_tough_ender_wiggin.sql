CREATE TABLE "record_ratings" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"recordId" integer NOT NULL,
	"grade" "RecordGrade" NOT NULL,
	"createdAt" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
ALTER TABLE "record_ratings" ADD CONSTRAINT "record_ratings_userid_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "record_ratings" ADD CONSTRAINT "record_ratings_recordId_fkey" FOREIGN KEY ("recordId") REFERENCES "public"."records"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
CREATE UNIQUE INDEX "record_ratings_userId_recordId_key" ON "record_ratings" USING btree ("userId","recordId");--> statement-breakpoint
CREATE INDEX "record_ratings_recordId_idx" ON "record_ratings" USING btree ("recordId");