import { createHmac } from 'node:crypto'
import { getRequestIp } from '@/lib/request-ip'
import { prisma } from '@/lib/prisma'

const WINDOW_MS = 60_000
const MAX_REQUESTS_PER_WINDOW = 5
const CLEANUP_INTERVAL_MS = 60 * 60 * 1000
let lastCleanupAt = 0

type RateLimitRow = {
  requestCount: number
  retryAfterSeconds: number
}

export type ApiRateLimitResult =
  | { allowed: true }
  | { allowed: false; retryAfterSeconds: number }

function createBucketKey(route: string, ipAddress: string): string {
  const secret = process.env.JWT_SECRET || process.env.DATABASE_URL || 'arope-rate-limit'
  return createHmac('sha256', secret).update(`${route}:${ipAddress}`).digest('hex')
}

export async function checkApiRateLimit(
  headers: Headers,
  route: 'vehicle-verification' | 'incident-submission',
): Promise<ApiRateLimitResult> {
  const ipAddress = getRequestIp(headers) ?? (process.env.NODE_ENV === 'development' ? 'local-development' : null)
  if (!ipAddress) {
    throw new Error('Unable to determine the client IP address for API rate limiting.')
  }

  const now = Date.now()
  if (now - lastCleanupAt >= CLEANUP_INTERVAL_MS) {
    await prisma.$executeRaw`
      DELETE FROM "ApiRateLimitBucket"
      WHERE "updatedAt" < CURRENT_TIMESTAMP - INTERVAL '1 day'
    `
    lastCleanupAt = now
  }

  const key = createBucketKey(route, ipAddress)
  const [bucket] = await prisma.$queryRaw<RateLimitRow[]>`
    INSERT INTO "ApiRateLimitBucket" ("key", "windowStartedAt", "requestCount", "updatedAt")
    VALUES (${key}, CURRENT_TIMESTAMP, 1, CURRENT_TIMESTAMP)
    ON CONFLICT ("key") DO UPDATE SET
      "requestCount" = CASE
        WHEN "ApiRateLimitBucket"."windowStartedAt" <= CURRENT_TIMESTAMP - (${WINDOW_MS} * INTERVAL '1 millisecond')
          THEN 1
        ELSE "ApiRateLimitBucket"."requestCount" + 1
      END,
      "windowStartedAt" = CASE
        WHEN "ApiRateLimitBucket"."windowStartedAt" <= CURRENT_TIMESTAMP - (${WINDOW_MS} * INTERVAL '1 millisecond')
          THEN CURRENT_TIMESTAMP
        ELSE "ApiRateLimitBucket"."windowStartedAt"
      END,
      "updatedAt" = CURRENT_TIMESTAMP
    RETURNING
      "requestCount",
      GREATEST(
        1,
        CEIL(EXTRACT(EPOCH FROM (
          "windowStartedAt" + (${WINDOW_MS} * INTERVAL '1 millisecond') - CURRENT_TIMESTAMP
        )))::INTEGER
      ) AS "retryAfterSeconds"
  `

  if (!bucket) {
    throw new Error('API rate limit counter was not returned by the database.')
  }

  return bucket.requestCount > MAX_REQUESTS_PER_WINDOW
    ? { allowed: false, retryAfterSeconds: bucket.retryAfterSeconds }
    : { allowed: true }
}
