'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useTransition } from 'react'
import { CalendarDays, ListFilter } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { STATUS_LABELS } from '@/lib/admin-claims'

export function ClaimsSelectFilters() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [pending, startTransition] = useTransition()

  const status = searchParams.get('status') ?? 'ALL'
  const from = searchParams.get('from') ?? ''
  const to = searchParams.get('to') ?? ''

  function setParam(key: string, value: string | null, fallback: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (!value || value === fallback) params.delete(key)
    else params.set(key, value)
    startTransition(() => router.replace(`${pathname}?${params.toString()}`, { scroll: false }))
  }

  function clearAll() {
    startTransition(() => router.replace(pathname, { scroll: false }))
  }

  const hasActive = status !== 'ALL' || from !== '' || to !== ''

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <div className="space-y-1.5">
        <Label htmlFor="claims-status" className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
          <ListFilter className="size-3.5 text-[#003366]" aria-hidden="true" />
          حالة البلاغ
        </Label>
        <Select value={status} onValueChange={(v) => setParam('status', v, 'ALL')} disabled={pending}>
          <SelectTrigger id="claims-status" className="h-11 border-slate-300 bg-white">
            <SelectValue placeholder="كل الحالات" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">كل الحالات</SelectItem>
            <SelectItem value="SUBMITTED">{STATUS_LABELS.SUBMITTED}</SelectItem>
            <SelectItem value="UNDER_REVIEW">{STATUS_LABELS.UNDER_REVIEW}</SelectItem>
            <SelectItem value="SENT_TO_INSURER">{STATUS_LABELS.SENT_TO_INSURER}</SelectItem>
            <SelectItem value="CLOSED">{STATUS_LABELS.CLOSED}</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="claims-from" className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
          <CalendarDays className="size-3.5 text-[#003366]" aria-hidden="true" />
          من تاريخ
        </Label>
        <Input
          id="claims-from"
          type="date"
          value={from}
          max={to || undefined}
          onChange={(e) => setParam('from', e.target.value, '')}
          className="h-11 border-slate-300 bg-white"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="claims-to" className="text-xs font-semibold text-slate-700">إلى تاريخ</Label>
        <Input
          id="claims-to"
          type="date"
          value={to}
          min={from || undefined}
          onChange={(e) => setParam('to', e.target.value, '')}
          className="h-11 border-slate-300 bg-white"
        />
      </div>
      <div className="flex items-end">
        <button
          type="button"
          disabled={!hasActive || pending}
          onClick={clearAll}
          className="h-11 w-full rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          مسح الفلاتر
        </button>
      </div>
    </div>
  )
}
