import { validateServerEnvironment } from '@/lib/server-env'

export function register(): void {
  validateServerEnvironment()
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
