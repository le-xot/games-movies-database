-- Backfill user_accounts for all users with numeric id (Twitch user ID)
INSERT INTO "user_accounts" ("userId", "platform", "platformUserId", "platformLogin", "createdAt")
SELECT
  "id",
  'TWITCH'::"Platform",
  "id",
  "login",
  NOW()
FROM "users"
WHERE "id" ~ '^[0-9]+$'
  AND "id" NOT IN (
    SELECT "userId" FROM "user_accounts" WHERE "platform" = 'TWITCH'
  );
