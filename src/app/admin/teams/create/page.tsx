import type { Metadata } from 'next'
import TeamForm from '@/components/forms/team-form'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export const metadata: Metadata = {
  title: 'Admin - Create Team',
}

export default function AdminCreateTeamPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Create a team</CardTitle>
          <CardDescription>Admins can create teams and optionally assign ownership.</CardDescription>
        </CardHeader>
        <CardContent>
          <TeamForm isAdmin />
        </CardContent>
      </Card>
    </div>
  )
}
