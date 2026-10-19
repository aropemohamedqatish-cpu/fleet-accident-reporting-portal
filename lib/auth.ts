import { cookies } from 'next/headers'
import type { AdminRole } from '@prisma/client'
import { SESSION_COOKIE_NAME, signSessionToken, verifySessionToken } from './session-token'

const SESSION_DURATION_SECONDS = 8 * 60 * 60

export async function createSession(userId: string, email: string, name: string, role: AdminRole) {
  const token = await signSessionToken({ userId, email, name, role })
  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_DURATION_SECONDS,
    expires: new Date(Date.now() + SESSION_DURATION_SECONDS * 1000),
  })
}

export async function getSession() {
  const token = (await cookies()).get(SESSION_COOKIE_NAME)?.value
  return token ? verifySessionToken(token) : null
}

export async function deleteSession() {
  (await cookies()).delete(SESSION_COOKIE_NAME)
}
