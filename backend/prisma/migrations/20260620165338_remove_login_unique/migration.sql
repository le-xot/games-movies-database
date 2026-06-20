-- DropIndex
DROP INDEX "users_id_login_idx";

-- DropIndex
DROP INDEX "users_login_key";

-- CreateIndex
CREATE INDEX "users_login_idx" ON "users"("login");
