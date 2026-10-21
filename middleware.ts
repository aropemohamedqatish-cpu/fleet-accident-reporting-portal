import { NextResponse, type NextRequest } from 'next/server'
import { SESSION_COOKIE_NAME, verifySessionToken } from '@/lib/session-token'
import { shouldRedirectForForcedPasswordChange } from '@/lib/login-validation'

const ADMIN_LOGIN = '/admin/login'
const ADMIN_HOME = '/admin/dashboard'
const DRIVER_LOGIN = '/login'
const DRIVER_HOME = '/dashboard'
const CHANGE_PASSWORD = '/admin/change-password'

export const config = {
  matcher: ['/admin/:path*', '/dashboard/:path*', '/login', '/admin/login'],
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value
  const session = token ? await verifySessionToken(token) : null

  const isAdminLogin = pathname === ADMIN_LOGIN
  const isDriverLogin = pathname === DRIVER_LOGIN
  const isChangePassword = pathname === CHANGE_PASSWORD

  // جلسة موجودة ودخل إلى صفحات تسجيل الدخول → إعادة توجيه للوحة المناسبة
  if (session && (isAdminLogin || isDriverLogin)) {
    const destination = pathname.startsWith('/admin') ? ADMIN_HOME : DRIVER_HOME
    return NextResponse.redirect(new URL(destination, request.url))
  }

  // لا توجد جلسة والمسار محمي → إعادة توجيه لتسجيل الدخول
  if (!session) {
    if (pathname.startsWith('/admin')) {
      return NextResponse.redirect(new URL(ADMIN_LOGIN, request.url))
    }
    if (pathname.startsWith('/dashboard')) {
      return NextResponse.redirect(new URL(DRIVER_LOGIN, request.url))
    }
    return NextResponse.next()
  }

  // جلسة موجودة ولكن يُطلب تغيير كلمة المرور أولاً
  if (
    session.mustChangePassword &&
    shouldRedirectForForcedPasswordChange(pathname, session.mustChangePassword)
  ) {
    return NextResponse.redirect(new URL(CHANGE_PASSWORD, request.url))
  }

  return NextResponse.next()
}