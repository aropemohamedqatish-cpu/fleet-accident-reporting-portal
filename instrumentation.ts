import { getServerEnvironmentIssues } from '@/lib/server-env'

export function register(): void {
  const issues = getServerEnvironmentIssues()
  if (issues.length > 0) {
    console.error('Server environment configuration is incomplete. Database-backed routes may be unavailable.', {
      issues,
    })
  }
}

export function onRequestError(
  error: unknown,
  request: { path: string; method: string },
  context: { routePath: string; routerKind: string },
): void {
  console.error('Unhandled Next.js request error.', {
    path: request.path,
    method: request.method,
    routePath: context.routePath,
    routerKind: context.routerKind,
    error,
  })
}
