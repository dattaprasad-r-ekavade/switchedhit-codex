-- CreateTable
CREATE TABLE "League" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "tier" INTEGER NOT NULL,
    "season" TEXT NOT NULL,
    "maxTeams" INTEGER NOT NULL DEFAULT 16,
    "status" TEXT NOT NULL DEFAULT 'UPCOMING',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "LeagueStanding" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "leagueId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "played" INTEGER NOT NULL DEFAULT 0,
    "won" INTEGER NOT NULL DEFAULT 0,
    "lost" INTEGER NOT NULL DEFAULT 0,
    "tied" INTEGER NOT NULL DEFAULT 0,
    "noResult" INTEGER NOT NULL DEFAULT 0,
    "points" INTEGER NOT NULL DEFAULT 0,
    "netRunRate" REAL NOT NULL DEFAULT 0,
    "streak" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "LeagueStanding_leagueId_fkey" FOREIGN KEY ("leagueId") REFERENCES "League" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "LeagueStanding_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_GameTime" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'singleton',
    "currentDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "currentSeason" TEXT NOT NULL DEFAULT '2025-26',
    "dayNumber" INTEGER NOT NULL DEFAULT 0,
    "weekNumber" INTEGER NOT NULL DEFAULT 0,
    "lastUpdated" DATETIME NOT NULL
);
INSERT INTO "new_GameTime" ("currentDate", "currentSeason", "dayNumber", "id", "lastUpdated", "weekNumber") SELECT "currentDate", "currentSeason", "dayNumber", "id", "lastUpdated", "weekNumber" FROM "GameTime";
DROP TABLE "GameTime";
ALTER TABLE "new_GameTime" RENAME TO "GameTime";
CREATE UNIQUE INDEX "GameTime_id_key" ON "GameTime"("id");
CREATE TABLE "new_Match" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "matchNumber" INTEGER NOT NULL,
    "venue" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "matchType" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "tossWinner" TEXT,
    "tossDecision" TEXT,
    "result" TEXT,
    "winnerTeamId" TEXT,
    "winByRuns" INTEGER,
    "winByWickets" INTEGER,
    "manOfTheMatch" TEXT,
    "homeTeamId" TEXT NOT NULL,
    "awayTeamId" TEXT NOT NULL,
    "leagueId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Match_homeTeamId_fkey" FOREIGN KEY ("homeTeamId") REFERENCES "Team" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Match_awayTeamId_fkey" FOREIGN KEY ("awayTeamId") REFERENCES "Team" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Match_leagueId_fkey" FOREIGN KEY ("leagueId") REFERENCES "League" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Match" ("awayTeamId", "createdAt", "date", "homeTeamId", "id", "manOfTheMatch", "matchNumber", "matchType", "result", "status", "tossDecision", "tossWinner", "updatedAt", "venue", "winByRuns", "winByWickets", "winnerTeamId") SELECT "awayTeamId", "createdAt", "date", "homeTeamId", "id", "manOfTheMatch", "matchNumber", "matchType", "result", "status", "tossDecision", "tossWinner", "updatedAt", "venue", "winByRuns", "winByWickets", "winnerTeamId" FROM "Match";
DROP TABLE "Match";
ALTER TABLE "new_Match" RENAME TO "Match";
CREATE INDEX "Match_homeTeamId_idx" ON "Match"("homeTeamId");
CREATE INDEX "Match_awayTeamId_idx" ON "Match"("awayTeamId");
CREATE INDEX "Match_status_idx" ON "Match"("status");
CREATE INDEX "Match_leagueId_idx" ON "Match"("leagueId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "League_season_tier_idx" ON "League"("season", "tier");

-- CreateIndex
CREATE INDEX "LeagueStanding_teamId_idx" ON "LeagueStanding"("teamId");

-- CreateIndex
CREATE UNIQUE INDEX "LeagueStanding_leagueId_teamId_key" ON "LeagueStanding"("leagueId", "teamId");
