import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export default async function Home() {
  const session = await getServerSession(authOptions)

  if (session?.user) {
    redirect('/dashboard')
  }

  const teamsCount = await prisma.team.count()
  const matchesCount = await prisma.match.count()
  const playersCount = await prisma.player.count()

  return (
    <div className="space-y-8">
      <section className="text-center py-12">
        <h1 className="text-5xl font-bold mb-4">Welcome to SwitchedHit</h1>
        <p className="text-xl text-muted-foreground mb-8">
          Your premier T20 cricket simulation platform
        </p>
        <div className="flex justify-center gap-4">
          <Link href="/teams">
            <Button size="lg">Browse Teams</Button>
          </Link>
          <Link href="/matches">
            <Button size="lg" variant="outline">View Matches</Button>
          </Link>
        </div>
      </section>

      <section className="grid md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl">{teamsCount}</CardTitle>
            <CardDescription>Teams</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Cricket teams registered on the platform
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-3xl">{playersCount}</CardTitle>
            <CardDescription>Players</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Professional cricketers in the system
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-3xl">{matchesCount}</CardTitle>
            <CardDescription>Matches</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              T20 matches simulated and scheduled
            </p>
          </CardContent>
        </Card>
      </section>

      <section>
        <h2 className="text-3xl font-bold mb-4">Features</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Team Management</CardTitle>
              <CardDescription>Create and manage cricket teams</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm">
                Build your dream team with players, coaches, and complete team profiles.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Match Simulations</CardTitle>
              <CardDescription>Schedule and simulate T20 matches</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm">
                Experience realistic T20 cricket match simulations with detailed ball-by-ball commentary.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Player Statistics</CardTitle>
              <CardDescription>Track player performance</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm">
                Monitor batting, bowling, and fielding statistics for all players.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Admin Controls</CardTitle>
              <CardDescription>Powerful administration tools</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm">
                Manage teams, players, and matches with comprehensive admin features.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  )
}
