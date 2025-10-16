import type { Metadata } from 'next'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import LoginForm from './login-form'

export const metadata: Metadata = {
  title: 'Sign in - SwitchedHit',
}

export default function LoginPage({
  searchParams,
}: {
  searchParams?: { callbackUrl?: string; error?: string }
}) {
  const callbackUrl = searchParams?.callbackUrl || '/'
  const error = searchParams?.error

  return (
    <div className="max-w-md mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Sign in</CardTitle>
          <CardDescription>Access your SwitchedHit account</CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
              {decodeURIComponent(error)}
            </div>
          )}
          <LoginForm callbackUrl={callbackUrl} />
        </CardContent>
        <CardFooter className="text-sm text-muted-foreground">
          Don&apos;t have an account?{' '}
          <Link href="/auth/register" className="ml-1 text-primary hover:underline">
            Register here
          </Link>
        </CardFooter>
      </Card>
    </div>
  )
}
