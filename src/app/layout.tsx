import type { Metadata } from 'next'
import './globals.css'
import Navigation from '@/components/navigation'
import { AuthProvider } from '@/components/providers/auth-provider'

export const metadata: Metadata = {
  title: 'SwitchedHit - T20 Cricket Simulation Platform',
  description: 'A T20 cricket simulation platform built with Next.js 13, Tailwind CSS, and Prisma ORM',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="font-sans">
        <AuthProvider>
          <Navigation />
          <main className="container mx-auto px-4 py-8">
            {children}
          </main>
        </AuthProvider>
      </body>
    </html>
  )
}
