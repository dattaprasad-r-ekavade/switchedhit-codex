import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

type LeaguePageProps = {
  params: {
    leagueId: string
  }
}

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

function formatDate(value: Date) {
  return value.toLocaleString('en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

export const revalidate = 0

export default async function LeagueStandingsPage({ params }: LeaguePageProps) {
  const league = await prisma.league.findUnique({
    where: { id: params.leagueId },
    include: {
      standings: {
        include: {
          team: {
            select: {
              name: true,
              shortName: true,
            },
          },
        },
      },
      matches: {
        include: {
          homeTeam: {
            select: { name: true, shortName: true },
          },
          awayTeam: {
            select: { name: true, shortName: true },
          },
        },
        orderBy: { date: 'asc' },
      },
    },
  })

  if (!league) {
    notFound()
  }

  const standings = [...league.standings].sort((a, b) => {
    if (b.points !== a.points) {
      return b.points - a.points
    }
    return b.netRunRate - a.netRunRate
  })

  const completedMatches = league.matches.filter((match) => match.status === 'COMPLETED')
  const upcomingMatches = league.matches.filter((match) => match.status !== 'COMPLETED')

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold">{league.name}</h1>
          <p className="text-muted-foreground">
            Season {league.season} · Tier {league.tier}
          </p>
        </div>
        <Badge variant={statusVariant(league.status)} className="text-sm">
          {league.status.charAt(0) + league.status.slice(1).toLowerCase()}
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>League table</CardTitle>
          <CardDescription>
            Teams earn two points for a win and one point for a tie. Net run rate is used as the tiebreaker.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="overflow-x-auto rounded-lg border">
            <table className="min-w-full divide-y divide-border text-sm">
              <thead className="bg-muted/50">
                <tr className="text-left">
                  <th className="px-4 py-2 font-medium">Pos</th>
                  <th className="px-4 py-2 font-medium">Team</th>
                  <th className="px-4 py-2 font-medium text-center">P</th>
                  <th className="px-4 py-2 font-medium text-center">W</th>
                  <th className="px-4 py-2 font-medium text-center">L</th>
                  <th className="px-4 py-2 font-medium text-center">T</th>
                  <th className="px-4 py-2 font-medium text-center">Pts</th>
                  <th className="px-4 py-2 font-medium text-center">NRR</th>
                  <th className="px-4 py-2 font-medium text-center">Form</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {standings.map((standing, index) => (
                  <tr
                    key={standing.id}
                    className={cn(
                      'transition hover:bg-accent/40',
                      index < 3 ? 'bg-primary/5' : undefined,
                      index >= standings.length - 3 ? 'bg-destructive/5' : undefined,
                    )}
                  >
                    <td className="px-4 py-2 font-semibold">#{index + 1}</td>
                    <td className="px-4 py-2">
                      <div className="font-medium">{standing.team?.name ?? 'Former team'}</div>
                      {standing.team?.shortName && (
                        <div className="text-xs text-muted-foreground">{standing.team.shortName}</div>
                      )}
                    </td>
                    <td className="px-4 py-2 text-center">{standing.played}</td>
                    <td className="px-4 py-2 text-center">{standing.won}</td>
                    <td className="px-4 py-2 text-center">{standing.lost}</td>
                    <td className="px-4 py-2 text-center">{standing.tied}</td>
                    <td className="px-4 py-2 text-center font-semibold">{standing.points}</td>
                    <td className="px-4 py-2 text-center">{standing.netRunRate.toFixed(3)}</td>
                    <td className="px-4 py-2 text-center text-xs text-muted-foreground">
                      {standing.streak ?? '—'}
                    </td>
                  </tr>
                ))}
                {standings.length === 0 && (
                  <tr>
                    <td className="px-4 py-6 text-center text-muted-foreground" colSpan={9}>
                      Standings will appear once the first fixture is completed.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-muted-foreground">
            Promotion: top 3 teams. Relegation: bottom 3 teams (unless already in the lowest tier).
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Upcoming fixtures</CardTitle>
            <CardDescription>Fixtures generated automatically with two days between games.</CardDescription>
          </CardHeader>
          <CardContent>
            {upcomingMatches.length === 0 ? (
              <p className="text-sm text-muted-foreground">No upcoming fixtures scheduled.</p>
            ) : (
              <ul className="space-y-3 text-sm">
                {upcomingMatches.slice(0, 8).map((match) => (
                  <li key={match.id} className="rounded-md border px-3 py-2">
                    <div className="font-medium">
                      {match.homeTeam?.name ?? 'Home'} vs {match.awayTeam?.name ?? 'Away'}
                    </div>
                    {match.date && (
                      <div className="text-xs text-muted-foreground">{formatDate(match.date)}</div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent results</CardTitle>
            <CardDescription>Completed fixtures update standings and streaks automatically.</CardDescription>
          </CardHeader>
          <CardContent>
            {completedMatches.length === 0 ? (
              <p className="text-sm text-muted-foreground">No results recorded yet.</p>
            ) : (
              <ul className="space-y-3 text-sm">
                {completedMatches.slice(-8).reverse().map((match) => (
                  <li key={match.id} className="rounded-md border px-3 py-2">
                    <div className="font-medium">
                      {match.homeTeam?.name ?? 'Home'} vs {match.awayTeam?.name ?? 'Away'}
                    </div>
                    {match.date && (
                      <div className="text-xs text-muted-foreground">{formatDate(match.date)}</div>
                    )}
                    {match.result && (
                      <div className="text-xs text-muted-foreground">{match.result}</div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
