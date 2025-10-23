import type { SimulationConfig } from '@prisma/client'
import {
  BALANCED_SIMULATION_CONFIG,
  type SimulationConfigValues,
} from '@/lib/simulation-config-presets'

export interface PlayerStats {
  name: string
  role: string
  battingStyle?: string | null
  bowlingStyle?: string | null
  battingVsPace: number
  battingVsSpin: number
  bowlingPace: number
  bowlingSpin: number
  fieldingSkill: number
  wicketKeeping: number
  battingRating: number
  bowlingRating: number
}

export interface BallResult {
  runs: number
  isWicket: boolean
  isExtra: boolean
  extraType?: string
  wicketType?: string
  batsmanName: string
  bowlerName: string
}

export interface InningsResult {
  totalRuns: number
  totalWickets: number
  totalOvers: number
  balls: BallResult[]
}

export type SimulationTuning = Omit<SimulationConfigValues, 'name' | 'isActive' | 'notes'>

type Phase = 'POWERPLAY' | 'MIDDLE' | 'DEATH'

type BallSimulationContext = {
  overNumber: number
  ballInOver: number
  phase: Phase
  pressure: number
  momentum: number
  isPaceBowler: boolean
  fieldingAverage: number
  keeperSkill: number
  runsToWin?: number
  oversRemaining?: number
}

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value))

function createDefaultTuning(): SimulationTuning {
  const { name: _n, isActive: _a, notes: _notes, ...rest } = BALANCED_SIMULATION_CONFIG
  return { ...rest }
}

const DEFAULT_SIMULATION_TUNING = createDefaultTuning()

export function normalizeSimulationConfig(
  config?: Partial<SimulationTuning> | SimulationConfig | null
): SimulationTuning {
  const base = createDefaultTuning()

  if (!config) {
    return base
  }

  const candidate = config as Record<string, unknown>
  for (const key of Object.keys(base) as Array<keyof SimulationTuning>) {
    const value = candidate[key]
    if (value !== undefined && value !== null) {
      const numeric = Number(value)
      if (!Number.isNaN(numeric) && Number.isFinite(numeric)) {
        base[key] = numeric
      }
    }
  }

  return base
}

function resolvePhase(overNumber: number): Phase {
  if (overNumber <= 6) {
    return 'POWERPLAY'
  }
  if (overNumber > 15) {
    return 'DEATH'
  }
  return 'MIDDLE'
}

function resolvePhaseMultiplier(tuning: SimulationTuning, phase: Phase) {
  switch (phase) {
    case 'POWERPLAY':
      return tuning.powerplayMultiplier
    case 'DEATH':
      return tuning.deathOversMultiplier
    default:
      return tuning.middleOversMultiplier
  }
}

export class CricketSimulator {
  private readonly tuning: SimulationTuning

  constructor(overrides?: Partial<SimulationTuning>) {
    this.tuning = {
      ...DEFAULT_SIMULATION_TUNING,
      ...overrides,
    }
  }

  private random() {
    return Math.random()
  }

