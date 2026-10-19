'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useState, useTransition } from 'react'
import { Search } from 'lucide-react'
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
  const [, startTransition] = useTransition()
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
    <div className="space-y-1.5">
      <Label htmlFor="claims-search" className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
        <Search className="size-3.5 text-[#003366]" aria-hidden="true" />
        بحث فوري
      </Label>
      <Input
        id="claims-search"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="اسم السائق، رقم الجوال، أو أرقام اللوحة…"
        className="h-11 border-slate-300 bg-white"
      />
    </div>
  )
}
