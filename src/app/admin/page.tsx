import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function AdminPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground">Manage teams, players, and matches</p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Team Management</CardTitle>
            <CardDescription>Create and manage teams</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Link href="/admin/teams/create">
                <Button className="w-full">Create New Team</Button>
              </Link>
              <Link href="/teams">
                <Button variant="outline" className="w-full">View All Teams</Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Player Management</CardTitle>
            <CardDescription>Manage player roster</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Link href="/admin/players/create">
                <Button className="w-full">Add New Player</Button>
              </Link>
              <Link href="/admin/players">
                <Button variant="outline" className="w-full">View All Players</Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Match Management</CardTitle>
            <CardDescription>Schedule and simulate matches</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Link href="/admin/matches/create">
                <Button className="w-full">Schedule Match</Button>
              </Link>
              <Link href="/matches">
                <Button variant="outline" className="w-full">View All Matches</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common administrative tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h3 className="font-medium">Database Operations</h3>
              <p className="text-sm text-muted-foreground">
                Manage database records and perform bulk operations
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="font-medium">Match Simulations</h3>
              <p className="text-sm text-muted-foreground">
                Run scheduled match simulations and view results
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
