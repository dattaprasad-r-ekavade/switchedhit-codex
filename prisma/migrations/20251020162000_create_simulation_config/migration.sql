CREATE TABLE "SimulationConfig" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "name" TEXT NOT NULL UNIQUE,
  "isActive" INTEGER NOT NULL DEFAULT 0,

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
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER "SimulationConfig_updatedAt"
AFTER UPDATE ON "SimulationConfig"
FOR EACH ROW
BEGIN
  UPDATE "SimulationConfig" SET "updatedAt" = CURRENT_TIMESTAMP WHERE "id" = NEW."id";
END;
