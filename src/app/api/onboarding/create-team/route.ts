import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { revalidatePath } from 'next/cache'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { deriveShortName } from '@/lib/team-utils'
import { generateTeamPlayers } from '@/lib/player-generator'

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    return NextResponse.json({ error: 'You must be signed in to create a team.' }, { status: 401 })
  }

  try {
    const body = await request.json() as {
      teamName?: string
      shortName?: string
      homeGround?: string
    }

    const rawName = body.teamName?.trim()
    if (!rawName) {
      return NextResponse.json({ error: 'Team name is required.' }, { status: 400 })
    }

    const shortName = body.shortName?.trim() || deriveShortName(rawName)
    if (!shortName || shortName.length < 2) {
      return NextResponse.json({ error: 'Short name must be at least 2 characters.' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        hasCompletedOnboarding: true,
        team: {
          select: { id: true },
        },
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User account not found.' }, { status: 404 })
    }

    if (user.hasCompletedOnboarding || user.team) {
      return NextResponse.json({ error: 'Onboarding already completed.' }, { status: 409 })
    }

    const existingTeam = await prisma.team.findFirst({
      where: {
        OR: [
          { name: rawName },
          { shortName },
        ],
      },
      select: { id: true },
    })

    if (existingTeam) {
      return NextResponse.json({ error: 'A team with this name or short name already exists.' }, { status: 409 })
    }

    const team = await prisma.$transaction(async (tx) => {
      const createdTeam = await tx.team.create({
        data: {
          name: rawName,
          shortName,
          homeGround: body.homeGround?.trim() || null,
          ownerId: session.user.id,
        },
      })

      const players = generateTeamPlayers()

      if (players.length > 0) {
        await tx.player.createMany({
          data: players.map((player) => ({
            ...player,
            teamId: createdTeam.id,
          })),
        })
      }

      await tx.user.update({
        where: { id: session.user.id },
        data: { hasCompletedOnboarding: true },
      })

      return createdTeam
    })

    revalidatePath('/teams')
    return NextResponse.json({ success: true, teamId: team.id })
  } catch (error) {
    console.error('Onboarding team creation failed', error)
    return NextResponse.json({ error: 'Failed to create team.' }, { status: 500 })
  }
}
