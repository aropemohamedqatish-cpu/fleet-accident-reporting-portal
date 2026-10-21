import 'server-only'

import bcrypt from 'bcryptjs'
import type { AdminRole, Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { isAccountLoginAllowed, isLoginRateLimited } from '@/lib/login-validation'

const WINDOW_MS = 15 * 60 * 1000

export type AuthenticatedAdmin = {
  id: string
  email: string
  name: string
  role: AdminRole
  mustChangePassword: boolean
}

export type AdminAuthenticationResult =
  | { status: 'authenticated'; user: AuthenticatedAdmin }
  | { status: 'invalid' }
  | { status: 'rate_limited' }

type AdminUserLookup = Pick<AuthenticatedAdmin, 'id' | 'email' | 'name' | 'role'> & {
  passwordHash: string
  isActive: boolean
}

async function findAdminUser(
  tx: Prisma.TransactionClient,
  email: string,
): Promise<AdminUserLookup | null> {
  const exactMatch = await tx.adminUser.findUnique({
    where: { email },
    select: { id: true, email: true, name: true, passwordHash: true, role: true, isActive: true, mustChangePassword: true },
  })
  if (exactMatch) return exactMatch

  const legacyMatches = await tx.adminUser.findMany({
    where: { email: { equals: email, mode: 'insensitive' } },
    take: 2,
    select: { id: true, email: true, name: true, passwordHash: true, role: true, isActive: true, mustChangePassword: true },
  })
  return legacyMatches.length === 1 ? legacyMatches[0] : null
}

export async function authenticateAdmin(
  email: string,
  password: string,
  ipAddress: string | null,
): Promise<AdminAuthenticationResult> {
  const normalizedEmail = email.trim().toLowerCase()
  const windowStart = new Date(Date.now() - WINDOW_MS)

  return prisma.$transaction(async (tx) => {
    const lockKeys = [`email:${normalizedEmail}`, ...(ipAddress ? [`ip:${ipAddress}`] : [])].sort()
    for (const lockKey of lockKeys) {
      await tx.$queryRaw`SELECT 1 FROM (SELECT pg_advisory_xact_lock(hashtextextended(${lockKey}, 0))) AS lock_result`
    }

    const emailFailures = await tx.securityEvent.count({
      where: {
        email: normalizedEmail,
        eventType: 'LOGIN_FAILURE',
        createdAt: { gte: windowStart },
      },
    })
    const ipFailures = ipAddress
      ? await tx.securityEvent.count({
          where: {
            ipAddress,
            eventType: 'LOGIN_FAILURE',
            createdAt: { gte: windowStart },
          },
        })
      : 0

    if (isLoginRateLimited(emailFailures, ipFailures)) {
      await tx.securityEvent.create({
        data: { eventType: 'LOGIN_RATE_LIMITED', email: normalizedEmail, ipAddress },
      })
      return { status: 'rate_limited' }
    }

    const user = await findAdminUser(tx, normalizedEmail)
    const passwordMatches = user ? await bcrypt.compare(password, user.passwordHash) : false
    const authenticated = Boolean(user && isAccountLoginAllowed(user.isActive, passwordMatches))

    await tx.securityEvent.create({
      data: {
        eventType: authenticated ? 'LOGIN_SUCCESS' : 'LOGIN_FAILURE',
        email: normalizedEmail,
        ipAddress,
      },
    })

    if (!user || !isAccountLoginAllowed(user.isActive, passwordMatches)) return { status: 'invalid' }

    return {
      status: 'authenticated',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        mustChangePassword: user.mustChangePassword,
      },
    }
  })
}
