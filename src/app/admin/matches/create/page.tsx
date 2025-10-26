import type { Metadata } from 'next'
import MatchForm from '@/components/forms/match-form'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { prisma } from '@/lib/prisma'

export const metadata: Metadata = {
  title: 'Admin - Schedule Match'
}

export default async function AdminScheduleMatchPage() {
  const [teams, leagues] = await Promise.all([
    prisma.team.findMany({
      select: {
        id: true,
        name: true,
        shortName: true
      },
      orderBy: {
        name: 'asc'
      }
    }),
    prisma.league.findMany({
      where: {
        status: {
          in: ['UPCOMING', 'ACTIVE']
        }
      },
      select: {
        id: true,
        name: true,
        season: true,
        tier: true
      },
      orderBy: [
        { season: 'desc' },
        { tier: 'asc' },
        { name: 'asc' }
      ]
    })
  ])

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Schedule a match</CardTitle>
          <CardDescription>
            Create fixtures between any two teams. Matches start in the scheduled status.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <MatchForm teams={teams} leagues={leagues} />
        </CardContent>
      </Card>
    </div>
  )
}

