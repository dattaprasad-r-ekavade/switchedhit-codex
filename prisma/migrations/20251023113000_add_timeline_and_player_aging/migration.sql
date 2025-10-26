PRAGMA foreign_keys=OFF;

CREATE TABLE "Player_new" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "battingStyle" TEXT,
    "bowlingStyle" TEXT,
    "battingSkill" INTEGER NOT NULL DEFAULT 50,
    "bowlingSkill" INTEGER NOT NULL DEFAULT 50,
    "battingVsPace" INTEGER NOT NULL DEFAULT 50,
    "battingVsSpin" INTEGER NOT NULL DEFAULT 50,
    "bowlingPace" INTEGER NOT NULL DEFAULT 50,
    "bowlingSpin" INTEGER NOT NULL DEFAULT 50,
    "fieldingSkill" INTEGER NOT NULL DEFAULT 50,
    "wicketKeeping" INTEGER NOT NULL DEFAULT 0,
    "jerseyNumber" INTEGER,
    "country" TEXT,
    "age" INTEGER NOT NULL DEFAULT 24,
    "peakAge" INTEGER NOT NULL DEFAULT 27,
    "retirementAge" INTEGER NOT NULL DEFAULT 40,
    "potentialGrowth" INTEGER NOT NULL DEFAULT 55,
    "careerStartDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastAgedDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "teamId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Player_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

INSERT INTO "Player_new" (
    "id",
    "name",
    "role",
    "battingStyle",
    "bowlingStyle",
    "battingSkill",
    "bowlingSkill",
    "battingVsPace",
    "battingVsSpin",
    "bowlingPace",
    "bowlingSpin",
    "fieldingSkill",
    "wicketKeeping",
    "jerseyNumber",
    "country",
    "age",
    "peakAge",
    "retirementAge",
    "potentialGrowth",
    "careerStartDate",
    "lastAgedDate",
    "teamId",
    "createdAt",
    "updatedAt"
)
SELECT
    "id",
    "name",
    "role",
    "battingStyle",
    "bowlingStyle",
    "battingSkill",
    "bowlingSkill",
    "battingVsPace",
    "battingVsSpin",
    "bowlingPace",
    "bowlingSpin",
    "fieldingSkill",
    "wicketKeeping",
    "jerseyNumber",
    "country",
    COALESCE("age", 24),
    27,
    40,
    55,
    COALESCE("createdAt", CURRENT_TIMESTAMP),
    COALESCE("updatedAt", CURRENT_TIMESTAMP),
    "teamId",
    "createdAt",
    "updatedAt"
FROM "Player";

DROP TABLE "Player";
ALTER TABLE "Player_new" RENAME TO "Player";

CREATE INDEX "Player_teamId_idx" ON "Player" ("teamId");

PRAGMA foreign_keys=ON;

CREATE TABLE "GameTime" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'singleton',
    "currentDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "currentSeason" TEXT NOT NULL DEFAULT '2025-26',
    "dayNumber" INTEGER NOT NULL DEFAULT 0,
    "weekNumber" INTEGER NOT NULL DEFAULT 0,
    "lastUpdated" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO "GameTime" ("id", "currentDate", "currentSeason", "dayNumber", "weekNumber", "lastUpdated")
VALUES ('singleton', CURRENT_TIMESTAMP, '2025-26', 0, 0, CURRENT_TIMESTAMP)
ON CONFLICT("id") DO NOTHING;

CREATE TABLE "PlayerAgeHistory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "playerId" TEXT NOT NULL,
    "age" INTEGER NOT NULL,
    "battingVsPace" INTEGER NOT NULL,
    "battingVsSpin" INTEGER NOT NULL,
    "recordedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PlayerAgeHistory_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "PlayerAgeHistory_playerId_idx" ON "PlayerAgeHistory" ("playerId");
