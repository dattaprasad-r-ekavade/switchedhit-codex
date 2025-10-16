import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { prisma } from '@/lib/prisma'

export default async function TeamDetailPage({ params }: { params: { id: string } }) {
  const team = await prisma.team.findUnique({
    where: { id: params.id },
    include: {
      players: true,
      homeMatches: {
        take: 5,
        orderBy: { date: 'desc' },
        include: {
          awayTeam: true
        }
      },
      awayMatches: {
        take: 5,
        orderBy: { date: 'desc' },
        include: {
          homeTeam: true
        }
      }
    }
  })

  if (!team) {
    notFound()
  }

  const allMatches = [...team.homeMatches, ...team.awayMatches]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5)

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-4xl font-bold mb-2">{team.name}</h1>
          <p className="text-xl text-muted-foreground">{team.shortName}</p>
        </div>
        <Link href={`/admin/teams/${team.id}/edit`}>
          <Button variant="outline">Edit Team</Button>
        </Link>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Team Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Captain:</span>
              <span className="font-medium">{team.captain || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Coach:</span>
              <span className="font-medium">{team.coach || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Home Ground:</span>
              <span className="font-medium">{team.homeGround || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Founded:</span>
              <span className="font-medium">{team.founded || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Players:</span>
              <span className="font-medium">{team.players.length}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Matches</CardTitle>
            <CardDescription>Last 5 matches</CardDescription>
          </CardHeader>
          <CardContent>
            {allMatches.length === 0 ? (
              <p className="text-sm text-muted-foreground">No matches played yet</p>
            ) : (
              <div className="space-y-2">
                {allMatches.map((match) => (
                  <Link key={match.id} href={`/matches/${match.id}`}>
                    <div className="text-sm border-b pb-2 hover:bg-accent hover:text-accent-foreground p-2 rounded cursor-pointer">
                      <div className="font-medium">
                        {'homeTeam' in match ? match.homeTeam.name : team.name} vs{' '}
                        {'awayTeam' in match ? match.awayTeam.name : team.name}
                      </div>
                      <div className="text-muted-foreground text-xs">
                        {new Date(match.date).toLocaleDateString()} • {match.status}
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
            <p className="text-sm text-muted-foreground">No players in this team</p>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {team.players.map((player) => (
                <div key={player.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="font-medium">{player.name}</div>
                  <div className="text-sm text-muted-foreground">{player.role}</div>
                  {player.jerseyNumber && (
                    <div className="text-xs text-muted-foreground mt-1">
                      Jersey: #{player.jerseyNumber}
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
