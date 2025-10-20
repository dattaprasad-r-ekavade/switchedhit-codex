import type { Metadata } from 'next'
import './globals.css'
import Navigation from '@/components/navigation'
import { AuthProvider } from '@/components/providers/auth-provider'
import { ThemeProvider } from '@/components/providers/theme-provider'

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
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans">
        <AuthProvider>
          <ThemeProvider>
            <Navigation>
              {children}
            </Navigation>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