  private simulateBall(
    batsman: PlayerStats,
    bowler: PlayerStats,
    context: BallSimulationContext
  ): { ball: BallResult; momentumDelta: number } {
    const tuning = this.tuning
    const battingSkill = context.isPaceBowler ? batsman.battingVsPace : batsman.battingVsSpin
    const bowlingSkill = context.isPaceBowler ? bowler.bowlingPace : bowler.bowlingSpin

    const battingNormalized = (battingSkill - 50) / 50
    const bowlingNormalized = (bowlingSkill - 50) / 50
    const fieldingNormalized = (context.fieldingAverage - 50) / 50
    const keeperNormalized = (context.keeperSkill - 50) / 50

    const leftHandBonus =
      batsman.battingStyle === 'LEFT_HAND' && context.isPaceBowler ? tuning.leftHandedPaceBonus : 0

    const pitchAssist = context.isPaceBowler
      ? (tuning.pitchBounce - 0.5) * tuning.seamEffectiveness * 0.12 +
        (tuning.humidityFactor - 0.5) * tuning.swingFactor * 0.08 -
        (tuning.dewFactor - 0.5) * 0.04
      : (tuning.pitchTurn - 0.5) * tuning.spinEffectiveness * 0.12 +
        (tuning.dewFactor - 0.5) * tuning.spinFactor * 0.06

    const matchupSwing =
      (battingNormalized - bowlingNormalized) * tuning.paceVsSpinAdvantage + leftHandBonus

    const momentumImpact = context.momentum * tuning.momentumSwing * 0.4

    const wicketBase =
      tuning.baseWicketProbability +
      bowlingNormalized * tuning.bowlingSkillInfluence -
      battingNormalized * tuning.battingSkillInfluence +
      pitchAssist * 0.5 +
      context.pressure * 0.5 -
      momentumImpact +
      fieldingNormalized * tuning.fieldingSkillInfluence +
      keeperNormalized * tuning.keeperSkillInfluence

    let wicketProbability = clamp(
      wicketBase - (1 - Math.max(fieldingNormalized, -0.5)) * tuning.dropCatchPenalty * 0.1,
      0.02,
      0.55
    )

    const extrasBase =
      tuning.extraProbability +
      tuning.wideFrequency +
      tuning.noBallFrequency +
      tuning.byeLegByeFrequency * 0.5 -
      bowlingNormalized * 0.02

    const extraProbability = clamp(extrasBase, 0.01, 0.25)

    const phaseMultiplier = resolvePhaseMultiplier(tuning, context.phase)

    const aggression =
      tuning.aggressionBase +
      (context.phase === 'POWERPLAY' ? tuning.aggressionPowerplay : 0) +
      (context.phase === 'DEATH' ? tuning.aggressionDeath : 0)

    const boundaryModifier =
      (0.5 - tuning.boundarySize) * 0.15 + (tuning.outfieldSpeed - 0.5) * 0.1

    const scoringBoost =
      aggression * 0.12 +
      battingNormalized * 0.15 -
      bowlingNormalized * 0.1 +
      matchupSwing +
      boundaryModifier +
      (phaseMultiplier - 1) * 0.12 -
      context.pressure * 0.1 +
      momentumImpact

    const roll = this.random()

    if (roll < extraProbability) {
      const totalExtraWeight =
        tuning.wideFrequency + tuning.noBallFrequency + tuning.byeLegByeFrequency
      const extraRoll = this.random() * (totalExtraWeight || 1)

      let extraType: 'WIDE' | 'NO_BALL' | 'BYE' | 'LEG_BYE' = 'WIDE'
      if (extraRoll < tuning.wideFrequency) {
        extraType = 'WIDE'
      } else if (extraRoll < tuning.wideFrequency + tuning.noBallFrequency) {
        extraType = 'NO_BALL'
      } else {
        extraType = this.random() < 0.5 ? 'BYE' : 'LEG_BYE'
      }

      return {
        ball: {
          runs: 1,
          isWicket: false,
          isExtra: true,
          extraType,
          batsmanName: batsman.name,
          bowlerName: bowler.name,
        },
        momentumDelta: 0.02,
      }
    }

    if (roll < extraProbability + wicketProbability) {
      const wicketRoll = this.random()

      let wicketType: string
      if (wicketRoll < 0.22 + tuning.edgeToSlipProbability) {
        wicketType = 'CAUGHT'
      } else if (!context.isPaceBowler && wicketRoll < 0.32 + keeperNormalized * 0.2) {
        wicketType = 'STUMPED'
      } else if (context.isPaceBowler && wicketRoll < 0.48 + tuning.yorkerSuccessRate * 0.2) {
        wicketType = 'BOWLED'
      } else if (wicketRoll < 0.62) {
        wicketType = 'LBW'
      } else if (wicketRoll < 0.62 + tuning.runOutSuccess * 0.3) {
        wicketType = 'RUN_OUT'
      } else {
        wicketType = 'CAUGHT'
      }

      return {
        ball: {
          runs: 0,
          isWicket: true,
          isExtra: false,
          wicketType,
          batsmanName: batsman.name,
          bowlerName: bowler.name,
        },
        momentumDelta: -0.32 - bowlingNormalized * 0.05,
      }
    }

    const thresholdBoost = scoringBoost
    const sixThreshold = clamp(tuning.sixThreshold - thresholdBoost, 0.72, 0.99)
    const fourThreshold = clamp(tuning.fourThreshold - thresholdBoost * 0.85, 0.6, sixThreshold - 0.02)
    const twoThreshold = clamp(tuning.twoThreshold - thresholdBoost * 0.6, 0.4, fourThreshold - 0.04)
    const singleThreshold = clamp(
      tuning.singleThreshold - thresholdBoost * 0.4,
      0.2,
      twoThreshold - 0.05
    )

    const runsRoll = this.random()
    let runs = 0
    if (runsRoll > sixThreshold) {
      runs = 6
    } else if (runsRoll > fourThreshold) {
      runs = 4
    } else if (runsRoll > twoThreshold) {
      runs = 2
    } else if (runsRoll > singleThreshold) {
      runs = 1
    }

    if (runs === 2 && this.random() < (1 - tuning.outfieldSpeed) * 0.2) {
      runs = 3
    }

    if (context.phase === 'DEATH' && runs <= 2) {
      if (this.random() < (phaseMultiplier - 1) * 0.35) {
        runs = Math.min(6, runs + 2)
      }
    } else if (context.phase === 'POWERPLAY' && runs === 1) {
      if (this.random() < (phaseMultiplier - 1) * 0.25) {
        runs = 4
      }
    }

    const momentumDelta =
      runs >= 4
        ? 0.2 + battingNormalized * 0.05
        : runs === 3
          ? 0.12
          : runs === 2
            ? 0.08
            : runs === 1
              ? 0.04 - context.pressure * 0.05
              : -0.05 - context.pressure * 0.08

    return {
      ball: {
        runs,
        isWicket: false,
        isExtra: false,
        batsmanName: batsman.name,
        bowlerName: bowler.name,
      },
      momentumDelta,
    }
  }

