import { NextResponse, type NextRequest } from 'next/server'
import { SESSION_COOKIE_NAME, verifySessionToken } from '@/lib/session-token'

export async function proxy(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value
  const session = token ? await verifySessionToken(token) : null
  const pathname = request.nextUrl.pathname
  const isLogin = pathname === '/login' || pathname === '/admin/login'
  const isAdminLogin = pathname === '/admin/login'
  const isDashboard = !isLogin && (pathname.startsWith('/dashboard') || pathname.startsWith('/admin'))

  if (isDashboard && !session) {
    return NextResponse.redirect(new URL(pathname.startsWith('/admin') ? '/admin/login' : '/login', request.url))
  }
  if (isLogin && session) {
    return NextResponse.redirect(new URL(isAdminLogin ? '/admin/dashboard' : '/dashboard', request.url))
  }
  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*', '/login', '/admin/:path*'],
}
