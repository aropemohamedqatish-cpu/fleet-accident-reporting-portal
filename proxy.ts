import { NextResponse, type NextRequest } from 'next/server'
import { SESSION_COOKIE_NAME, verifySessionToken } from '@/lib/session-token'
import { shouldRedirectForForcedPasswordChange } from '@/lib/login-validation'

const ADMIN_LOGIN = '/admin/login'
const ADMIN_HOME = '/admin/dashboard'
const CHANGE_PASSWORD = '/admin/change-password'

function redirectToPath(request: NextRequest, pathname: string, status?: 301 | 302 | 307 | 308) {
  const destination = request.nextUrl.clone()
  destination.pathname = pathname
  destination.search = ''
  destination.hash = ''
  return NextResponse.redirect(destination, status)
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Legacy entry points are folded into the single /admin console.
  if (pathname === '/login') return redirectToPath(request, ADMIN_LOGIN, 308)
  if (pathname === '/dashboard' || pathname.startsWith('/dashboard/')) {
    return redirectToPath(request, ADMIN_HOME, 308)
  }

  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value
  const session = token ? await verifySessionToken(token) : null
  const isLogin = pathname === ADMIN_LOGIN

  if (!isLogin && !session) return redirectToPath(request, ADMIN_LOGIN)
  if (session && shouldRedirectForForcedPasswordChange(pathname, session.mustChangePassword)) {
    return redirectToPath(request, CHANGE_PASSWORD)
  }
  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*', '/dashboard/:path*', '/login'],
}
