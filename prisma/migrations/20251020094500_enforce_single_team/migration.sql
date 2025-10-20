-- AddColumn
ALTER TABLE "User" ADD COLUMN "hasCompletedOnboarding" BOOLEAN NOT NULL DEFAULT false;

-- Capture existing team data with ownership ordering
CREATE TABLE "_Team_dedup" AS
SELECT
  "id",
  "name",
  "shortName",
  "logoUrl",
  "homeGround",
  "captain",
  "coach",
  "founded",
  "ownerId",
  "createdAt",
  "updatedAt",
  ROW_NUMBER() OVER (PARTITION BY "ownerId" ORDER BY "createdAt", "id") AS "rn"
FROM "Team";

-- Provision owners for teams without one
INSERT INTO "User" ("id", "name", "email", "passwordHash", "role", "hasCompletedOnboarding", "createdAt", "updatedAt")
SELECT
  'migrated-owner-' || "id",
  'Migrated Owner',
  'migrated+' || "id" || '@switchedhit.com',
  '$2a$10$7EqJtq98hPqEX7fNZaFWoO5dBT4y0iG9ijgZJA56d9WXl6V5E7N7C',
  'USER',
  true,
  COALESCE("createdAt", CURRENT_TIMESTAMP),
  CURRENT_TIMESTAMP
FROM "_Team_dedup"
WHERE "ownerId" IS NULL;

UPDATE "_Team_dedup"
SET "ownerId" = 'migrated-owner-' || "id"
WHERE "ownerId" IS NULL;

-- Deduplicate multiple teams per owner by assigning migrated placeholders
INSERT INTO "User" ("id", "name", "email", "passwordHash", "role", "hasCompletedOnboarding", "createdAt", "updatedAt")
SELECT
  'migrated-owner-' || "id",
  'Migrated Owner',
  'migrated+' || "id" || '@switchedhit.com',
  '$2a$10$7EqJtq98hPqEX7fNZaFWoO5dBT4y0iG9ijgZJA56d9WXl6V5E7N7C',
  'USER',
  true,
  COALESCE("createdAt", CURRENT_TIMESTAMP),
  CURRENT_TIMESTAMP
FROM "_Team_dedup"
WHERE "rn" > 1;

UPDATE "_Team_dedup"
SET "ownerId" = 'migrated-owner-' || "id"
WHERE "rn" > 1;

-- Rebuild Team with required unique owner linkage
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Team" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "shortName" TEXT NOT NULL,
    "logoUrl" TEXT,
    "homeGround" TEXT,
    "captain" TEXT,
    "coach" TEXT,
    "founded" INTEGER,
    "ownerId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Team_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Team" ("captain", "coach", "createdAt", "founded", "homeGround", "id", "logoUrl", "name", "ownerId", "shortName", "updatedAt")
SELECT "captain", "coach", "createdAt", "founded", "homeGround", "id", "logoUrl", "name", "ownerId", "shortName", "updatedAt"
FROM "_Team_dedup";
DROP TABLE "Team";
ALTER TABLE "new_Team" RENAME TO "Team";
CREATE UNIQUE INDEX "Team_name_key" ON "Team"("name");
CREATE UNIQUE INDEX "Team_ownerId_key" ON "Team"("ownerId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

DROP TABLE "_Team_dedup";
