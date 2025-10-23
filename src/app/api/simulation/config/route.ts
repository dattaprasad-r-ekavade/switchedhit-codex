import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import {
  BALANCED_SIMULATION_CONFIG,
  SIMULATION_CONFIG_PRESETS,
  type SimulationConfigValues,
} from '@/lib/simulation-config-presets'
import {
  CricketSimulator,
  normalizeSimulationConfig,
  type PlayerStats as SimulatorPlayerStats,
} from '@/lib/simulation'
import { generateTeamPlayers } from '@/lib/player-generator'

type RequestBody = {
  action?: 'preview' | 'activate'
  id?: string
  config?: Partial<SimulationConfigValues> & {
    id?: string
    notes?: string | null
  }
}

type GeneratedPlayer = ReturnType<typeof generateTeamPlayers>[number]

function ensureAdminSession(session: Awaited<ReturnType<typeof getServerSession>>) {
  if (!session?.user || session.user.role !== 'ADMIN') {
    throw new Error('Only administrators may manage simulation configuration.')
  }
}

function generatedPlayerToStats(player: GeneratedPlayer): SimulatorPlayerStats {
  const battingVsPace = player.battingVsPace ?? player.battingSkill ?? 50
  const battingVsSpin = player.battingVsSpin ?? player.battingSkill ?? 50
  const bowlingPace = player.bowlingPace ?? player.bowlingSkill ?? 50
  const bowlingSpin = player.bowlingSpin ?? player.bowlingSkill ?? 50

  return {
    name: player.name ?? 'Sim Player',
    role: (player.role as string) ?? 'BATSMAN',
    battingStyle: player.battingStyle,
    bowlingStyle: player.bowlingStyle,
    battingVsPace,
    battingVsSpin,
    bowlingPace,
    bowlingSpin,
    fieldingSkill: player.fieldingSkill ?? 50,
    wicketKeeping: player.wicketKeeping ?? 0,
    battingRating: Math.round((battingVsPace + battingVsSpin) / 2),
    bowlingRating: Math.round((bowlingPace + bowlingSpin) / 2),
  }
}

function buildSampleSquad(): SimulatorPlayerStats[] {
  return generateTeamPlayers(15)
    .slice(0, 11)
    .map(generatedPlayerToStats)
}

export async function GET() {
  const session = await getServerSession(authOptions)

  try {
    ensureAdminSession(session)
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 403 }
    )
  }

  const configs = await prisma.simulationConfig.findMany({
    orderBy: { createdAt: 'desc' },
  })

  const activeConfig = configs.find((config) => config.isActive) ?? null

  return NextResponse.json({
    configs: configs.map((config) => ({
      ...config,
      createdAt: config.createdAt.toISOString(),
      updatedAt: config.updatedAt.toISOString(),
    })),
    activeConfigId: activeConfig?.id ?? null,
    presets: SIMULATION_CONFIG_PRESETS,
    defaults: BALANCED_SIMULATION_CONFIG,
  })
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)

  try {
    ensureAdminSession(session)
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 403 }
    )
  }

  const body = (await request.json().catch(() => ({}))) as RequestBody

  if (body.action === 'preview') {
    const tuning = normalizeSimulationConfig(body.config)
    const simulator = new CricketSimulator(tuning)

    const teamA = buildSampleSquad()
    const teamB = buildSampleSquad()

    const firstInnings = simulator.simulateInnings(teamA, teamB, 20)
    const secondInnings = simulator.simulateInnings(
      teamB,
      teamA,
      20,
      firstInnings.totalRuns + 1
    )
    const outcome = simulator.determineWinner(firstInnings, secondInnings)

    return NextResponse.json({
      firstInnings,
      secondInnings,
      outcome,
    })
  }

  if (body.action === 'activate') {
    if (!body.id) {
      return NextResponse.json(
        { error: 'Configuration id is required to activate a config.' },
        { status: 400 }
      )
    }

    const updated = await prisma.$transaction(async (tx) => {
      await tx.simulationConfig.updateMany({
        data: { isActive: false },
      })

      return tx.simulationConfig.update({
        where: { id: body.id as string },
        data: { isActive: true },
      })
    })

    return NextResponse.json({
      success: true,
      config: {
        ...updated,
        createdAt: updated.createdAt.toISOString(),
        updatedAt: updated.updatedAt.toISOString(),
      },
    })
  }

  const payload = body.config

  if (!payload?.name || payload.name.trim().length === 0) {
    return NextResponse.json({ error: 'Configuration name is required.' }, { status: 400 })
  }

  const tuning = normalizeSimulationConfig(payload)

  const data: Omit<SimulationConfigValues, 'name'> & {
    name: string
    notes: string | null
    isActive: boolean
  } = {
    ...tuning,
    name: payload.name.trim(),
    notes: payload.notes?.trim() ?? null,
    isActive: Boolean(payload.isActive),
  }

  const saved = await prisma.$transaction(async (tx) => {
    if (data.isActive) {
      await tx.simulationConfig.updateMany({
        data: { isActive: false },
      })
    }

    if (payload.id) {
      const existing = await tx.simulationConfig.findUnique({
        where: { id: payload.id },
      })

      if (!existing) {
        throw new Error('Configuration not found')
      }

      return tx.simulationConfig.update({
        where: { id: payload.id },
        data,
      })
    }

    return tx.simulationConfig.create({
      data,
    })
  })

  return NextResponse.json({
    success: true,
    config: {
      ...saved,
      createdAt: saved.createdAt.toISOString(),
      updatedAt: saved.updatedAt.toISOString(),
    },
  })
}

