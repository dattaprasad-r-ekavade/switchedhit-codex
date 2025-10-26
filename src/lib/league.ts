import { LeagueStatus } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { ensureGameTime } from '@/lib/timeline'

type RoundRobinFixture = {
  homeTeamId: string
  awayTeamId: string
  round: number
}

export type CreateLeagueInput = {
  name: string
  tier: number
  season?: string
  maxTeams?: number
  teamIds: string[]
  startDate?: Date
}

type TeamAggregate = {
  played: number
  won: number
  lost: number
  tied: number
  noResult: number
  runsFor: number
  runsAgainst: number
  oversFaced: number
  oversBowled: number
  results: string[]
}

const DEFAULT_MAX_TEAMS = 16
const FIXTURE_SPACING_DAYS = 2

export function generateRoundRobinFixtures(teamIds: string[]): RoundRobinFixture[] {
  if (teamIds.length < 2) {
    return []
  }

  const teams = [...teamIds]
  const isOdd = teams.length % 2 === 1

  if (isOdd) {
    teams.push('BYE')
  }

  const rounds = teams.length - 1
  const fixtures: RoundRobinFixture[] = []

  for (let round = 0; round < rounds; round += 1) {
    for (let index = 0; index < teams.length / 2; index += 1) {
      const home = teams[index]
      const away = teams[teams.length - 1 - index]

      if (home !== 'BYE' && away !== 'BYE') {
        fixtures.push({ homeTeamId: home, awayTeamId: away, round: round + 1 })
      }
    }

    const [first, ...rest] = teams
    rest.unshift(rest.pop() as string)
    teams.splice(0, teams.length, first, ...rest)
  }

  const reverseFixtures = fixtures.map((fixture) => ({
    homeTeamId: fixture.awayTeamId,
    awayTeamId: fixture.homeTeamId,
    round: fixture.round + rounds,
  }))

  return [...fixtures, ...reverseFixtures]
}

function calculateRunRate(runs: number, overs: number) {
  if (overs <= 0) {
    return 0
  }
  return runs / overs
}

function formatStreak(results: string[]) {
  if (results.length === 0) {
    return null
  }

  const recent = results.slice(-5).reverse()
  return recent.join('')
}

export async function createLeague(input: CreateLeagueInput) {
  const { name, tier, teamIds, maxTeams = DEFAULT_MAX_TEAMS } = input

  if (!name || !name.trim()) {
    throw new Error('League name is required.')
  }

  if (!Number.isFinite(tier) || tier < 1) {
    throw new Error('Tier must be a positive integer.')
  }

  const uniqueTeamIds = Array.from(new Set(teamIds.map((teamId) => teamId.trim()))).filter(Boolean)

  if (uniqueTeamIds.length < 2) {
    throw new Error('At least two teams are required to form a league.')
  }

  if (uniqueTeamIds.length > maxTeams) {
    throw new Error(`Selected teams exceed the configured maximum (${maxTeams}).`)
  }

  const [gameTime, teams] = await Promise.all([
    ensureGameTime(),
    prisma.team.findMany({
      where: { id: { in: uniqueTeamIds } },
      select: { id: true, name: true, homeGround: true },
    }),
  ])

  if (teams.length !== uniqueTeamIds.length) {
    throw new Error('One or more selected teams could not be found.')
  }

  const season = input.season?.trim() || gameTime.currentSeason
  const startDate = input.startDate instanceof Date ? input.startDate : new Date(gameTime.currentDate)
  const fixtures = generateRoundRobinFixtures(uniqueTeamIds)

  if (fixtures.length === 0) {
    throw new Error('Unable to generate fixtures for the provided teams.')
  }

  return prisma.$transaction(async (tx) => {
    const league = await tx.league.create({
      data: {
        name: name.trim(),
        tier: Math.floor(tier),
        season,
        maxTeams,
        status: LeagueStatus.UPCOMING,
      },
    })

    await tx.leagueStanding.createMany({
      data: uniqueTeamIds.map((teamId) => ({
        leagueId: league.id,
        teamId,
      })),
    })

    const { _max } = await tx.match.aggregate({
      _max: { matchNumber: true },
    })

    let nextMatchNumber = (_max.matchNumber ?? 0) + 1
    const matchesData = fixtures.map((fixture, index) => {
      const scheduledDate = new Date(startDate)
      scheduledDate.setDate(scheduledDate.getDate() + index * FIXTURE_SPACING_DAYS)

      const homeTeam = teams.find((team) => team.id === fixture.homeTeamId)

      return {
        matchNumber: nextMatchNumber++,
        venue: homeTeam?.homeGround || 'TBD Stadium',
        date: scheduledDate,
        matchType: 'T20',
        status: 'SCHEDULED',
        homeTeamId: fixture.homeTeamId,
        awayTeamId: fixture.awayTeamId,
        leagueId: league.id,
      }
    })

    await tx.match.createMany({
      data: matchesData,
    })

    return league
  })
}

