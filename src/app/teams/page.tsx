import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getServerSession } from 'next-auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
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

export default async function TeamsPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    const callbackUrl = encodeURIComponent('/teams')
    redirect(`/auth/login?callbackUrl=${callbackUrl}`)
  }

  if (session.user.role !== 'ADMIN') {
    const userTeam = await prisma.team.findUnique({
      where: { ownerId: session.user.id },
      select: { id: true },
    })

    if (userTeam) {
      redirect(`/teams/${userTeam.id}`)
    }

    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Team assignment pending</h1>
          <p className="text-muted-foreground">
            Your account has not been assigned to a franchise yet. Please contact an administrator for access.
          </p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>No team available</CardTitle>
            <CardDescription>Once an admin assigns you to a team you will see its details here.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>Administrators manage all franchises in the system. They will add you when your team is ready.</p>
            <p>
              If you believe this is a mistake, reach out to your league administrator so they can assign the correct team.
            </p>
            <Link href="/matches">
              <Button variant="link" className="px-0">
                Browse scheduled matches instead
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  const teams = await prisma.team.findMany({
    include: {
      players: {
        select: {
          id: true,
          role: true,
          battingVsPace: true,
          battingVsSpin: true,
          bowlingPace: true,
          bowlingSpin: true,
          wicketKeeping: true,
        },
      },
      _count: {
        select: { players: true },
      },
    },
    orderBy: {
      name: 'asc',
    },
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold">Teams</h1>
          <p className="text-muted-foreground">Full franchise directory (admin only)</p>
        </div>
        <Link href="/admin/teams/create">
          <Button>Create team</Button>
        </Link>
      </div>

      {teams.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No teams found</CardTitle>
            <CardDescription>Get started by creating your first team</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {teams.map((team) => {
            const ratingValue = calculateTeamRating(team.players)
            const tier = getTeamRatingTier(ratingValue)
            const label = getTeamRatingLabel(tier)

            return (
              <Link key={team.id} href={`/teams/${team.id}`}>
                <Card className="flex h-full cursor-pointer flex-col transition-shadow hover:shadow-lg">
                  <CardHeader className="space-y-3">
                    <div>
                      <CardTitle>{team.name}</CardTitle>
                      <CardDescription>{team.shortName}</CardDescription>
                    </div>
                    <span
                      className={`inline-flex w-fit items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${tierStyles[tier]}`}
                    >
                      {label} · {ratingValue.toFixed(1)}
                    </span>
                  </CardHeader>
                  <CardContent className="mt-auto space-y-2 text-sm">
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
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
