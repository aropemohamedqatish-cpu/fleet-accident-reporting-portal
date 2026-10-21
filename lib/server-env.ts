export function getDatabaseUrl(): string {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    throw new Error('DATABASE_URL is missing. Configure PostgreSQL before using database-backed features.')
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

export function getServerEnvironmentIssues(): string[] {
  const issues: string[] = []
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    issues.push('DATABASE_URL is missing.')
  } else {
    try {
      const parsedUrl = new URL(connectionString)
      if (
        (parsedUrl.protocol !== 'postgres:' && parsedUrl.protocol !== 'postgresql:') ||
        !parsedUrl.hostname
      ) {
        issues.push('DATABASE_URL must use a PostgreSQL URL and include a host.')
      }
    } catch {
      issues.push('DATABASE_URL is not a valid URL.')
    }
  }

  const jwtSecret = process.env.JWT_SECRET
  if (!jwtSecret || new TextEncoder().encode(jwtSecret).length < 32) {
    issues.push('JWT_SECRET is missing or shorter than 32 bytes.')
  }

  return issues
}
