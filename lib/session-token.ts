import { jwtVerify, SignJWT } from 'jose'
import type { AdminRole } from '@prisma/client'

export const SESSION_COOKIE_NAME = 'arope_session'
const SESSION_DURATION_SECONDS = 8 * 60 * 60
const SESSION_ISSUER = 'arope-fleet-portal'
const SESSION_AUDIENCE = 'arope-claims-dashboard'

export type AdminSession = {
  userId: string
  email: string
  name: string
  role: AdminRole
}

function getSigningKey() {
  const secret = process.env.JWT_SECRET
  if (!secret || new TextEncoder().encode(secret).length < 32) {
    throw new Error('JWT_SECRET must be configured with at least 32 bytes.')
  }
  return new TextEncoder().encode(secret)
}

export async function signSessionToken(session: AdminSession) {
  return new SignJWT({ email: session.email, name: session.name, role: session.role })
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setIssuer(SESSION_ISSUER)
    .setAudience(SESSION_AUDIENCE)
    .setSubject(session.userId)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION_SECONDS}s`)
    .sign(getSigningKey())
}

export async function verifySessionToken(token: string): Promise<AdminSession | null> {
  const key = getSigningKey()
  try {
    const { payload } = await jwtVerify(token, key, {
      algorithms: ['HS256'],
      issuer: SESSION_ISSUER,
      audience: SESSION_AUDIENCE,
    })
    if (
      typeof payload.sub !== 'string' ||
      typeof payload.email !== 'string' ||
      typeof payload.name !== 'string' ||
      (payload.role !== 'ADMIN' && payload.role !== 'AGENT')
    ) {
      return null
    }
    return { userId: payload.sub, email: payload.email, name: payload.name, role: payload.role }
  } catch {
    return null
  }
}
