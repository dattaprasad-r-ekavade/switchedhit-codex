export type SimulationConfigValues = {
  name: string
  isActive?: boolean
  baseWicketProbability: number
  extraProbability: number

  battingSkillInfluence: number
  bowlingSkillInfluence: number
  fieldingSkillInfluence: number
  keeperSkillInfluence: number

  paceVsSpinAdvantage: number
  leftHandedPaceBonus: number
  swingFactor: number
  spinFactor: number

  sixThreshold: number
  fourThreshold: number
  twoThreshold: number
  singleThreshold: number

  powerplayMultiplier: number
  middleOversMultiplier: number
  deathOversMultiplier: number
  chasingPressureBase: number
  requiredRunRatePressure: number
  partnershipStability: number
  momentumSwing: number

  pitchBounce: number
  pitchTurn: number
  boundarySize: number
  outfieldSpeed: number
  humidityFactor: number
  dewFactor: number

  seamEffectiveness: number
  spinEffectiveness: number
  yorkerSuccessRate: number
  bouncerSuccessRate: number

  aggressionBase: number
  aggressionPowerplay: number
  aggressionDeath: number

  runOutSuccess: number
  dropCatchPenalty: number
  groundFielding: number

  noBallFrequency: number
  wideFrequency: number
  byeLegByeFrequency: number

  edgeToSlipProbability: number
  topEdgeProbability: number

  notes?: string | null
}

export const BALANCED_SIMULATION_CONFIG: SimulationConfigValues = {
  name: 'Balanced Default',
  isActive: true,
  baseWicketProbability: 0.05,
  extraProbability: 0.08,

  battingSkillInfluence: 0.08,
  bowlingSkillInfluence: 0.1,
  fieldingSkillInfluence: 0.04,
  keeperSkillInfluence: 0.06,

  paceVsSpinAdvantage: 0.05,
  leftHandedPaceBonus: 0.02,
  swingFactor: 0.04,
  spinFactor: 0.04,

  sixThreshold: 0.95,
  fourThreshold: 0.85,
  twoThreshold: 0.7,
  singleThreshold: 0.5,

  powerplayMultiplier: 1.2,
  middleOversMultiplier: 1.0,
  deathOversMultiplier: 1.3,
  chasingPressureBase: 0.03,
  requiredRunRatePressure: 0.06,
  partnershipStability: 0.04,
  momentumSwing: 0.05,

  pitchBounce: 0.5,
  pitchTurn: 0.5,
  boundarySize: 0.5,
  outfieldSpeed: 0.5,
  humidityFactor: 0.4,
  dewFactor: 0.3,

  seamEffectiveness: 0.6,
  spinEffectiveness: 0.6,
  yorkerSuccessRate: 0.4,
  bouncerSuccessRate: 0.35,

  aggressionBase: 0.5,
  aggressionPowerplay: 0.65,
  aggressionDeath: 0.75,

  runOutSuccess: 0.35,
  dropCatchPenalty: 0.2,
  groundFielding: 0.5,

  noBallFrequency: 0.02,
  wideFrequency: 0.05,
  byeLegByeFrequency: 0.01,

  edgeToSlipProbability: 0.03,
  topEdgeProbability: 0.02,

  notes: 'Balanced default tuning used for initial production rollout.',
}

export const SIMULATION_CONFIG_PRESETS: Array<{ id: string; label: string; values: SimulationConfigValues }> = [
  {
    id: 'balanced',
    label: 'Balanced Default',
    values: { ...BALANCED_SIMULATION_CONFIG },
  },
  {
    id: 'batting_paradise',
    label: 'Batting Paradise',
    values: {
      ...BALANCED_SIMULATION_CONFIG,
      name: 'Batting Paradise',
      baseWicketProbability: 0.04,
      extraProbability: 0.09,
      sixThreshold: 0.9,
      fourThreshold: 0.78,
      powerplayMultiplier: 1.35,
      deathOversMultiplier: 1.45,
      boundarySize: 0.35,
      outfieldSpeed: 0.7,
      seamEffectiveness: 0.55,
      spinEffectiveness: 0.58,
      aggressionBase: 0.58,
      aggressionPowerplay: 0.72,
      aggressionDeath: 0.82,
      notes: 'High-scoring decks with lightning fast outfields and small boundaries.',
    },
  },
  {
    id: 'bowler_friendly',
    label: 'Bowler Friendly',
    values: {
      ...BALANCED_SIMULATION_CONFIG,
      name: 'Bowler Friendly',
      baseWicketProbability: 0.065,
      extraProbability: 0.07,
      sixThreshold: 0.97,
      fourThreshold: 0.88,
      powerplayMultiplier: 1.05,
      deathOversMultiplier: 1.15,
      pitchBounce: 0.65,
      pitchTurn: 0.65,
      boundarySize: 0.68,
      seamEffectiveness: 0.72,
      spinEffectiveness: 0.7,
      aggressionBase: 0.42,
      aggressionPowerplay: 0.55,
      aggressionDeath: 0.65,
      runOutSuccess: 0.42,
      dropCatchPenalty: 0.16,
      notes: 'Difficult batting conditions with pronounced assistance for both pace and spin.',
    },
  },
]
