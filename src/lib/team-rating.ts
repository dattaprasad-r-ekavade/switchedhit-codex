import type { Player } from '@prisma/client'

type PlayerForRating = Pick<
  Player,
  'role' | 'battingVsPace' | 'battingVsSpin' | 'bowlingPace' | 'bowlingSpin' | 'wicketKeeping'
>

export type TeamRatingTier = 'ELITE' | 'STRONG' | 'AVERAGE' | 'WEAK'

function averageTop(values: number[], count: number) {
  if (values.length === 0 || count === 0) {
    return 0
  }

  const limited = values
    .slice()
    .sort((a, b) => b - a)
    .slice(0, Math.min(count, values.length))

  const sum = limited.reduce((total, value) => total + value, 0)
  return sum / limited.length
}

export function calculateTeamRating(players: PlayerForRating[]): number {
  if (!players || players.length === 0) {
    return 0
  }

  const battingAverages = players.map((player) => (player.battingVsPace + player.battingVsSpin) / 2)
  const bowlingPeaks = players.map((player) => Math.max(player.bowlingPace, player.bowlingSpin))

  const top5BatsmenAvg = averageTop(battingAverages, 5)
  const top5BowlersAvg = averageTop(bowlingPeaks, 5)

  const keeper = players.find((player) => player.role === 'WICKET_KEEPER')
  const keeperSkill = keeper ? keeper.wicketKeeping : averageTop(players.map((p) => p.wicketKeeping), 1)

  const rating = (top5BatsmenAvg + top5BowlersAvg + keeperSkill) / 11
  return Math.round(rating * 10) / 10
}

export function getTeamRatingTier(rating: number): TeamRatingTier {
  if (rating >= 80) {
    return 'ELITE'
  }
  if (rating >= 70) {
    return 'STRONG'
  }
  if (rating >= 60) {
    return 'AVERAGE'
  }
  return 'WEAK'
}

export function getTeamRatingLabel(tier: TeamRatingTier): string {
  switch (tier) {
    case 'ELITE':
      return 'Elite'
    case 'STRONG':
      return 'Strong'
    case 'AVERAGE':
      return 'Average'
    case 'WEAK':
    default:
      return 'Developing'
  }
}

