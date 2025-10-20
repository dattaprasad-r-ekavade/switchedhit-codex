import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export default async function TeamsPage() {
  const session = await getServerSession(authOptions)
  const teams = await prisma.team.findMany({
    include: {
      _count: {
        select: { players: true }
      }
    },
    orderBy: {
      name: 'asc'
    }
  })

  const needsOnboarding = Boolean(session?.user && !session.user.hasCompletedOnboarding)
  const userTeamId = session?.user
    ? teams.find((team) => team.ownerId === session.user.id)?.id ?? null
    : null

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold">Teams</h1>
          <p className="text-muted-foreground">Manage cricket teams</p>
        </div>
        {(() => {
          if (!session?.user) {
            const callbackUrl = encodeURIComponent('/onboarding')
            return (
              <Link href={`/auth/login?callbackUrl=${callbackUrl}`}>
                <Button>Sign in to create</Button>
              </Link>
            )
          }

          if (session.user.role === 'ADMIN') {
            return (
              <Link href="/admin/teams/create">
                <Button>Create Team</Button>
              </Link>
            )
          }

          if (needsOnboarding) {
            return (
              <Link href="/onboarding">
                <Button>Complete onboarding</Button>
              </Link>
            )
          }

          if (userTeamId) {
            return (
              <Link href={`/teams/${userTeamId}`}>
                <Button variant="outline">View my team</Button>
              </Link>
            )
          }

          return null
        })()}
      </div>

      {teams.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No teams found</CardTitle>
            <CardDescription>Get started by creating your first team</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teams.map((team) => (
            <Link key={team.id} href={`/teams/${team.id}`}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                <CardHeader>
                  <CardTitle>{team.name}</CardTitle>
                  <CardDescription>{team.shortName}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Captain:</span>
                      <span className="font-medium">{team.captain || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Players:</span>
                      <span className="font-medium">{team._count.players}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Home Ground:</span>
                      <span className="font-medium">{team.homeGround || 'N/A'}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