export async function updateLeagueStandings(leagueId: string) {
  const league = await prisma.league.findUnique({
    where: { id: leagueId },
    include: {
      standings: true,
      matches: {
        include: { innings: true },
        orderBy: { date: 'asc' },
      },
    },
  })

  if (!league) {
    return
  }

  const aggregates = new Map<string, TeamAggregate>()
  league.standings.forEach((standing) => {
    aggregates.set(standing.teamId, {
      played: 0,
      won: 0,
      lost: 0,
      tied: 0,
      noResult: 0,
      runsFor: 0,
      runsAgainst: 0,
      oversFaced: 0,
      oversBowled: 0,
      results: [],
    })
  })

  let completedMatches = 0

  league.matches.forEach((match) => {
    if (match.status !== 'COMPLETED' || match.innings.length === 0) {
      return
    }

    completedMatches += 1
    const orderedInnings = [...match.innings].sort((a, b) => a.inningsNumber - b.inningsNumber)
    const firstInnings = orderedInnings[0]
    const secondInnings = orderedInnings[1]

    if (!firstInnings || !secondInnings) {
      return
    }

    const firstTeamAggregate = aggregates.get(firstInnings.battingTeamId)
    const secondTeamAggregate = aggregates.get(secondInnings.battingTeamId)

    if (!firstTeamAggregate || !secondTeamAggregate) {
      return
    }

    const firstRuns = firstInnings.totalRuns
    const firstOvers = firstInnings.totalOvers
    const secondRuns = secondInnings.totalRuns
    const secondOvers = secondInnings.totalOvers

    firstTeamAggregate.played += 1
    secondTeamAggregate.played += 1

    firstTeamAggregate.runsFor += firstRuns
    firstTeamAggregate.runsAgainst += secondRuns
    firstTeamAggregate.oversFaced += firstOvers
    firstTeamAggregate.oversBowled += secondOvers

    secondTeamAggregate.runsFor += secondRuns
    secondTeamAggregate.runsAgainst += firstRuns
    secondTeamAggregate.oversFaced += secondOvers
    secondTeamAggregate.oversBowled += firstOvers

    if (match.winnerTeamId === firstInnings.battingTeamId) {
      firstTeamAggregate.won += 1
      secondTeamAggregate.lost += 1
      firstTeamAggregate.results.push('W')
      secondTeamAggregate.results.push('L')
    } else if (match.winnerTeamId === secondInnings.battingTeamId) {
      secondTeamAggregate.won += 1
      firstTeamAggregate.lost += 1
      secondTeamAggregate.results.push('W')
      firstTeamAggregate.results.push('L')
    } else {
      firstTeamAggregate.tied += 1
      secondTeamAggregate.tied += 1
      firstTeamAggregate.results.push('T')
      secondTeamAggregate.results.push('T')
    }
  })

  const totalMatchesScheduled = league.matches.length
  const leagueStatusUpdate: LeagueStatus | null =
    completedMatches === 0 && league.status === LeagueStatus.UPCOMING
      ? LeagueStatus.UPCOMING
      : completedMatches < totalMatchesScheduled
        ? LeagueStatus.ACTIVE
        : completedMatches > 0
          ? LeagueStatus.COMPLETED
          : null

  await prisma.$transaction(async (tx) => {
    await Promise.all(
      league.standings.map((standing) => {
        const aggregate = aggregates.get(standing.teamId)

        if (!aggregate) {
          return Promise.resolve()
        }

        const points = aggregate.won * 2 + aggregate.tied
        const runRateFor = calculateRunRate(aggregate.runsFor, aggregate.oversFaced)
        const runRateAgainst = calculateRunRate(aggregate.runsAgainst, aggregate.oversBowled)
        const netRunRate = Number((runRateFor - runRateAgainst).toFixed(3))

        return tx.leagueStanding.update({
          where: { id: standing.id },
          data: {
            played: aggregate.played,
            won: aggregate.won,
            lost: aggregate.lost,
            tied: aggregate.tied,
            noResult: aggregate.noResult,
            points,
            netRunRate,
            streak: formatStreak(aggregate.results),
          },
        })
      }),
    )

    if (leagueStatusUpdate && leagueStatusUpdate !== league.status) {
      await tx.league.update({
        where: { id: league.id },
        data: { status: leagueStatusUpdate },
      })
    }
  })
}

