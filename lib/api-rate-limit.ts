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
    throw new Error('Unable to determine the client IP address for rate limiting.')
  }

  try {
    const now = Date.now()
    if (now - lastCleanupAt >= CLEANUP_INTERVAL_MS) {
      try {
        await prisma.$executeRaw`
          DELETE FROM api_rate_limit_buckets
          WHERE updated_at < CURRENT_TIMESTAMP - INTERVAL '1 day'
        `
        lastCleanupAt = now
      } catch (cleanupError) {
        console.warn('[rate-limit] cleanup failed, continuing without cleanup.', cleanupError)
      }
    }

    const key = createBucketKey(route, ipAddress)
    const [bucket] = await prisma.$queryRaw<RateLimitRow[]>`
      INSERT INTO api_rate_limit_buckets (key, window_started_at, request_count, updated_at)
      VALUES (${key}, CURRENT_TIMESTAMP, 1, CURRENT_TIMESTAMP)
      ON CONFLICT (key) DO UPDATE SET
        request_count = CASE
          WHEN api_rate_limit_buckets.window_started_at <= CURRENT_TIMESTAMP - (${WINDOW_MS} * INTERVAL '1 millisecond')
            THEN 1
          ELSE api_rate_limit_buckets.request_count + 1
        END,
        window_started_at = CASE
          WHEN api_rate_limit_buckets.window_started_at <= CURRENT_TIMESTAMP - (${WINDOW_MS} * INTERVAL '1 millisecond')
            THEN CURRENT_TIMESTAMP
          ELSE api_rate_limit_buckets.window_started_at
        END,
        updated_at = CURRENT_TIMESTAMP
      RETURNING
        request_count AS "requestCount",
        GREATEST(
          1,
          CEIL(EXTRACT(EPOCH FROM (
            window_started_at + (${WINDOW_MS} * INTERVAL '1 millisecond') - CURRENT_TIMESTAMP
          )))::INTEGER
        ) AS "retryAfterSeconds"
    `

    if (!bucket) {
      console.warn('[rate-limit] counter not returned, allowing request (fail open)')
      return { allowed: true }
    }

    return bucket.requestCount > MAX_REQUESTS_PER_WINDOW
      ? { allowed: false, retryAfterSeconds: bucket.retryAfterSeconds }
      : { allowed: true }
  } catch (error) {
    if (process.env.NODE_ENV === 'production') throw error
    console.error('[rate-limit] unexpected error, allowing request in development.', error)
    return { allowed: true }
  }
}