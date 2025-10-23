import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import {
  calculateTeamRating,
  getTeamRatingTier,
  getTeamRatingLabel,
  type TeamRatingTier,
} from '@/lib/team-rating'

const tierStyles: Record<TeamRatingTier, string> = {
  ELITE: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-600',
  STRONG: 'border-sky-500/40 bg-sky-500/10 text-sky-600',
  AVERAGE: 'border-amber-500/40 bg-amber-500/10 text-amber-600',
  WEAK: 'border-rose-500/40 bg-rose-500/10 text-rose-600',
}

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

  const ratingValue = calculateTeamRating(team.players)
  const ratingTier = getTeamRatingTier(ratingValue)
  const ratingLabel = getTeamRatingLabel(ratingTier)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-3">
          <div>
            <h1 className="mb-2 text-4xl font-bold">{team.name}</h1>
            <p className="text-xl text-muted-foreground">{team.shortName}</p>
          </div>
          <span
            className={`inline-flex w-fit items-center rounded-full border px-3 py-1 text-xs font-semibold ${tierStyles[ratingTier]}`}
          >
            {ratingLabel} · {ratingValue.toFixed(1)}
          </span>
        </div>
        {isAdmin && (
          <Link href={`/admin/teams/${team.id}/edit`}>
            <Button variant="outline">Edit team</Button>
          </Link>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Team rating</CardTitle>
            <CardDescription>Composite strength benchmark</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-4xl font-semibold text-foreground">{ratingValue.toFixed(1)}</div>
            <p className="text-sm text-muted-foreground">
              {ratingLabel} squads typically challenge for trophies. Ratings blend top 5 batting and
              bowling performers plus the leading wicket keeper.
            </p>
            <div className="space-y-1 text-xs text-muted-foreground">
              <p>80+ Elite · 70s Strong · 60s Average · &lt;60 Developing</p>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
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
      </div>

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
