import type { Metadata } from 'next'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import RegisterForm from './register-form'

export const metadata: Metadata = {
  title: 'Register - SwitchedHit',
}

export default function RegisterPage({
  searchParams,
}: {
  searchParams?: { callbackUrl?: string }
}) {
  const callbackUrl = searchParams?.callbackUrl || '/'

  return (
    <div className="max-w-md mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Create an account</CardTitle>
          <CardDescription>Join SwitchedHit to manage your cricket teams</CardDescription>
        </CardHeader>
        <CardContent>
          <RegisterForm callbackUrl={callbackUrl} />
        </CardContent>
        <CardFooter className="text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link href="/auth/login" className="ml-1 text-primary hover:underline">
            Sign in
          </Link>
        </CardFooter>
      </Card>
    </div>
  )
}
