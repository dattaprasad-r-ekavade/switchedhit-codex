import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

type StatsCardProps = {
  title: string
  value: number | string
  description: string
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    const callbackUrl = encodeURIComponent('/dashboard')
    redirect(`/auth/login?callbackUrl=${callbackUrl}`)
  }

  const isAdmin = session.user.role === 'ADMIN'

  if (isAdmin) {
    const [teamsCount, playersCount, matchesCount, pendingUsers] = await Promise.all([
      prisma.team.count(),
      prisma.player.count(),
      prisma.match.count(),
      prisma.user.count({
        where: {
          role: 'USER',
          hasCompletedOnboarding: false,
        },
      }),
    ])

    const recentTeams = await prisma.team.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        shortName: true,
        createdAt: true,
        owner: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    })

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-4xl font-bold">Admin overview</h1>
          <p className="text-muted-foreground">
            Monitor league activity and manage franchises from a single place.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatsCard title="Teams" value={teamsCount} description="Active franchises in the system" />
          <StatsCard title="Players" value={playersCount} description="Registered squad members" />
          <StatsCard title="Matches" value={matchesCount} description="Simulated and scheduled fixtures" />
          <StatsCard
            title="Pending onboarding"
            value={pendingUsers}
            description="Users awaiting team assignment"
          />
        </div>

        <Card>
          <CardHeader className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <CardTitle>Recently created teams</CardTitle>
              <CardDescription>Latest franchises added to the league</CardDescription>
            </div>
            <Button size="sm" asChild>
              <Link href="/admin/teams/create">Create team</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {recentTeams.length === 0 ? (
              <p className="text-sm text-muted-foreground">No teams have been created yet.</p>
            ) : (
              <div className="divide-y divide-border rounded-md border border-border">
                {recentTeams.map((team) => (
                  <Link
                    key={team.id}
                    href={`/teams/${team.id}`}
                    className="flex flex-col gap-1 px-4 py-3 transition-colors hover:bg-accent hover:text-accent-foreground"
                  >
                    <span className="font-medium text-foreground">{team.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {team.shortName} - Owned by {team.owner?.name || team.owner?.email || 'Unknown'} -{' '}
                      {team.createdAt.toLocaleDateString()}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  const team = await prisma.team.findUnique({
    where: { ownerId: session.user.id },
    include: {
      _count: {
        select: { players: true },
      },
      players: {
        take: 5,
        orderBy: { battingVsPace: 'desc' },
        select: {
          id: true,
          name: true,
          role: true,
          age: true,
          battingVsPace: true,
          battingVsSpin: true,
          bowlingPace: true,
          bowlingSpin: true,
          fieldingSkill: true,
          wicketKeeping: true,
        },
      },
    },
  })

  const upcomingMatches = await prisma.match.findMany({
    where: {
      date: { gte: new Date() },
      OR: [
        { homeTeam: { ownerId: session.user.id } },
        { awayTeam: { ownerId: session.user.id } },
      ],
    },
    include: {
      homeTeam: { select: { name: true } },
      awayTeam: { select: { name: true } },
    },
    orderBy: { date: 'asc' },
    take: 5,
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold">Team dashboard</h1>
        <p className="text-muted-foreground">
          Track upcoming fixtures and squad performance for your franchise.
        </p>
      </div>

      {!team ? (
        <Card>
          <CardHeader>
            <CardTitle>No team linked</CardTitle>
            <CardDescription>Your account has not been assigned to a team yet.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Contact your league administrator to request access to your franchise dashboard.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <StatsCard
              title="Squad size"
              value={team._count.players}
              description="Registered players on your roster"
            />
            <StatsCard
              title="Upcoming matches"
              value={upcomingMatches.length}
              description="Fixtures scheduled in the near future"
            />
            <StatsCard
              title="Average batting"
              value={
                team.players.length === 0
                  ? 'N/A'
                  : Math.round(
                      team.players.reduce(
                        (sum, player) => sum + (player.battingVsPace + player.battingVsSpin) / 2,
                        0
                      ) / team.players.length
                    )
              }
              description="Mean batting skill rating across the squad"
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Upcoming fixtures</CardTitle>
              <CardDescription>Next scheduled matches for your team</CardDescription>
            </CardHeader>
            <CardContent>
              {upcomingMatches.length === 0 ? (
                <p className="text-sm text-muted-foreground">No matches scheduled yet.</p>
              ) : (
                <div className="space-y-3">
                  {upcomingMatches.map((match) => (
                    <Link
                      key={match.id}
                      href={`/matches/${match.id}`}
                      className="flex flex-col gap-1 rounded-md border border-border px-4 py-3 text-sm transition-colors hover:bg-accent hover:text-accent-foreground"
                    >
                      <span className="font-medium text-foreground">
                        {match.homeTeam.name} vs {match.awayTeam.name}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {match.venue} - {new Date(match.date).toLocaleString()} - {match.matchType}
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Key players</CardTitle>
              <CardDescription>Top batting performers in your squad</CardDescription>
            </CardHeader>
            <CardContent>
              {team.players.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Players will appear here once your roster is generated.
                </p>
              ) : (
                <div className="grid gap-3 md:grid-cols-2">
                  {team.players.map((player) => (
                    <div key={player.id} className="rounded-md border border-border p-3 text-sm">
                      <div className="font-medium text-foreground">{player.name}</div>
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{player.role}</span>
                        <span>Age {player.age}</span>
                      </div>
                      <div className="mt-2 text-xs text-muted-foreground">
                        Batting (P/S):&nbsp;
                        <span className="font-semibold text-foreground">{player.battingVsPace}</span>
                        &nbsp;/&nbsp;
                        <span className="font-semibold text-foreground">{player.battingVsSpin}</span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Bowling (P/S):&nbsp;
                        <span className="font-semibold text-foreground">{player.bowlingPace}</span>
                        &nbsp;/&nbsp;
                        <span className="font-semibold text-foreground">{player.bowlingSpin}</span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Fielding:&nbsp;
                        <span className="font-semibold text-foreground">{player.fieldingSkill}</span>
                      </div>
                      {player.wicketKeeping > 0 && (
                        <div className="text-xs text-muted-foreground">
                          Wicket keeping:&nbsp;
                          <span className="font-semibold text-foreground">{player.wicketKeeping}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}

function StatsCard({ title, value, description }: StatsCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className="text-3xl font-semibold text-foreground">{value}</div>
      </CardHeader>
      <CardContent>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  )
}
