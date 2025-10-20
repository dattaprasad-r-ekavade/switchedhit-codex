'use client'

import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { Button } from '@/components/ui/button'

export default function Navigation() {
  const { data: session, status } = useSession()
  const isAdmin = session?.user?.role === 'ADMIN'
  const needsOnboarding = Boolean(session?.user && !session.user.hasCompletedOnboarding)

  return (
    <nav className="border-b">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between gap-4">
          <Link href="/" className="text-2xl font-bold text-primary">
            SwitchedHit
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/" className="hover:text-primary transition-colors">
              Home
            </Link>
            <Link href="/teams" className="hover:text-primary transition-colors">
              Teams
            </Link>
            <Link href="/matches" className="hover:text-primary transition-colors">
              Matches
            </Link>
            {isAdmin && (
              <Link href="/admin" className="hover:text-primary transition-colors">
                Admin
              </Link>
            )}
            {needsOnboarding && (
              <Link href="/onboarding">
                <Button size="sm" className="ml-2">
                  Complete setup
                </Button>
              </Link>
            )}
            <div className="ml-2 flex items-center gap-2">
              {status === 'loading' ? (
                <span className="text-sm text-muted-foreground">Loading...</span>
              ) : session ? (
                <>
                  <span className="text-sm text-muted-foreground">
                    {session.user?.name || session.user.email}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => signOut({ callbackUrl: '/' })}
                  >
                    Sign out
                  </Button>
                </>
              ) : (
                <>
                  <Link href="/auth/login" className="text-sm hover:text-primary transition-colors">
                    Sign in
                  </Link>
                  <Link href="/auth/register">
                    <Button size="sm">Register</Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}
