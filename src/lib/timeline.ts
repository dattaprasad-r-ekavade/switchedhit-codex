import { prisma } from '@/lib/prisma'
import { ageAllPlayers } from '@/lib/player-aging'

const MS_PER_DAY = 1000 * 60 * 60 * 24

type SeasonFormatter = (season: string) => string

const incrementSeason: SeasonFormatter = (season) => {
  const seasonMatch = season.match(/^(\d{4})-(\d{2})$/)
  if (!seasonMatch) {
    return season
  }

  const startYear = Number.parseInt(seasonMatch[1], 10)
  const endYear = Number.parseInt(seasonMatch[2], 10)

  const newStartYear = startYear + 1
  const newEndYear = (endYear + 1) % 100

  return `${newStartYear}-${newEndYear.toString().padStart(2, '0')}`
}

export async function ensureGameTime() {
  return prisma.gameTime.upsert({
    where: { id: 'singleton' },
    create: {
      id: 'singleton',
      currentDate: new Date(),
      currentSeason: '2025-26',
      dayNumber: 0,
      weekNumber: 0,
    },
    update: {},
  })
}

export async function getGameTime() {
  return ensureGameTime()
}

export async function advanceTimeline(days: number = 1) {
  if (days < 1) {
    return ensureGameTime()
  }

  const gameTime = await ensureGameTime()

  const newDayNumber = gameTime.dayNumber + days
  const newWeekNumber = Math.floor(newDayNumber / 7)

  const newDate = new Date(gameTime.currentDate)
  newDate.setTime(newDate.getTime() + days * MS_PER_DAY)

  let currentSeason = gameTime.currentSeason
  if (newWeekNumber > gameTime.weekNumber) {
    const seasonsToAdvance = newWeekNumber - gameTime.weekNumber
    for (let index = 0; index < seasonsToAdvance; index += 1) {
      currentSeason = incrementSeason(currentSeason)
    }
  }

  const updatedGameTime = await prisma.gameTime.update({
    where: { id: 'singleton' },
    data: {
      dayNumber: newDayNumber,
      weekNumber: newWeekNumber,
      currentDate: newDate,
      currentSeason,
      lastUpdated: new Date(),
    },
  })

  if (newWeekNumber > gameTime.weekNumber) {
    const weeksToProcess = newWeekNumber - gameTime.weekNumber
    for (let index = 0; index < weeksToProcess; index += 1) {
      await ageAllPlayers()
    }
  }

  return updatedGameTime
}

