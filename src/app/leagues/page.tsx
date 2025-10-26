import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

function statusVariant(status: string) {
  switch (status) {
    case 'ACTIVE':
      return 'default'
    case 'COMPLETED':
      return 'secondary'
    default:
      return 'outline'
  }
}

export const dynamic = 'force-static'

export default async function LeaguesPage() {
  const leagues = await prisma.league.findMany({
    orderBy: [
      { season: 'desc' },
      { tier: 'asc' },
    ],
    include: {
      standings: true,
    },
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold">Leagues and Standings</h1>
        <p className="text-muted-foreground">
          Track promotion races, relegation battles, and season progress across every division.
        </p>
      </div>

      {leagues.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No leagues created yet</CardTitle>
            <CardDescription>
              Leagues created by administrators appear here with live standings once matches begin.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {leagues.map((league) => (
            <Card key={league.id}>
              <CardHeader className="flex flex-col gap-3">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <CardTitle>{league.name}</CardTitle>
                    <CardDescription>
                      Season {league.season} · Tier {league.tier}
                    </CardDescription>
                  </div>
                  <Badge variant={statusVariant(league.status)}>
                    {league.status.charAt(0) + league.status.slice(1).toLowerCase()}
                  </Badge>
                </div>
                <div className="text-sm text-muted-foreground">
                  {league.standings.length} teams
                </div>
              </CardHeader>
              <CardContent>
                <Link href={`/leagues/${league.id}`} className="text-sm font-medium text-primary underline">
                  View full table
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