  public simulateInnings(
    battingPlayers: PlayerStats[],
    bowlingPlayers: PlayerStats[],
    maxOvers: number = 20,
    targetScore?: number
  ): InningsResult {
    let totalRuns = 0
    let totalWickets = 0
    let totalBalls = 0
    let momentum = 0
    const balls: BallResult[] = []

    let currentBatsmanIndex = 0
    let currentBowlerIndex = 0

    const maxBalls = maxOvers * 6

    const fieldingAverage =
      bowlingPlayers.reduce((sum, player) => sum + player.fieldingSkill, 0) /
        Math.max(1, bowlingPlayers.length) || 50

    const keeperSkill = bowlingPlayers.reduce(
      (best, player) => Math.max(best, player.wicketKeeping),
      0
    )

    while (totalBalls < maxBalls && totalWickets < 10) {
      const batsman = battingPlayers[currentBatsmanIndex]
      const bowler = bowlingPlayers[currentBowlerIndex % bowlingPlayers.length]

      const overNumber = Math.floor(totalBalls / 6) + 1
      const ballInOver = (totalBalls % 6) + 1
      const phase = resolvePhase(overNumber)
      const isPaceBowler = bowler.bowlingStyle === 'FAST' || bowler.bowlingStyle === 'MEDIUM'

      const runsToWin = targetScore !== undefined ? targetScore - totalRuns : undefined
      const ballsRemaining = maxBalls - totalBalls
      const oversRemaining = ballsRemaining / 6

      let pressure = 0
      if (targetScore !== undefined && runsToWin !== undefined) {
        if (runsToWin > 0 && oversRemaining > 0) {
          const requiredRunRate = runsToWin / oversRemaining
          const currentRunRate = totalBalls > 0 ? (totalRuns * 6) / totalBalls : requiredRunRate
          const rateDiff = requiredRunRate - currentRunRate

          if (rateDiff > 0) {
            pressure =
              this.tuning.chasingPressureBase + rateDiff * this.tuning.requiredRunRatePressure * 0.1
          } else {
            pressure =
              this.tuning.chasingPressureBase + rateDiff * this.tuning.requiredRunRatePressure * 0.05
          }
        } else if (runsToWin > 0 && oversRemaining === 0) {
          pressure = this.tuning.chasingPressureBase + this.tuning.requiredRunRatePressure
        } else {
          pressure = -0.05
        }
      }

      pressure = clamp(pressure, -0.2, 0.5)

      const { ball, momentumDelta } = this.simulateBall(batsman, bowler, {
        overNumber,
        ballInOver,
        phase,
        pressure,
        momentum,
        isPaceBowler,
        fieldingAverage,
        keeperSkill,
        runsToWin,
        oversRemaining,
      })

      balls.push(ball)

      if (!ball.isExtra) {
        totalBalls++
      } else {
        totalRuns += ball.runs
        momentum = clamp(momentum + momentumDelta, -1, 1)
        continue
      }

      totalRuns += ball.runs
      momentum = clamp(momentum + momentumDelta, -1, 1)

      if (ball.isWicket) {
        totalWickets++
        currentBatsmanIndex++
        momentum = clamp(momentum - this.tuning.momentumSwing, -1, 1)

        if (currentBatsmanIndex >= battingPlayers.length) {
          break
        }
      }

      if (totalBalls % 6 === 0) {
        currentBowlerIndex++
      }

      if (targetScore !== undefined && totalRuns >= targetScore) {
        break
      }
    }

    return {
      totalRuns,
      totalWickets,
      totalOvers: totalBalls / 6,
      balls,
    }
  }

  public determineWinner(
    firstInnings: InningsResult,
    secondInnings: InningsResult
  ): {
    winner: 'TEAM1' | 'TEAM2' | 'TIE'
    margin: number
    marginType: 'RUNS' | 'WICKETS'
  } {
    if (firstInnings.totalRuns > secondInnings.totalRuns) {
      return {
        winner: 'TEAM1',
        margin: firstInnings.totalRuns - secondInnings.totalRuns,
        marginType: 'RUNS',
      }
    }

    if (secondInnings.totalRuns > firstInnings.totalRuns) {
      return {
        winner: 'TEAM2',
        margin: Math.max(1, 10 - secondInnings.totalWickets),
        marginType: 'WICKETS',
      }
    }

    return {
      winner: 'TIE',
      margin: 0,
      marginType: 'RUNS',
    }
  }
}
