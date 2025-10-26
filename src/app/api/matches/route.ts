import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { revalidatePath } from 'next/cache'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    return NextResponse.json({ error: 'You must be signed in to schedule a match.' }, { status: 401 })
  }

  if (session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Only admins can schedule matches.' }, { status: 403 })
  }

  try {
    const body = await request.json() as {
      homeTeamId?: string
      awayTeamId?: string
      venue?: string
      date?: string
      matchType?: string
      matchNumber?: number
      leagueId?: string
    }

    const homeTeamId = body.homeTeamId?.trim()
    const awayTeamId = body.awayTeamId?.trim()
    const venue = body.venue?.trim()
    const matchType = body.matchType?.trim() || 'T20'
    const date = body.date ? new Date(body.date) : null
    const matchNumberInput = body.matchNumber
    const leagueId = body.leagueId?.trim()

    if (!homeTeamId || !awayTeamId) {
      return NextResponse.json({ error: 'Home and away teams are required.' }, { status: 400 })
    }

    if (homeTeamId === awayTeamId) {
      return NextResponse.json({ error: 'Home and away teams must be different.' }, { status: 400 })
    }

    if (!venue) {
      return NextResponse.json({ error: 'Venue is required.' }, { status: 400 })
    }

    if (!date || Number.isNaN(date.getTime())) {
      return NextResponse.json({ error: 'Valid match date is required.' }, { status: 400 })
    }

    const [homeTeam, awayTeam] = await Promise.all([
      prisma.team.findUnique({ where: { id: homeTeamId } }),
      prisma.team.findUnique({ where: { id: awayTeamId } })
    ])

    if (!homeTeam || !awayTeam) {
      return NextResponse.json({ error: 'One or both teams could not be found.' }, { status: 404 })
    }

    const matchConflict = await prisma.match.findFirst({
      where: {
        AND: [
          { date },
          {
            OR: [
              { homeTeamId },
              { awayTeamId },
              { homeTeamId: awayTeamId, awayTeamId: homeTeamId }
            ]
          }
        ]
      }
    })

    if (matchConflict) {
      return NextResponse.json({ error: 'A match is already scheduled for one of the teams at that time.' }, { status: 409 })
    }

    let matchNumber = typeof matchNumberInput === 'number' && Number.isFinite(matchNumberInput)
      ? Math.floor(matchNumberInput)
      : null

    if (matchNumber && matchNumber > 0) {
      const existingMatchWithNumber = await prisma.match.findFirst({
        where: { matchNumber }
      })

      if (existingMatchWithNumber) {
        return NextResponse.json({ error: `Match number ${matchNumber} is already in use.` }, { status: 409 })
      }
    } else {
      const { _max } = await prisma.match.aggregate({
        _max: { matchNumber: true }
      })
      matchNumber = (_max.matchNumber ?? 0) + 1
    }

    let leagueValidation: { id: string } | null = null

    if (leagueId) {
      const league = await prisma.league.findUnique({
        where: { id: leagueId },
        include: {
          standings: {
            select: { teamId: true },
          },
        },
      })

      if (!league) {
        return NextResponse.json({ error: 'League could not be found.' }, { status: 404 })
      }

      if (league.status === 'COMPLETED') {
        return NextResponse.json({ error: 'Cannot schedule matches in a completed league.' }, { status: 409 })
      }

      const allowedTeamIds = new Set(league.standings.map((standing) => standing.teamId))

      if (!allowedTeamIds.has(homeTeamId) || !allowedTeamIds.has(awayTeamId)) {
        return NextResponse.json({ error: 'Both teams must belong to the selected league.' }, { status: 400 })
      }

      leagueValidation = { id: league.id }
    }

    const match = await prisma.match.create({
      data: {
        matchNumber,
        venue,
        date,
        matchType,
        status: 'SCHEDULED',
        homeTeamId,
        awayTeamId,
        leagueId: leagueValidation?.id ?? null
      },
      select: { id: true }
    })

    revalidatePath('/matches')
    revalidatePath('/admin')

    if (leagueValidation) {
      revalidatePath('/leagues')
      revalidatePath(`/leagues/${leagueValidation.id}`)
    }

    return NextResponse.json({ success: true, matchId: match.id })
  } catch (error) {
    console.error('Failed to schedule match', error)
    return NextResponse.json({ error: 'Failed to schedule match.' }, { status: 500 })
  }
}

