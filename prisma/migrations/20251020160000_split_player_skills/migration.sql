-- Split player skills into specialized categories while backfilling existing data.

ALTER TABLE "Player" ADD COLUMN "battingVsPace" INTEGER NOT NULL DEFAULT 50;
ALTER TABLE "Player" ADD COLUMN "battingVsSpin" INTEGER NOT NULL DEFAULT 50;
ALTER TABLE "Player" ADD COLUMN "bowlingPace" INTEGER NOT NULL DEFAULT 50;
ALTER TABLE "Player" ADD COLUMN "bowlingSpin" INTEGER NOT NULL DEFAULT 50;
ALTER TABLE "Player" ADD COLUMN "fieldingSkill" INTEGER NOT NULL DEFAULT 50;
ALTER TABLE "Player" ADD COLUMN "wicketKeeping" INTEGER NOT NULL DEFAULT 0;

UPDATE "Player"
SET
  "battingVsPace" = "battingSkill",
  "battingVsSpin" = "battingSkill",
  "bowlingPace" = CASE
    WHEN "bowlingStyle" IN ('FAST', 'MEDIUM') THEN "bowlingSkill"
    WHEN "bowlingStyle" IN ('SPIN_OFF', 'SPIN_LEG') THEN 45
    ELSE "bowlingSkill"
  END,
  "bowlingSpin" = CASE
    WHEN "bowlingStyle" IN ('SPIN_OFF', 'SPIN_LEG') THEN "bowlingSkill"
    WHEN "bowlingStyle" IN ('FAST', 'MEDIUM') THEN 45
    ELSE "bowlingSkill"
  END,
  "fieldingSkill" = 55,
  "wicketKeeping" = CASE
    WHEN "role" = 'WICKET_KEEPER' THEN 75
    ELSE 0
  END;
