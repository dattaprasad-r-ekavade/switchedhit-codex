import type { Metadata } from 'next'
import { prisma } from '@/lib/prisma'
import { ensureGameTime } from '@/lib/timeline'
import LeagueForm from '@/components/forms/league-form'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export const metadata: Metadata = {
  title: 'Admin - Create League',
}

export default async function AdminCreateLeaguePage() {
  const [gameTime, teams] = await Promise.all([
    ensureGameTime(),
    prisma.team.findMany({
      select: {
        id: true,
        name: true,
        shortName: true,
        homeGround: true,
      },
      orderBy: {
        name: 'asc',
      },
    }),
  ])

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Create a league</CardTitle>
          <CardDescription>
            Configure league metadata, choose participating teams, and auto-generate fixtures.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LeagueForm teams={teams} defaultSeason={gameTime.currentSeason} />
        </CardContent>
      </Card>
    </div>
  )
}
