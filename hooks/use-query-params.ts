'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useTransition } from 'react'

/**
 * URL-as-state helper for server-driven filters. Passing `null` or an empty string removes a key;
 * any change resets pagination unless `page` is explicitly provided.
 */
export function useQueryParams() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [pending, startTransition] = useTransition()

  const get = useCallback((key: string) => searchParams.get(key) ?? '', [searchParams])

  const set = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString())
      for (const [key, value] of Object.entries(updates)) {
        if (value === null || value === '') params.delete(key)
        else params.set(key, value)
      }
      if (!('page' in updates)) params.delete('page')
      const query = params.toString()
      startTransition(() => router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false }))
    },
    [pathname, router, searchParams],
  )

  const clear = useCallback(
    (keys: readonly string[]) => {
      const params = new URLSearchParams(searchParams.toString())
      for (const key of keys) params.delete(key)
      params.delete('page')
      const query = params.toString()
      startTransition(() => router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false }))
    },
    [pathname, router, searchParams],
  )

  return { get, set, clear, pending }
}
