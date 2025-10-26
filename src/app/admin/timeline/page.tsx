import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import type { Metadata } from 'next'
import { authOptions } from '@/lib/auth'
import { getGameTime } from '@/lib/timeline'
import { getUpcomingRetirements, getRecentAgeHistory } from '@/lib/player-aging'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import ManualAdvanceForm from './manual-advance-form'

export const metadata: Metadata = {
  title: 'Admin - Timeline Management',
}

export default async function AdminTimelinePage() {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    const callbackUrl = encodeURIComponent('/admin/timeline')
    redirect(`/auth/login?callbackUrl=${callbackUrl}`)
  }

  if (session.user.role !== 'ADMIN') {
    redirect('/dashboard')
  }

  const [gameTime, upcomingRetirements, ageHistory] = await Promise.all([
    getGameTime(),
    getUpcomingRetirements(),
    getRecentAgeHistory(),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold">Timeline & Game Clock</h1>
        <p className="text-muted-foreground">
          Monitor in-game calendar progression, process player aging, and review roster changes.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <TimelineStat title="Season" value={gameTime.currentSeason} description="Current league cycle" />
        <TimelineStat
          title="Game date"
          value={new Date(gameTime.currentDate).toLocaleDateString()}
          description="In-simulation calendar"
        />
        <TimelineStat title="Day counter" value={gameTime.dayNumber} description="Total days since launch" />
        <TimelineStat title="Game years" value={gameTime.weekNumber} description="Weeks elapsed (1 = 1 season)" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Manual controls</CardTitle>
          <CardDescription>Advance the simulation clock manually for testing or administration.</CardDescription>
        </CardHeader>
        <CardContent>
          <ManualAdvanceForm currentDay={gameTime.dayNumber} />
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Upcoming retirements</CardTitle>
            <CardDescription>Players within two seasons of retirement age.</CardDescription>
          </CardHeader>
          <CardContent>
            {upcomingRetirements.length === 0 ? (
              <p className="text-sm text-muted-foreground">No retirements projected.</p>
            ) : (
              <div className="space-y-3">
                {upcomingRetirements.map((player) => (
                  <div key={player.id} className="rounded-md border border-border px-3 py-2 text-sm">
                    <div className="flex justify-between gap-3">
                      <span className="font-semibold text-foreground">{player.name}</span>
                      <span className="text-muted-foreground">{player.role}</span>
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Age {player.age}</span>
                      <span>Retires at {player.retirementAge}</span>
                      <span>{player.team ? player.team.shortName : 'Free Agent'}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Aging log</CardTitle>
            <CardDescription>Most recent skill adjustments recorded by the aging service.</CardDescription>
          </CardHeader>
          <CardContent>
            {ageHistory.length === 0 ? (
              <p className="text-sm text-muted-foreground">No aging events recorded yet.</p>
            ) : (
              <div className="space-y-3">
                {ageHistory.map((entry) => (
                  <div key={entry.id} className="rounded-md border border-border px-3 py-2 text-sm">
                    <div className="flex justify-between gap-3">
                      <span className="font-semibold text-foreground">{entry.player.name}</span>
                      <span className="text-muted-foreground">Age {entry.age}</span>
                    </div>
                    <div className="flex flex-wrap justify-between gap-2 text-xs text-muted-foreground">
                      <span>Bat Pace {entry.battingVsPace}</span>
                      <span>Bat Spin {entry.battingVsSpin}</span>
                      <span>{entry.player.team ? entry.player.team.shortName : 'Free Agent'}</span>
                      <span>{new Date(entry.recordedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function TimelineStat({
  title,
  value,
  description,
}: {
  title: string
  value: string | number
  description: string
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <CardDescription className="text-3xl font-semibold text-foreground">{value}</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  )
}

