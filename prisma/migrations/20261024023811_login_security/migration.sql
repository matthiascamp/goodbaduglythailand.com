-- CreateTable
CREATE TABLE "login_throttles" (
    "key" TEXT NOT NULL PRIMARY KEY,
    "failures" INTEGER NOT NULL DEFAULT 0,
    "windowStart" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "blockedUntil" DATETIME
);

-- Add the session revision without rebuilding the users table or its foreign keys.
ALTER TABLE "users" ADD COLUMN "authVersion" INTEGER NOT NULL DEFAULT 0;
