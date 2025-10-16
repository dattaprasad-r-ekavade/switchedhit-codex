import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { prisma } from '@/lib/prisma'

export default async function MatchesPage() {
  const matches = await prisma.match.findMany({
    include: {
      homeTeam: true,
      awayTeam: true
    },
    orderBy: {
      date: 'desc'
    },
    take: 50
  })

  const scheduledMatches = matches.filter(m => m.status === 'SCHEDULED')
  const completedMatches = matches.filter(m => m.status === 'COMPLETED')

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold">Matches</h1>
          <p className="text-muted-foreground">View and manage cricket matches</p>
        </div>
        <Link href="/admin/matches/create">
          <Button>Schedule Match</Button>
        </Link>
      </div>

      <div className="space-y-8">
        <section>
          <h2 className="text-2xl font-bold mb-4">Scheduled Matches</h2>
          {scheduledMatches.length === 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>No scheduled matches</CardTitle>
                <CardDescription>Schedule a new match to get started</CardDescription>
              </CardHeader>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {scheduledMatches.map((match) => (
                <Link key={match.id} href={`/matches/${match.id}`}>
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                    <CardHeader>
                      <CardTitle className="text-lg">
                        {match.homeTeam.name} vs {match.awayTeam.name}
                      </CardTitle>
                      <CardDescription>
                        Match #{match.matchNumber} • {match.matchType}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Date:</span>
                          <span>{new Date(match.date).toLocaleDateString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Venue:</span>
                          <span>{match.venue}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Status:</span>
                          <span className="font-medium text-primary">{match.status}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4">Completed Matches</h2>
          {completedMatches.length === 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>No completed matches</CardTitle>
                <CardDescription>Completed matches will appear here</CardDescription>
              </CardHeader>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {completedMatches.map((match) => (
                <Link key={match.id} href={`/matches/${match.id}`}>
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                    <CardHeader>
                      <CardTitle className="text-lg">
                        {match.homeTeam.name} vs {match.awayTeam.name}
                      </CardTitle>
                      <CardDescription>
                        Match #{match.matchNumber} • {match.matchType}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Date:</span>
                          <span>{new Date(match.date).toLocaleDateString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Venue:</span>
                          <span>{match.venue}</span>
                        </div>
                        {match.result && (
                          <div className="mt-2 pt-2 border-t">
                            <p className="font-medium text-green-600">{match.result}</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