function sortStandingsForPromotion(standings: { teamId: string; points: number; netRunRate: number }[]) {
  return [...standings].sort((a, b) => {
    if (b.points !== a.points) {
      return b.points - a.points
    }
    return b.netRunRate - a.netRunRate
  })
}

export async function rolloverLeaguesForNewSeason(previousSeason: string, newSeason: string) {
  if (!previousSeason || !newSeason || previousSeason === newSeason) {
    return
  }

  const completedLeagues = await prisma.league.findMany({
    where: {
      season: previousSeason,
      status: LeagueStatus.COMPLETED,
    },
    include: {
      standings: {
        select: {
          teamId: true,
          points: true,
          netRunRate: true,
        },
      },
    },
    orderBy: { tier: 'asc' },
  })

  if (completedLeagues.length === 0) {
    return
  }

  const tierAssignments = new Map<number, string[]>()
  const tierNames = new Map<number, string>()
  const tierMaxTeams = new Map<number, number>()

  completedLeagues.forEach((league) => {
    const sortedStandings = sortStandingsForPromotion(league.standings)
    const existingAssignments = tierAssignments.get(league.tier) ?? []
    tierAssignments.set(
      league.tier,
      existingAssignments.concat(sortedStandings.map((standing) => standing.teamId)),
    )
    if (!tierNames.has(league.tier)) {
      tierNames.set(league.tier, league.name)
    }
    tierMaxTeams.set(league.tier, league.maxTeams)
  })

  const tiers = Array.from(tierAssignments.keys()).sort((a, b) => a - b)
  if (tiers.length === 0) {
    return
  }

  const maxTier = Math.max(...tiers)
  const nextAssignments = new Map<number, string[]>()

  tiers.forEach((tier) => {
    nextAssignments.set(tier, [])
  })

  const promotionsToTier = new Map<number, string[]>()
  const relegationsToTier = new Map<number, string[]>()

  tiers.forEach((tier) => {
    const teams = [...(tierAssignments.get(tier) ?? [])]

    const promotionEligible = tier > 1 ? teams.splice(0, Math.min(3, teams.length)) : []
    const relegationEligible = tier < maxTier ? teams.splice(Math.max(teams.length - 3, 0)) : []

    if (tier > 1 && promotionEligible.length > 0) {
      const promotedTo = tier - 1
      const queue = promotionsToTier.get(promotedTo) ?? []
      promotionsToTier.set(promotedTo, [...queue, ...promotionEligible])
    }

    if (tier < maxTier && relegationEligible.length > 0) {
      const relegatedTo = tier + 1
      const queue = relegationsToTier.get(relegatedTo) ?? []
      relegationsToTier.set(relegatedTo, [...queue, ...relegationEligible])
    }

    nextAssignments.set(tier, teams)
  })

  tiers.forEach((tier) => {
    const remaining = nextAssignments.get(tier) ?? []
    const promoted = promotionsToTier.get(tier) ?? []
    const relegated = relegationsToTier.get(tier) ?? []
    nextAssignments.set(tier, [...remaining, ...promoted, ...relegated])
  })

  for (const tier of tiers) {
    const teamIds = nextAssignments.get(tier) ?? []
    if (teamIds.length < 2) {
      continue
    }

    const existingLeague = await prisma.league.findFirst({
      where: { season: newSeason, tier },
      select: { id: true },
    })

    if (existingLeague) {
      continue
    }

    const maxTeams = tierMaxTeams.get(tier) ?? DEFAULT_MAX_TEAMS
    const trimmedTeamIds = teamIds.slice(0, maxTeams)

    const leagueName = tierNames.get(tier) ?? `Tier ${tier} League`

    await createLeague({
      name: `${leagueName} ${newSeason}`,
      tier,
      season: newSeason,
      maxTeams,
      teamIds: trimmedTeamIds,
    })
  }
}
