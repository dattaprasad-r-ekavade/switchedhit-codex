import { prisma } from '@/lib/prisma'
import { generateTeamPlayers } from '@/lib/player-generator'

type SkillBundle = {
  battingVsPace: number
  battingVsSpin: number
  bowlingPace: number
  bowlingSpin: number
  fieldingSkill: number
  wicketKeeping: number
}

const MAX_SKILL = 99
const MIN_SKILL = 0

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value))
}

function applyDelta(value: number, delta: number, ceiling: number = MAX_SKILL) {
  return clamp(value + delta, MIN_SKILL, ceiling)
}

async function recordAgeHistory(playerId: string, age: number, skills: SkillBundle) {
  await prisma.playerAgeHistory.create({
    data: {
      playerId,
      age,
      battingVsPace: skills.battingVsPace,
      battingVsSpin: skills.battingVsSpin,
    },
  })
}

async function retirePlayer(playerId: string) {
  await prisma.player.delete({
    where: { id: playerId },
  })
}

async function generateYouthReplacement(teamId: string | null) {
  if (!teamId) {
    return
  }

  const [prospect] = generateTeamPlayers(1)
  if (!prospect) {
    return
  }

  await prisma.player.create({
    data: {
      ...prospect,
      teamId,
    },
  })
}

export async function ageAllPlayers() {
  const players = await prisma.player.findMany({
    orderBy: { name: 'asc' },
  })

  const now = new Date()

  for (const player of players) {
    const currentAge = player.age ?? 24
    const peakAge = player.peakAge ?? 27
    const retirementAge = player.retirementAge ?? 40
    const potentialGrowth = clamp(player.potentialGrowth ?? 75, 60, 98)
    const newAge = currentAge + 1

    let skillDelta = 0

    if (newAge < peakAge) {
      skillDelta = 1
    } else if (newAge >= 33 && newAge <= 36) {
      skillDelta = -1
    } else if (newAge >= 37 && newAge <= 39) {
      skillDelta = -2
    } else if (newAge >= retirementAge) {
      skillDelta = -5
    }

    const updatedSkills: SkillBundle = {
      battingVsPace: applyDelta(player.battingVsPace, skillDelta, potentialGrowth),
      battingVsSpin: applyDelta(player.battingVsSpin, skillDelta, potentialGrowth),
      bowlingPace: applyDelta(player.bowlingPace, skillDelta, MAX_SKILL),
      bowlingSpin: applyDelta(player.bowlingSpin, skillDelta, MAX_SKILL),
      fieldingSkill: applyDelta(player.fieldingSkill, skillDelta, MAX_SKILL),
      wicketKeeping: applyDelta(player.wicketKeeping, skillDelta, MAX_SKILL),
    }

    if (newAge >= retirementAge) {
      await recordAgeHistory(player.id, newAge, updatedSkills)
      await retirePlayer(player.id)
      await generateYouthReplacement(player.teamId ?? null)
      continue
    }

    await prisma.player.update({
      where: { id: player.id },
      data: {
        age: newAge,
        battingVsPace: updatedSkills.battingVsPace,
        battingVsSpin: updatedSkills.battingVsSpin,
        bowlingPace: updatedSkills.bowlingPace,
        bowlingSpin: updatedSkills.bowlingSpin,
        fieldingSkill: updatedSkills.fieldingSkill,
        wicketKeeping: updatedSkills.wicketKeeping,
        lastAgedDate: now,
      },
    })

    await recordAgeHistory(player.id, newAge, updatedSkills)
  }
}

export async function getUpcomingRetirements(limit: number = 10) {
  const players = await prisma.player.findMany({
    where: {
      teamId: { not: null },
      retirementAge: { not: null },
    },
    orderBy: {
      retirementAge: 'asc',
    },
    take: limit,
    include: {
      team: {
        select: {
          id: true,
          name: true,
          shortName: true,
        },
      },
    },
  })

  const nearingRetirement = players.filter((player) => {
    if (player.retirementAge == null) {
      return false
    }
    const age = player.age ?? 0
    return player.retirementAge - age <= 2
  })

  return nearingRetirement.length > 0 ? nearingRetirement : players
}

export async function getRecentAgeHistory(limit: number = 15) {
  return prisma.playerAgeHistory.findMany({
    orderBy: { recordedAt: 'desc' },
    take: limit,
    include: {
      player: {
        select: {
          id: true,
          name: true,
          role: true,
          team: {
            select: {
              id: true,
              name: true,
              shortName: true,
            },
          },
        },
      },
    },
  })
}
