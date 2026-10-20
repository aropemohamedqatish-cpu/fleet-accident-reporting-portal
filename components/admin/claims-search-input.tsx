'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useState, useTransition } from 'react'
import { Search, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

function useDebouncedValue(value: string, delayMs: number) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs)
    return () => clearTimeout(timer)
  }, [value, delayMs])
  return debounced
}

export function ClaimsSearchInput() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [pending, startTransition] = useTransition()
  const [search, setSearch] = useState(searchParams.get('search') ?? '')
  const debouncedSearch = useDebouncedValue(search, 350)

  const apply = useCallback(
    (value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (!value) params.delete('search')
      else params.set('search', value)
      startTransition(() => router.replace(`${pathname}?${params.toString()}`, { scroll: false }))
    },
    [pathname, router, searchParams],
  )

  useEffect(() => {
    const current = searchParams.get('search') ?? ''
    if (debouncedSearch !== current) apply(debouncedSearch)
  }, [debouncedSearch, apply, searchParams])

  return (
    <div className="space-y-2">
      <Label htmlFor="claims-search">بحث فوري</Label>
      <div className="relative">
        <Search className="pointer-events-none absolute inset-y-0 start-4 my-auto size-5 text-brand" aria-hidden="true" />
        <Input
          id="claims-search"
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="اسم السائق، رقم الجوال، أو أرقام اللوحة…"
          className="h-13 ps-12 pe-12 text-base [&::-webkit-search-cancel-button]:hidden"
        />
        <div className="absolute inset-y-0 end-3 flex items-center gap-1">
          {pending && <span aria-hidden="true" className="size-4 animate-spin rounded-full border-2 border-brand border-t-transparent" />}
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              aria-label="مسح البحث"
              className="flex size-8 items-center justify-center rounded-lg text-ink-soft outline-none transition-colors hover:bg-secondary hover:text-ink focus-visible:ring-4 focus-visible:ring-ring/30"
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
