import { ReactNode } from 'react'
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await getServerSession(authOptions)

  if (!session?.user || session.user.role !== 'ADMIN') {
    const callbackUrl = encodeURIComponent('/admin')
    redirect(`/auth/login?callbackUrl=${callbackUrl}`)
  }

  return <>{children}</>
}
