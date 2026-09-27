CREATE TABLE "wordle_notification_subscriptions" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"chatId" text NOT NULL,
	"telegramUsername" text,
	"morningEnabled" boolean DEFAULT true NOT NULL,
	"eveningEnabled" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
ALTER TABLE "wordle_notification_subscriptions" ADD CONSTRAINT "wordle_notification_subscriptions_userid_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
CREATE UNIQUE INDEX "wordle_notification_subscriptions_userId_key" ON "wordle_notification_subscriptions" USING btree ("userId");--> statement-breakpoint
CREATE UNIQUE INDEX "wordle_notification_subscriptions_chatId_key" ON "wordle_notification_subscriptions" USING btree ("chatId");