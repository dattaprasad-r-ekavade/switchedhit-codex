import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { revalidatePath } from 'next/cache'
import { authOptions } from '@/lib/auth'
import { createLeague } from '@/lib/league'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const leagues = await prisma.league.findMany({
    orderBy: [
      { season: 'desc' },
      { tier: 'asc' },
    ],
    include: {
      standings: {
        select: {
          id: true,
        },
      },
      _count: {
        select: {
          matches: true,
        },
      },
    },
  })

  return NextResponse.json({
    leagues: leagues.map((league) => ({
      id: league.id,
      name: league.name,
      tier: league.tier,
      season: league.season,
      status: league.status,
      teamCount: league.standings.length,
      matchCount: league._count.matches,
    })),
  })
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 })
  }

  if (session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Only administrators can create leagues.' }, { status: 403 })
  }

  try {
    const body = await request.json() as {
      name?: string
      tier?: number
      season?: string
      maxTeams?: number
      teamIds?: string[]
      startDate?: string
    }

    const name = body.name?.trim()
    const tier = typeof body.tier === 'number' ? Math.floor(body.tier) : undefined
    const maxTeams = typeof body.maxTeams === 'number' ? Math.floor(body.maxTeams) : undefined
    const teamIds = Array.isArray(body.teamIds) ? body.teamIds : []
    const startDate = body.startDate ? new Date(body.startDate) : undefined

    if (!name) {
      return NextResponse.json({ error: 'League name is required.' }, { status: 400 })
    }

    if (!tier || tier < 1) {
      return NextResponse.json({ error: 'Tier must be a positive integer.' }, { status: 400 })
    }

    if (teamIds.length < 2) {
      return NextResponse.json({ error: 'Select at least two teams for the league.' }, { status: 400 })
    }

    if (startDate && Number.isNaN(startDate.getTime())) {
      return NextResponse.json({ error: 'Start date is invalid.' }, { status: 400 })
    }

    const league = await createLeague({
      name,
      tier,
      season: body.season,
      maxTeams,
      teamIds,
      startDate,
    })

    revalidatePath('/admin/leagues')
    revalidatePath('/leagues')

    return NextResponse.json({ success: true, leagueId: league.id })
  } catch (error) {
    console.error('Failed to create league', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create league.' },
      { status: 500 },
    )
  }
}
