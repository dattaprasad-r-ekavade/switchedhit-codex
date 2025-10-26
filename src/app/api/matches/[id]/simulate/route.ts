import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { revalidatePath } from 'next/cache'
import type { Player } from '@prisma/client'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import {
  CricketSimulator,
  normalizeSimulationConfig,
  type BallResult,
  type PlayerStats as SimulatorPlayerStats,
} from '@/lib/simulation'
import { updateLeagueStandings } from '@/lib/league'

type Params = {
  params: {
    id: string
  }
}

function battingRating(player: Player) {
  const pace = player.battingVsPace ?? player.battingSkill
  const spin = player.battingVsSpin ?? player.battingSkill
  return Math.round((pace + spin) / 2)
}

function bowlingRating(player: Player) {
  const pace = player.bowlingPace ?? player.bowlingSkill
  const spin = player.bowlingSpin ?? player.bowlingSkill

  if (!player.bowlingStyle) {
    return Math.round((pace + spin) / 2)
  }

  if (player.bowlingStyle === 'FAST' || player.bowlingStyle === 'MEDIUM') {
    return Math.round(pace * 0.7 + spin * 0.3)
  }

  return Math.round(spin * 0.7 + pace * 0.3)
}

function selectPlayingXI(players: Player[]) {
  if (players.length < 11) {
    throw new Error('Each team requires at least 11 players to simulate a match.')
  }

  const sorted = [...players].sort((a, b) => {
    const aScore = battingRating(a) + bowlingRating(a)
    const bScore = battingRating(b) + bowlingRating(b)
    return bScore - aScore
  })

  const selected = sorted.slice(0, 11)
  const hasKeeper = selected.some((player) => player.role === 'WICKET_KEEPER')

  if (!hasKeeper) {
    const keeperCandidate = sorted.find((player) => player.role === 'WICKET_KEEPER')
    if (keeperCandidate) {
      selected[selected.length - 1] = keeperCandidate
    }
  }

  return selected
}

function toPlayerStats(players: Player[]): SimulatorPlayerStats[] {
  return players.map((player) => {
    const battingValue = battingRating(player)
    const bowlingValue = bowlingRating(player)

    return {
      name: player.name,
      role: player.role,
      battingStyle: player.battingStyle,
      bowlingStyle: player.bowlingStyle,
      battingVsPace: player.battingVsPace ?? player.battingSkill,
      battingVsSpin: player.battingVsSpin ?? player.battingSkill,
      bowlingPace: player.bowlingPace ?? player.bowlingSkill,
      bowlingSpin: player.bowlingSpin ?? player.bowlingSkill,
      fieldingSkill: player.fieldingSkill ?? 50,
      wicketKeeping:
        player.wicketKeeping ?? (player.role === 'WICKET_KEEPER' ? 65 : 0),
      battingRating: battingValue,
      bowlingRating: bowlingValue,
    }
  })
}

function buildBallRows(
  inningsId: string,
  balls: BallResult[]
) {
  return balls.map((ball, index) => {
    const overNumber = Math.floor(index / 6) + 1
    const ballNumber = (index % 6) + 1
    return {
      inningsId,
      overNumber,
      ballNumber,
      batsmanName: ball.batsmanName,
      bowlerName: ball.bowlerName,
      runs: ball.runs,
      isWicket: ball.isWicket,
      isExtra: ball.isExtra,
      extraType: ball.extraType ?? null,
      wicketType: ball.wicketType ?? null,
      dismissedPlayer: ball.isWicket ? ball.batsmanName : null
    }
  })
}

function aggregatePerformance(
  balls: BallResult[],
  runsMap: Map<string, number>,
  wicketsMap: Map<string, number>
) {
  balls.forEach((ball) => {
    if (!ball.isExtra) {
      runsMap.set(ball.batsmanName, (runsMap.get(ball.batsmanName) ?? 0) + ball.runs)
    }

    if (ball.isWicket) {
      wicketsMap.set(ball.bowlerName, (wicketsMap.get(ball.bowlerName) ?? 0) + 1)
    }
  })
}

