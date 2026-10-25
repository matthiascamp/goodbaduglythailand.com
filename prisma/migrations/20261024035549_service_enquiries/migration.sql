-- CreateTable
CREATE TABLE "service_enquiries" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "serviceSlug" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "packageId" TEXT,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "details" TEXT NOT NULL,
    "message" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "userId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE INDEX "service_enquiries_status_createdAt_idx" ON "service_enquiries"("status", "createdAt");

-- CreateIndex
CREATE INDEX "service_enquiries_email_createdAt_idx" ON "service_enquiries"("email", "createdAt");
