import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

const ONBOARDING_PATH = '/onboarding'
const AUTH_PATH_PREFIX = '/auth'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (pathname.startsWith('/_next') || pathname.startsWith('/public')) {
    return NextResponse.next()
  }

  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  })

  if (!token?.id) {
    return NextResponse.next()
  }

  const hasCompletedOnboarding = Boolean(token.hasCompletedOnboarding)

  if (!hasCompletedOnboarding) {
    if (
      pathname === ONBOARDING_PATH ||
      pathname.startsWith('/api/onboarding') ||
      pathname.startsWith('/api/auth') ||
      pathname.startsWith(AUTH_PATH_PREFIX)
    ) {
      return NextResponse.next()
    }

    const url = request.nextUrl.clone()
    url.pathname = ONBOARDING_PATH
    url.search = ''
    return NextResponse.redirect(url)
  }

  if (hasCompletedOnboarding && pathname === ONBOARDING_PATH) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    url.search = ''
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
