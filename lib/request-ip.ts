import { isIP } from 'node:net'

export function getRequestIp(headers: Headers): string | null {
  const realIp = headers.get('x-real-ip')?.trim()
  const forwardedFor = headers.get('x-forwarded-for')
  const candidates = [
    realIp,
    ...(forwardedFor ? forwardedFor.split(',').map((value) => value.trim()) : []),
  ]

  return candidates.find((candidate): candidate is string => Boolean(candidate && isIP(candidate))) ?? null
}
