-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Player" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "battingStyle" TEXT,
    "bowlingStyle" TEXT,
    "battingSkill" INTEGER NOT NULL DEFAULT 50,
    "bowlingSkill" INTEGER NOT NULL DEFAULT 50,
    "jerseyNumber" INTEGER,
    "country" TEXT,
    "age" INTEGER,
    "teamId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Player_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Player" ("age", "battingStyle", "bowlingStyle", "country", "createdAt", "id", "jerseyNumber", "name", "role", "teamId", "updatedAt") SELECT "age", "battingStyle", "bowlingStyle", "country", "createdAt", "id", "jerseyNumber", "name", "role", "teamId", "updatedAt" FROM "Player";
DROP TABLE "Player";
ALTER TABLE "new_Player" RENAME TO "Player";
CREATE INDEX "Player_teamId_idx" ON "Player"("teamId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
