'use client'

import { ReactNode } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/theme-toggle'
import { cn } from '@/lib/utils'

type NavigationProps = {
  children: ReactNode
}

type NavItem = {
  href: string
  label: string
}

export default function Navigation({ children }: NavigationProps) {
  const pathname = usePathname()
  const { data: session, status } = useSession()

  const isAuthenticated = Boolean(session?.user)
  const isAdmin = session?.user?.role === 'ADMIN'
  const needsOnboarding = Boolean(session?.user && !session.user.hasCompletedOnboarding)
  const displayName = session?.user?.name || session?.user?.email || 'User'

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <header className="border-b">
          <div className="container mx-auto flex items-center justify-between px-4 py-4">
            <Link href="/" className="text-2xl font-bold text-primary">
              SwitchedHit
            </Link>
            <div className="h-10 w-10 rounded-md border border-border bg-muted/40" />
          </div>
        </header>
        <main className="container mx-auto px-4 py-8">
          {children}
        </main>
      </div>
    )
  }

  if (!isAuthenticated) {
    const publicLinks: NavItem[] = [
      { href: '/', label: 'Home' },
      { href: '/matches', label: 'Matches' },
      { href: '/leagues', label: 'Leagues' },
    ]

    return (
      <div className="min-h-screen bg-background text-foreground">
        <header className="border-b">
          <div className="container mx-auto flex flex-wrap items-center justify-between gap-4 px-4 py-4">
            <Link href="/" className="text-2xl font-bold text-primary">
              SwitchedHit
            </Link>
            <div className="flex flex-wrap items-center gap-4">
              {publicLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    'text-sm font-medium transition-colors hover:text-primary',
                    pathname === link.href ? 'text-primary' : 'text-muted-foreground'
                  )}
                >
                  {link.label}
                </Link>
              ))}
              <ThemeToggle />
              <div className="flex items-center gap-2">
                <Link href="/auth/login" className="text-sm transition-colors hover:text-primary">
                  Sign in
                </Link>
                <Link href="/auth/register">
                  <Button size="sm">Register</Button>
                </Link>
              </div>
            </div>
          </div>
        </header>
        <main className="container mx-auto px-4 py-8">
          {children}
        </main>
      </div>
    )
  }

  const navItems: NavItem[] = isAdmin
    ? [
        { href: '/dashboard', label: 'Dashboard' },
        { href: '/teams', label: 'Teams' },
        { href: '/matches', label: 'Matches' },
        { href: '/leagues', label: 'Leagues' },
        { href: '/admin', label: 'Admin' },
      ]
    : [
        { href: '/dashboard', label: 'Dashboard' },
        { href: '/teams', label: 'My Team' },
        { href: '/matches', label: 'Matches' },
        { href: '/leagues', label: 'Leagues' },
      ]

  return (
    <div className="min-h-screen bg-background text-foreground md:flex md:h-screen md:overflow-hidden">
      <aside className="hidden w-64 flex-col border-r border-border bg-card text-card-foreground md:flex md:h-full md:flex-none md:overflow-hidden">
        <div className="flex items-center justify-between border-b border-border px-4 py-5">
          <Link href="/" className="text-2xl font-bold text-primary">
            SwitchedHit
          </Link>
          <ThemeToggle />
        </div>
        <nav className="flex-1 space-y-1 px-2 py-4 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                )}
              >
                {item.label}
              </Link>
            )
          })}
        </nav>
        <div className="space-y-2 border-t border-border px-4 py-5 text-sm">
          <div>
            <div className="font-semibold text-foreground">{displayName}</div>
            <div className="text-muted-foreground">{isAdmin ? 'Administrator' : 'Team Manager'}</div>
          </div>
          {needsOnboarding && (
            <Link href="/onboarding">
              <Button size="sm" variant="secondary" className="w-full">
                Complete onboarding
              </Button>
            </Link>
          )}
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => signOut({ callbackUrl: '/' })}
          >
            Sign out
          </Button>
        </div>
      </aside>

      <div className="flex min-h-screen flex-1 flex-col md:h-full md:overflow-hidden">
        <header className="border-b border-border bg-card py-4 md:hidden">
          <div className="flex items-center justify-between px-4">
            <Link href="/" className="text-xl font-semibold text-primary">
              SwitchedHit
            </Link>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Button
                variant="outline"
                size="sm"
                onClick={() => signOut({ callbackUrl: '/' })}
              >
                Sign out
              </Button>
            </div>
          </div>
          <div className="mt-3 flex gap-2 overflow-x-auto px-4">
            {navItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link key={item.href} href={item.href}>
                  <span
                    className={cn(
                      'inline-flex items-center rounded-md px-3 py-1 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                    )}
                  >
                    {item.label}
                  </span>
                </Link>
              )
            })}
          </div>
        </header>

        {needsOnboarding && (
          <div className="border-b border-border bg-secondary/30 px-4 py-3 text-sm text-secondary-foreground md:px-10">
            <span className="font-medium">Complete onboarding</span> to unlock all team features.{' '}
            <Link href="/onboarding" className="underline">
              Continue setup
            </Link>
          </div>
        )}

        <main className="flex-1 px-4 py-6 md:overflow-y-auto md:px-10 md:py-10">
          {children}
        </main>
      </div>
    </div>
  )
}
