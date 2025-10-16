import type { Metadata } from 'next'
import MatchForm from '@/components/forms/match-form'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { prisma } from '@/lib/prisma'

export const metadata: Metadata = {
  title: 'Admin - Schedule Match'
}

export default async function AdminScheduleMatchPage() {
  const teams = await prisma.team.findMany({
    select: {
      id: true,
      name: true,
      shortName: true
    },
    orderBy: {
      name: 'asc'
    }
  })

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
          <MatchForm teams={teams} />
        </CardContent>
      </Card>
    </div>
  )
}

