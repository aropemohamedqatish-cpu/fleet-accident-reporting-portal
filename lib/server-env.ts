import { validateJwtSecret } from '@/lib/session-token'

export function getDatabaseUrl(): string {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    throw new Error('DATABASE_URL is missing. Configure the PostgreSQL connection string before starting the server.')
  }

  let parsedUrl: URL
  try {
    parsedUrl = new URL(connectionString)
  } catch {
    throw new Error('DATABASE_URL is invalid. Use a valid PostgreSQL connection URL.')
  }

  if (
    (parsedUrl.protocol !== 'postgres:' && parsedUrl.protocol !== 'postgresql:') ||
    !parsedUrl.hostname
  ) {
    throw new Error('DATABASE_URL is invalid. It must use the postgres:// or postgresql:// scheme and include a host.')
  }

  return connectionString
}

export function validateServerEnvironment(): void {
  getDatabaseUrl()
  validateJwtSecret()
}
