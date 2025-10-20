import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import OnboardingForm from './onboarding-form'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export const metadata: Metadata = {
  title: 'Complete Onboarding - SwitchedHit',
}

export default async function OnboardingPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    const callbackUrl = encodeURIComponent('/onboarding')
    redirect(`/auth/login?callbackUrl=${callbackUrl}`)
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      hasCompletedOnboarding: true,
      team: { select: { id: true } },
    },
  })

  if (!user) {
    redirect('/auth/login')
  }

  if (user.hasCompletedOnboarding || user.team) {
    redirect('/teams')
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Set up your franchise</CardTitle>
          <CardDescription>
            Name your team and pick a home ground to receive a ready-to-play squad of 15 Indian players.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <OnboardingForm />
        </CardContent>
      </Card>
    </div>
  )
}
