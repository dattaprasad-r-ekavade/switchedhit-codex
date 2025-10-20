import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export default async function TeamDetailPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    const callbackUrl = encodeURIComponent(`/teams/${params.id}`)
    redirect(`/auth/login?callbackUrl=${callbackUrl}`)
  }

  const isAdmin = session.user.role === 'ADMIN'

  const team = await prisma.team.findUnique({
    where: { id: params.id },
    include: {
      players: true,
      homeMatches: {
        take: 5,
        orderBy: { date: 'desc' },
        include: {
          awayTeam: true,
        },
      },
      awayMatches: {
        take: 5,
        orderBy: { date: 'desc' },
        include: {
          homeTeam: true,
        },
      },
      owner: true,
    },
  })

  if (!team) {
    notFound()
  }

  if (!isAdmin && team.ownerId !== session.user.id) {
    notFound()
  }

  const allMatches = [...team.homeMatches, ...team.awayMatches]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="mb-2 text-4xl font-bold">{team.name}</h1>
          <p className="text-xl text-muted-foreground">{team.shortName}</p>
        </div>
        {isAdmin && (
          <Link href={`/admin/teams/${team.id}/edit`}>
            <Button variant="outline">Edit team</Button>
          </Link>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Team information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Captain:</span>
              <span className="font-medium">{team.captain || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Coach:</span>
              <span className="font-medium">{team.coach || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Home ground:</span>
              <span className="font-medium">{team.homeGround || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Founded:</span>
              <span className="font-medium">{team.founded || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Owner:</span>
              <span className="font-medium">{team.owner?.name || team.owner?.email || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total players:</span>
              <span className="font-medium">{team.players.length}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent matches</CardTitle>
            <CardDescription>Last 5 fixtures</CardDescription>
          </CardHeader>
          <CardContent>
            {allMatches.length === 0 ? (
              <p className="text-sm text-muted-foreground">No matches played yet.</p>
            ) : (
              <div className="space-y-2">
                {allMatches.map((match) => (
                  <Link key={match.id} href={`/matches/${match.id}`}>
                    <div className="cursor-pointer rounded border-b border-border pb-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground">
                      <div className="px-2 pt-2 font-medium">
                        {'homeTeam' in match ? match.homeTeam.name : team.name} vs{' '}
                        {'awayTeam' in match ? match.awayTeam.name : team.name}
                      </div>
                      <div className="px-2 pb-2 text-xs text-muted-foreground">
                        {new Date(match.date).toLocaleDateString()} - {match.status}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Players</CardTitle>
          <CardDescription>{team.players.length} players in squad</CardDescription>
        </CardHeader>
        <CardContent>
          {team.players.length === 0 ? (
            <p className="text-sm text-muted-foreground">No players in this team.</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {team.players.map((player) => (
                <div
                  key={player.id}
                  className="rounded-lg border border-border p-4 transition-shadow hover:shadow-md"
                >
                  <div className="font-medium">{player.name}</div>
                  <div className="text-sm text-muted-foreground">{player.role}</div>
                  {player.jerseyNumber && (
                    <div className="mt-1 text-xs text-muted-foreground">
                      Jersey: <span className="font-semibold text-foreground">#{player.jerseyNumber}</span>
                    </div>
                  )}
                  <div className="mt-2 text-xs text-muted-foreground">
                    Batting:&nbsp;
                    <span className="font-semibold text-foreground">{player.battingSkill}</span>&nbsp;|&nbsp;Bowling:&nbsp;
                    <span className="font-semibold text-foreground">{player.bowlingSkill}</span>
                  </div>
                  {player.country && (
                    <div className="text-xs text-muted-foreground">
                      Country:&nbsp;
                      <span className="font-semibold text-foreground">{player.country}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
