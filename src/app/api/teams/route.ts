import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { revalidatePath } from 'next/cache'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { generateTeamPlayers } from '@/lib/player-generator'

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    return NextResponse.json({ error: 'You must be signed in to create a team.' }, { status: 401 })
  }

  try {
    const body = await request.json() as {
      name?: string
      shortName?: string
      homeGround?: string
      captain?: string
      coach?: string
      founded?: string | number
      logoUrl?: string
      ownerEmail?: string
    }

    const name = body.name?.trim()
    const shortName = body.shortName?.trim()

    if (!name || !shortName) {
      return NextResponse.json({ error: 'Team name and short name are required.' }, { status: 400 })
    }

    const existingTeam = await prisma.team.findFirst({
      where: {
        OR: [
          { name: name },
          { shortName: shortName },
        ],
      },
    })

    if (existingTeam) {
      return NextResponse.json({ error: 'A team with this name or short name already exists.' }, { status: 409 })
    }

    let ownerId = session.user.id

    if (body.ownerEmail && session.user.role === 'ADMIN') {
      const owner = await prisma.user.findUnique({
        where: { email: body.ownerEmail.trim() },
      })

      if (!owner) {
        return NextResponse.json({ error: 'Owner email does not match any user.' }, { status: 404 })
      }

      ownerId = owner.id
    }

    const foundedValue =
      typeof body.founded === 'number'
        ? body.founded
        : body.founded
          ? parseInt(body.founded, 10)
          : null

    const team = await prisma.$transaction(async (tx) => {
      const createdTeam = await tx.team.create({
        data: {
          name,
          shortName,
          homeGround: body.homeGround?.trim() || null,
          captain: body.captain?.trim() || null,
          coach: body.coach?.trim() || null,
          founded: Number.isNaN(foundedValue) ? null : foundedValue,
          logoUrl: body.logoUrl?.trim() || null,
          ownerId,
        },
      })

      const generatedPlayers = generateTeamPlayers()

      if (generatedPlayers.length > 0) {
        await tx.player.createMany({
          data: generatedPlayers.map((player) => ({
            ...player,
            teamId: createdTeam.id,
          })),
        })
      }

      return createdTeam
    })

    revalidatePath('/teams')
    revalidatePath('/admin')

    return NextResponse.json({ success: true, teamId: team.id })
  } catch (error) {
    console.error('Failed to create team', error)
    return NextResponse.json({ error: 'Failed to create team.' }, { status: 500 })
  }
}
