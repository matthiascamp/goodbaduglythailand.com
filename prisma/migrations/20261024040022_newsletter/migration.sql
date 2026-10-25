-- CreateTable
CREATE TABLE "newsletter_subscribers" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "consentAt" DATETIME NOT NULL,
    "consentSource" TEXT NOT NULL,
    "consentText" TEXT NOT NULL,
    "unsubscribeToken" TEXT NOT NULL,
    "unsubscribedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "newsletter_attempts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ipHash" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "newsletter_subscribers_email_key" ON "newsletter_subscribers"("email");

-- CreateIndex
CREATE UNIQUE INDEX "newsletter_subscribers_unsubscribeToken_key" ON "newsletter_subscribers"("unsubscribeToken");

-- CreateIndex
CREATE INDEX "newsletter_subscribers_status_createdAt_idx" ON "newsletter_subscribers"("status", "createdAt");

-- CreateIndex
CREATE INDEX "newsletter_attempts_ipHash_createdAt_idx" ON "newsletter_attempts"("ipHash", "createdAt");
