/*
  Warnings:

  - You are about to drop the `BlockedDate` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterTable
ALTER TABLE "Booking" ADD COLUMN "endDateTime" DATETIME;
ALTER TABLE "Booking" ADD COLUMN "startDateTime" DATETIME;

-- CreateTable
CREATE TABLE "ScheduleBlock" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" TEXT NOT NULL,
    "startMinute" INTEGER,
    "endMinute" INTEGER,
    "reason" TEXT NOT NULL DEFAULT ''
);

-- Preserve existing all-day blocks while allowing multiple partial-day blocks.
INSERT INTO "ScheduleBlock" ("id", "date", "startMinute", "endMinute", "reason")
SELECT "id", "date", NULL, NULL, "reason" FROM "BlockedDate";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "BlockedDate";
PRAGMA foreign_keys=on;

-- CreateIndex
CREATE INDEX "ScheduleBlock_date_idx" ON "ScheduleBlock"("date");