export async function POST(request: Request, { params }: Params) {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    return NextResponse.json({ error: 'You must be signed in to simulate a match.' }, { status: 401 })
  }

  if (session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Only admins can simulate matches.' }, { status: 403 })
  }

  const match = await prisma.match.findUnique({
    where: { id: params.id },
    include: {
      homeTeam: true,
      awayTeam: true,
      innings: true
    }
  })

  if (!match) {
    return NextResponse.json({ error: 'Match not found.' }, { status: 404 })
  }

  if (match.status !== 'SCHEDULED') {
    return NextResponse.json({ error: 'Only scheduled matches can be simulated.' }, { status: 400 })
  }

  if (match.innings.length > 0) {
    return NextResponse.json({ error: 'This match already has simulation data.' }, { status: 409 })
  }

  const [homePlayers, awayPlayers] = await Promise.all([
    prisma.player.findMany({
      where: { teamId: match.homeTeamId }
    }),
    prisma.player.findMany({
      where: { teamId: match.awayTeamId }
    })
  ])

  let homeXI: Player[]
  let awayXI: Player[]

  try {
    homeXI = selectPlayingXI(homePlayers)
    awayXI = selectPlayingXI(awayPlayers)
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 })
  }

  const activeConfig = await prisma.simulationConfig.findFirst({
    where: { isActive: true },
  })

  const simulator = new CricketSimulator(normalizeSimulationConfig(activeConfig))

  const tossWinnerTeamId = Math.random() > 0.5 ? match.homeTeamId : match.awayTeamId
  const tossDecision = Math.random() > 0.5 ? 'BAT' : 'BOWL'
  const battingFirstTeamId =
    tossDecision === 'BAT'
      ? tossWinnerTeamId
      : tossWinnerTeamId === match.homeTeamId
        ? match.awayTeamId
        : match.homeTeamId

  const battingSecondTeamId = battingFirstTeamId === match.homeTeamId ? match.awayTeamId : match.homeTeamId

  const firstBattingPlayers = battingFirstTeamId === match.homeTeamId ? homeXI : awayXI
  const firstBowlingPlayers = battingFirstTeamId === match.homeTeamId ? awayXI : homeXI
  const secondBattingPlayers = battingFirstTeamId === match.homeTeamId ? awayXI : homeXI
  const secondBowlingPlayers = battingFirstTeamId === match.homeTeamId ? homeXI : awayXI

  const firstInningsResult = simulator.simulateInnings(
    toPlayerStats(firstBattingPlayers).sort((a, b) => b.battingRating - a.battingRating),
    toPlayerStats(secondBowlingPlayers).sort((a, b) => b.bowlingRating - a.bowlingRating)
  )

  const targetScore = firstInningsResult.totalRuns + 1

  const secondInningsResult = simulator.simulateInnings(
    toPlayerStats(secondBattingPlayers).sort((a, b) => b.battingRating - a.battingRating),
    toPlayerStats(firstBowlingPlayers).sort((a, b) => b.bowlingRating - a.bowlingRating),
    20,
    targetScore
  )

  const outcome = simulator.determineWinner(firstInningsResult, secondInningsResult)

  const teamLookup = new Map([
    [match.homeTeamId, match.homeTeam],
    [match.awayTeamId, match.awayTeam]
  ])

  const firstBattingTeam = teamLookup.get(battingFirstTeamId)
  const secondBattingTeam = teamLookup.get(battingSecondTeamId)

  if (!firstBattingTeam || !secondBattingTeam) {
    return NextResponse.json({ error: 'Unable to resolve team information.' }, { status: 500 })
  }

  const runsByPlayer = new Map<string, number>()
  const wicketsByPlayer = new Map<string, number>()

  aggregatePerformance(firstInningsResult.balls, runsByPlayer, wicketsByPlayer)
  aggregatePerformance(secondInningsResult.balls, runsByPlayer, wicketsByPlayer)

  const extrasFirst = firstInningsResult.balls.reduce(
    (total, ball) => total + (ball.isExtra ? ball.runs : 0),
    0
  )

  const extrasSecond = secondInningsResult.balls.reduce(
    (total, ball) => total + (ball.isExtra ? ball.runs : 0),
    0
  )

  const winnerTeamId =
    outcome.winner === 'TEAM1'
      ? battingFirstTeamId
      : outcome.winner === 'TEAM2'
        ? battingSecondTeamId
        : null

  const winnerTeam = winnerTeamId ? teamLookup.get(winnerTeamId) : null
  const loserTeam =
    winnerTeamId === battingFirstTeamId
      ? teamLookup.get(battingSecondTeamId)
      : winnerTeamId === battingSecondTeamId
        ? teamLookup.get(battingFirstTeamId)
        : null

  let resultText = 'Match tied'
  let winByRuns: number | null = null
  let winByWickets: number | null = null

  if (outcome.winner === 'TEAM1' && winnerTeam && loserTeam) {
    resultText = `${winnerTeam.name} won by ${outcome.margin} ${outcome.marginType.toLowerCase()}`
    if (outcome.marginType === 'RUNS') {
      winByRuns = outcome.margin
    } else {
      winByWickets = outcome.margin
    }
  } else if (outcome.winner === 'TEAM2' && winnerTeam && loserTeam) {
    resultText = `${winnerTeam.name} won by ${outcome.margin} ${outcome.marginType.toLowerCase()}`
    if (outcome.marginType === 'RUNS') {
      winByRuns = outcome.margin
    } else {
      winByWickets = outcome.margin
    }
  }

  let manOfTheMatch: string | null = null
  if (winnerTeamId) {
    const winnerPlayers =
      winnerTeamId === match.homeTeamId ? homeXI : awayXI
    manOfTheMatch = winnerPlayers.reduce((currentBest: { name: string; score: number } | null, player) => {
      const runs = runsByPlayer.get(player.name) ?? 0
      const wickets = wicketsByPlayer.get(player.name) ?? 0
      const performanceScore = runs + wickets * 25

      if (!currentBest || performanceScore > currentBest.score) {
        return { name: player.name, score: performanceScore }
      }

      return currentBest
    }, null)?.name ?? null
  }

  await prisma.$transaction(async (tx) => {
    const firstInningsRecord = await tx.innings.create({
      data: {
        matchId: match.id,
        battingTeamId: battingFirstTeamId,
        bowlingTeamId: battingSecondTeamId,
        inningsNumber: 1,
        totalRuns: firstInningsResult.totalRuns,
        totalWickets: firstInningsResult.totalWickets,
        totalOvers: firstInningsResult.totalOvers,
        extras: extrasFirst
      }
    })

    const secondInningsRecord = await tx.innings.create({
      data: {
        matchId: match.id,
        battingTeamId: battingSecondTeamId,
        bowlingTeamId: battingFirstTeamId,
        inningsNumber: 2,
        totalRuns: secondInningsResult.totalRuns,
        totalWickets: secondInningsResult.totalWickets,
        totalOvers: secondInningsResult.totalOvers,
        extras: extrasSecond
      }
    })

    if (firstInningsResult.balls.length > 0) {
      await tx.ball.createMany({
        data: buildBallRows(firstInningsRecord.id, firstInningsResult.balls)
      })
    }

    if (secondInningsResult.balls.length > 0) {
      await tx.ball.createMany({
        data: buildBallRows(secondInningsRecord.id, secondInningsResult.balls)
      })
    }

    await tx.match.update({
      where: { id: match.id },
      data: {
        status: 'COMPLETED',
        tossWinner: teamLookup.get(tossWinnerTeamId)?.name ?? null,
        tossDecision,
        result: resultText,
        winnerTeamId,
        winByRuns,
        winByWickets,
        manOfTheMatch
      }
    })
  })

  if (match.leagueId) {
    await updateLeagueStandings(match.leagueId)
  }

  revalidatePath('/matches')
  revalidatePath(`/matches/${match.id}`)
  revalidatePath('/admin')
  if (match.leagueId) {
    revalidatePath('/leagues')
    revalidatePath(`/leagues/${match.leagueId}`)
  }

  return NextResponse.json({ success: true })
}

