import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
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

export const metadata = {
  title: 'Admin - Leagues',
}

export default async function AdminLeaguesPage() {
  const leagues = await prisma.league.findMany({
    orderBy: [
      { season: 'desc' },
      { tier: 'asc' },
      { name: 'asc' },
    ],
    include: {
      standings: {
        include: {
          team: {
            select: {
              name: true,
            },
          },
        },
      },
      matches: {
        select: {
          id: true,
          status: true,
        },
      },
    },
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">League Management</h1>
          <p className="text-muted-foreground">
            Create leagues, review standings, and monitor promotions.
          </p>
        </div>
        <Link href="/admin/leagues/create">
          <Button>Create League</Button>
        </Link>
      </div>

      {leagues.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No leagues found</CardTitle>
            <CardDescription>
              Get started by creating the first league and assigning participating teams.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/admin/leagues/create">
              <Button>Create league</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {leagues.map((league) => {
            const sortedStandings = [...league.standings].sort((a, b) => {
              if (b.points !== a.points) {
                return b.points - a.points
              }
              return b.netRunRate - a.netRunRate
            })

            const completedMatches = league.matches.filter((match) => match.status === 'COMPLETED').length
            const totalMatches = league.matches.length

            return (
              <Card key={league.id} className="flex flex-col">
                <CardHeader className="space-y-4">
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
                  <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                    <span>{sortedStandings.length} participating teams</span>
                    <span>
                      {completedMatches} / {totalMatches} matches completed
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold text-foreground">Current top 3</h3>
                    {sortedStandings.slice(0, 3).map((standing, index) => (
                      <div key={standing.id} className="flex items-center justify-between rounded-md border px-3 py-2">
                        <span className="font-medium">
                          #{index + 1}{' '}
                          {standing.team?.name ?? 'Team removed'}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {standing.points} pts · NRR {standing.netRunRate.toFixed(3)}
                        </span>
                      </div>
                    ))}
                    {sortedStandings.length === 0 && (
                      <p className="text-sm text-muted-foreground">
                        Standings will populate automatically once fixtures are completed.
                      </p>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <Link href={`/leagues/${league.id}`}>
                      <Button variant="outline">View standings</Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
