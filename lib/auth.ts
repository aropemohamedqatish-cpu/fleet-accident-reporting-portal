import { cookies } from 'next/headers'
import type { AdminRole } from '@prisma/client'
import { SESSION_COOKIE_NAME, signSessionToken, verifySessionToken } from './session-token'
import { prisma } from './prisma'

const SESSION_DURATION_SECONDS = 8 * 60 * 60

export async function createSession(
  userId: string,
  email: string,
  name: string,
  role: AdminRole,
  mustChangePassword = false,
) {
  const user = await prisma.adminUser.findUnique({
    where: { id: userId },
    select: { sessionVersion: true, isActive: true },
  })
  if (!user?.isActive) throw new Error('Cannot create a session for an inactive or missing account.')

  const token = await signSessionToken({
    userId,
    email,
    name,
    role,
    mustChangePassword,
    sessionVersion: user.sessionVersion,
  })
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
  const session = token ? await verifySessionToken(token) : null
  if (!session) return null

  const user = await prisma.adminUser.findUnique({
    where: { id: session.userId },
    select: { email: true, name: true, role: true, isActive: true, mustChangePassword: true, sessionVersion: true },
  })
  if (!user || !user.isActive || user.sessionVersion !== session.sessionVersion) {
    return null
  }

  return {
    ...session,
    email: user.email,
    name: user.name,
    role: user.role,
    mustChangePassword: user.mustChangePassword,
  }
}

export async function deleteSession() {
  (await cookies()).delete(SESSION_COOKIE_NAME)
}
