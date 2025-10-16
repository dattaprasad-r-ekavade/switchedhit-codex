import { notFound } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { SimulateMatchButton } from '@/components/matches/simulate-match-button'

type MatchPageProps = {
  params: {
    id: string
  }
}

function formatOvers(overs: number) {
  const wholeOvers = Math.floor(overs)
  const balls = Math.round((overs - wholeOvers) * 6)
  return `${wholeOvers}.${balls}`
}

function formatStatus(status: string) {
  const upper = status.toUpperCase()
  switch (upper) {
    case 'COMPLETED':
      return { label: 'Completed', className: 'bg-emerald-100 text-emerald-700' }
    case 'IN_PROGRESS':
      return { label: 'In Progress', className: 'bg-amber-100 text-amber-700' }
    case 'ABANDONED':
      return { label: 'Abandoned', className: 'bg-gray-200 text-gray-700' }
    default:
      return { label: 'Scheduled', className: 'bg-blue-100 text-blue-700' }
  }
}

function describeBall(ball: {
  runs: number
  isExtra: boolean
  extraType: string | null
  isWicket: boolean
  wicketType: string | null
  dismissedPlayer: string | null
}) {
  const segments: string[] = []

  if (ball.isExtra) {
    const extraLabel = ball.extraType ? ball.extraType.replace('_', ' ') : 'Extra'
    segments.push(`${extraLabel} +${ball.runs}`)
  } else {
    segments.push(`${ball.runs} run${ball.runs === 1 ? '' : 's'}`)
  }

  if (ball.isWicket) {
    const wicketPart = ball.dismissedPlayer
      ? `${ball.dismissedPlayer} ${ball.wicketType ? `(${ball.wicketType})` : 'OUT'}`
      : ball.wicketType || 'WICKET'
    segments.push(wicketPart)
  }

  return segments.join(' • ')
}

export default async function MatchDetailPage({ params }: MatchPageProps) {
  const [match, session] = await Promise.all([
    prisma.match.findUnique({
      where: { id: params.id },
      include: {
        homeTeam: true,
        awayTeam: true,
        innings: {
          orderBy: { inningsNumber: 'asc' },
          include: {
            balls: {
              orderBy: [
                { overNumber: 'asc' },
                { ballNumber: 'asc' }
              ]
            }
          }
        }
      }
    }),
    getServerSession(authOptions)
  ])

  if (!match) {
    notFound()
  }

  const statusMeta = formatStatus(match.status)
  const isAdmin = session?.user?.role === 'ADMIN'
  const canSimulate = isAdmin && match.status === 'SCHEDULED'

  const inningsByNumber = match.innings.sort((a, b) => a.inningsNumber - b.inningsNumber)

  const teamLookup = new Map([
    [match.homeTeamId, match.homeTeam],
    [match.awayTeamId, match.awayTeam]
  ])

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold">
            {match.homeTeam.name} vs {match.awayTeam.name}
          </h1>
          <p className="text-muted-foreground">
            Match #{match.matchNumber} · {match.matchType}
          </p>
        </div>
        <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${statusMeta.className}`}>
          {statusMeta.label}
        </span>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Match details</CardTitle>
          <CardDescription>Fixture information, venue and result summary.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Date</span>
              <span>{match.date.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Venue</span>
              <span>{match.venue}</span>
            </div>
            {match.tossWinner && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Toss</span>
                <span>
                  {match.tossWinner} elected to {match.tossDecision?.toLowerCase()}
                </span>
              </div>
            )}
            {match.result && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Result</span>
                <span className="font-semibold">{match.result}</span>
              </div>
            )}
          </div>

          {canSimulate && (
            <div className="border-t pt-4">
              <SimulateMatchButton matchId={match.id} />
            </div>
          )}
        </CardContent>
      </Card>

      {inningsByNumber.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No simulation data yet</CardTitle>
            <CardDescription>
              Run the simulation once lineups are ready. Generated commentary appears here.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        inningsByNumber.map((innings) => {
          const battingTeam = teamLookup.get(innings.battingTeamId)
          const bowlingTeam = teamLookup.get(innings.bowlingTeamId)
          return (
            <Card key={innings.id}>
              <CardHeader>
                <CardTitle>
                  {battingTeam?.name ?? 'Unknown Team'} Innings
                </CardTitle>
                <CardDescription>
                  {innings.totalRuns}/{innings.totalWickets} in {formatOvers(innings.totalOvers)} overs · Extras {innings.extras}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm text-muted-foreground mb-3">
                      Bowling: {bowlingTeam?.name ?? 'Unknown Team'}
                    </p>
                    <div className="rounded-lg border">
                      <div className="grid grid-cols-4 gap-3 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground border-b">
                        <span>Over</span>
                        <span>Bowler</span>
                        <span>Batsman</span>
                        <span>Outcome</span>
                      </div>
                      {innings.balls.length === 0 ? (
                        <div className="px-4 py-3 text-sm text-muted-foreground">
                          Ball-by-ball data unavailable.
                        </div>
                      ) : (
                        <div className="divide-y">
                          {innings.balls.map((ball) => (
                            <div key={ball.id} className="grid grid-cols-4 gap-3 px-4 py-3 text-sm">
                              <span className="font-medium">
                                {ball.overNumber}.{ball.ballNumber}
                              </span>
                              <span>{ball.bowlerName}</span>
                              <span>{ball.batsmanName}</span>
                              <span>{describeBall(ball)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="rounded-lg border p-4">
                      <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                        Summary
                      </h3>
                      <ul className="mt-2 space-y-1 text-sm">
                        <li>Total runs: {innings.totalRuns}</li>
                        <li>Total wickets: {innings.totalWickets}</li>
                        <li>Overs: {formatOvers(innings.totalOvers)}</li>
                        <li>Extras: {innings.extras}</li>
                      </ul>
                    </div>
                    {match.result && innings.inningsNumber === inningsByNumber.length && (
                      <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
                        Final result: {match.result}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })
      )}
    </div>
  )
}

