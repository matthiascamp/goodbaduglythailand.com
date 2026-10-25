-- CreateTable
CREATE TABLE "analytics_daily" (
    "event" TEXT NOT NULL,
    "day" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,

    PRIMARY KEY ("event", "day")
);
