import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import type { SimulationConfig } from '@prisma/client'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import {
  BALANCED_SIMULATION_CONFIG,
  SIMULATION_CONFIG_PRESETS,
} from '@/lib/simulation-config-presets'
import { normalizeSimulationConfig } from '@/lib/simulation'
import SimulationConfigManager, { type SerializedConfig } from './simulation-config-manager'

export const metadata = {
  title: 'Simulation Configuration',
}

export default async function SimulationConfigPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    const callbackUrl = encodeURIComponent('/admin/simulation/config')
    redirect(`/auth/login?callbackUrl=${callbackUrl}`)
  }

  if (session.user.role !== 'ADMIN') {
    redirect('/dashboard')
  }

  const configs = await prisma.simulationConfig.findMany({
    orderBy: { createdAt: 'desc' },
  })

  const serializedConfigs: SerializedConfig[] = configs.map((config: SimulationConfig) => ({
    id: config.id,
    name: config.name,
    isActive: config.isActive,
    notes: config.notes,
    createdAt: config.createdAt.toISOString(),
    updatedAt: config.updatedAt.toISOString(),
    ...normalizeSimulationConfig(config),
  }))

  const activeConfigId = serializedConfigs.find((config) => config.isActive)?.id ?? null

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold">Simulation tuning</h1>
        <p className="text-muted-foreground">
          Adjust core engine probabilities, pitch conditions, and run-scoring behaviour.
        </p>
      </div>

      <SimulationConfigManager
        initialConfigs={serializedConfigs}
        activeConfigId={activeConfigId}
        presets={SIMULATION_CONFIG_PRESETS}
        defaults={BALANCED_SIMULATION_CONFIG}
      />
    </div>
  )
}
