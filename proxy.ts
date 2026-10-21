import { NextResponse, type NextRequest } from 'next/server'
import { SESSION_COOKIE_NAME, verifySessionToken } from '@/lib/session-token'
import { shouldRedirectForForcedPasswordChange } from '@/lib/login-validation'

const ADMIN_LOGIN = '/admin/login'
const ADMIN_HOME = '/admin/dashboard'

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Legacy entry points are folded into the single /admin console.
  if (pathname === '/login') return NextResponse.redirect(new URL(ADMIN_LOGIN, request.url), 308)
  if (pathname === '/dashboard' || pathname.startsWith('/dashboard/')) {
    return NextResponse.redirect(new URL(ADMIN_HOME, request.url), 308)
  }

  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value
  const session = token ? await verifySessionToken(token) : null
  const isLogin = pathname === ADMIN_LOGIN

  if (!isLogin && !session) return NextResponse.redirect(new URL(ADMIN_LOGIN, request.url))
  if (session && shouldRedirectForForcedPasswordChange(pathname, session.mustChangePassword)) {
    return NextResponse.redirect(new URL('/admin/change-password', request.url))
  }
  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*', '/dashboard/:path*', '/login'],
}
