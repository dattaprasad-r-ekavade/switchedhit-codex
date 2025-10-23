-- CreateTable: User
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'USER',
    "hasCompletedOnboarding" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable: Team
CREATE TABLE "Team" (
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

-- CreateTable: Player
CREATE TABLE "Player" (
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
    "age" INTEGER,
    "teamId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Player_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable: Match
CREATE TABLE "Match" (
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
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Match_homeTeamId_fkey" FOREIGN KEY ("homeTeamId") REFERENCES "Team" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Match_awayTeamId_fkey" FOREIGN KEY ("awayTeamId") REFERENCES "Team" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable: Innings
CREATE TABLE "Innings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "matchId" TEXT NOT NULL,
    "battingTeamId" TEXT NOT NULL,
    "bowlingTeamId" TEXT NOT NULL,
    "inningsNumber" INTEGER NOT NULL,
    "totalRuns" INTEGER NOT NULL DEFAULT 0,
    "totalWickets" INTEGER NOT NULL DEFAULT 0,
    "totalOvers" REAL NOT NULL DEFAULT 0,
    "extras" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Innings_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable: Ball
CREATE TABLE "Ball" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "inningsId" TEXT NOT NULL,
    "overNumber" INTEGER NOT NULL,
    "ballNumber" INTEGER NOT NULL,
    "batsmanName" TEXT NOT NULL,
    "bowlerName" TEXT NOT NULL,
    "runs" INTEGER NOT NULL DEFAULT 0,
    "isWicket" BOOLEAN NOT NULL DEFAULT false,
    "isExtra" BOOLEAN NOT NULL DEFAULT false,
    "extraType" TEXT,
    "wicketType" TEXT,
    "dismissedPlayer" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Ball_inningsId_fkey" FOREIGN KEY ("inningsId") REFERENCES "Innings" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable: SimulationConfig
CREATE TABLE "SimulationConfig" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "baseWicketProbability" REAL NOT NULL DEFAULT 0.05,
    "extraProbability" REAL NOT NULL DEFAULT 0.08,
    "battingSkillInfluence" REAL NOT NULL DEFAULT 0.08,
    "bowlingSkillInfluence" REAL NOT NULL DEFAULT 0.1,
    "fieldingSkillInfluence" REAL NOT NULL DEFAULT 0.04,
    "keeperSkillInfluence" REAL NOT NULL DEFAULT 0.06,
    "paceVsSpinAdvantage" REAL NOT NULL DEFAULT 0.05,
    "leftHandedPaceBonus" REAL NOT NULL DEFAULT 0.02,
    "swingFactor" REAL NOT NULL DEFAULT 0.04,
    "spinFactor" REAL NOT NULL DEFAULT 0.04,
    "sixThreshold" REAL NOT NULL DEFAULT 0.95,
    "fourThreshold" REAL NOT NULL DEFAULT 0.85,
    "twoThreshold" REAL NOT NULL DEFAULT 0.7,
    "singleThreshold" REAL NOT NULL DEFAULT 0.5,
    "powerplayMultiplier" REAL NOT NULL DEFAULT 1.2,
    "middleOversMultiplier" REAL NOT NULL DEFAULT 1.0,
    "deathOversMultiplier" REAL NOT NULL DEFAULT 1.3,
    "chasingPressureBase" REAL NOT NULL DEFAULT 0.03,
    "requiredRunRatePressure" REAL NOT NULL DEFAULT 0.06,
    "partnershipStability" REAL NOT NULL DEFAULT 0.04,
    "momentumSwing" REAL NOT NULL DEFAULT 0.05,
    "pitchBounce" REAL NOT NULL DEFAULT 0.5,
    "pitchTurn" REAL NOT NULL DEFAULT 0.5,
    "boundarySize" REAL NOT NULL DEFAULT 0.5,
    "outfieldSpeed" REAL NOT NULL DEFAULT 0.5,
    "humidityFactor" REAL NOT NULL DEFAULT 0.4,
    "dewFactor" REAL NOT NULL DEFAULT 0.3,
    "seamEffectiveness" REAL NOT NULL DEFAULT 0.6,
    "spinEffectiveness" REAL NOT NULL DEFAULT 0.6,
    "yorkerSuccessRate" REAL NOT NULL DEFAULT 0.4,
    "bouncerSuccessRate" REAL NOT NULL DEFAULT 0.35,
    "aggressionBase" REAL NOT NULL DEFAULT 0.5,
    "aggressionPowerplay" REAL NOT NULL DEFAULT 0.65,
    "aggressionDeath" REAL NOT NULL DEFAULT 0.75,
    "runOutSuccess" REAL NOT NULL DEFAULT 0.35,
    "dropCatchPenalty" REAL NOT NULL DEFAULT 0.2,
    "groundFielding" REAL NOT NULL DEFAULT 0.5,
    "noBallFrequency" REAL NOT NULL DEFAULT 0.02,
    "wideFrequency" REAL NOT NULL DEFAULT 0.05,
    "byeLegByeFrequency" REAL NOT NULL DEFAULT 0.01,
    "edgeToSlipProbability" REAL NOT NULL DEFAULT 0.03,
    "topEdgeProbability" REAL NOT NULL DEFAULT 0.02,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex: User
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex: Team
CREATE UNIQUE INDEX "Team_name_key" ON "Team"("name");
CREATE UNIQUE INDEX "Team_ownerId_key" ON "Team"("ownerId");

-- CreateIndex: Player
CREATE INDEX "Player_teamId_idx" ON "Player"("teamId");

-- CreateIndex: Match
CREATE INDEX "Match_homeTeamId_idx" ON "Match"("homeTeamId");
CREATE INDEX "Match_awayTeamId_idx" ON "Match"("awayTeamId");
CREATE INDEX "Match_status_idx" ON "Match"("status");

-- CreateIndex: Innings
CREATE INDEX "Innings_matchId_idx" ON "Innings"("matchId");

-- CreateIndex: Ball
CREATE INDEX "Ball_inningsId_idx" ON "Ball"("inningsId");

-- CreateIndex: SimulationConfig
CREATE UNIQUE INDEX "SimulationConfig_name_key" ON "SimulationConfig"("name");

-- CreateTrigger: SimulationConfig updatedAt
CREATE TRIGGER "SimulationConfig_updatedAt"
AFTER UPDATE ON "SimulationConfig"
FOR EACH ROW
BEGIN
  UPDATE "SimulationConfig" SET "updatedAt" = CURRENT_TIMESTAMP WHERE "id" = NEW."id";
END;
