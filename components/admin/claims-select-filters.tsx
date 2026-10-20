'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useTransition } from 'react'
import { CalendarDays, CarFront, ListFilter, RotateCcw } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Segmented, type SegmentedOption } from '@/components/ui/segmented'
import { INCIDENT_STATUSES, STATUS_META } from '@/lib/admin-claims'
import { PLATE_CATEGORIES } from '@/lib/plate'

type StatusValue = 'ALL' | (typeof INCIDENT_STATUSES)[number]
type PrefixValue = 'ALL' | '12' | '61'

const STATUS_OPTIONS: readonly SegmentedOption<StatusValue>[] = [
  { value: 'ALL', label: 'كل الحالات' },
  ...INCIDENT_STATUSES.map((status) => ({ value: status, label: STATUS_META[status].label })),
]

const PREFIX_OPTIONS: readonly SegmentedOption<PrefixValue>[] = [
  { value: 'ALL', label: 'كل الفئات' },
  ...PLATE_CATEGORIES.map((category) => ({
    value: category.prefix as PrefixValue,
    label: `${category.label} (${category.prefix})`,
  })),
]

export function ClaimsSelectFilters() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [pending, startTransition] = useTransition()

  const status = (searchParams.get('status') ?? 'ALL') as StatusValue
  const prefix = (searchParams.get('prefix') ?? 'ALL') as PrefixValue
  const from = searchParams.get('from') ?? ''
  const to = searchParams.get('to') ?? ''

  function setParam(key: string, value: string, fallback: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (!value || value === fallback) params.delete(key)
    else params.set(key, value)
    startTransition(() => router.replace(`${pathname}?${params.toString()}`, { scroll: false }))
  }

  function clearAll() {
    startTransition(() => router.replace(pathname, { scroll: false }))
  }

  const hasActive = status !== 'ALL' || prefix !== 'ALL' || from !== '' || to !== ''

  return (
    <div className="relative space-y-5" aria-busy={pending}>
      {pending && <span aria-hidden="true" className="skeleton absolute -top-2 inset-x-0 h-1 rounded-full" />}

      <div className="grid gap-5 xl:grid-cols-2">
        <div className="space-y-2">
          <Label>
            <ListFilter className="size-4 text-brand" aria-hidden="true" />
            حالة البلاغ
          </Label>
          <Segmented label="حالة البلاغ" options={STATUS_OPTIONS} value={status} onChange={(v) => setParam('status', v, 'ALL')} disabled={pending} />
        </div>
        <div className="space-y-2">
          <Label>
            <CarFront className="size-4 text-brand" aria-hidden="true" />
            فئة المركبة
          </Label>
          <Segmented label="فئة المركبة" options={PREFIX_OPTIONS} value={prefix} onChange={(v) => setParam('prefix', v, 'ALL')} disabled={pending} />
        </div>
      </div>

      <div className="grid items-end gap-4 sm:grid-cols-2 xl:grid-cols-[1fr_1fr_auto]">
        <div className="space-y-2">
          <Label htmlFor="claims-from">
            <CalendarDays className="size-4 text-brand" aria-hidden="true" />
            من تاريخ
          </Label>
          <Input id="claims-from" type="date" value={from} max={to || undefined} onChange={(e) => setParam('from', e.target.value, '')} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="claims-to">
            <CalendarDays className="size-4 text-brand" aria-hidden="true" />
            إلى تاريخ
          </Label>
          <Input id="claims-to" type="date" value={to} min={from || undefined} onChange={(e) => setParam('to', e.target.value, '')} />
        </div>
        <Button type="button" variant="outline" size="lg" disabled={!hasActive || pending} onClick={clearAll} className="sm:col-span-2 xl:col-span-1">
          <RotateCcw className="size-4" aria-hidden="true" />
          مسح الفلاتر
        </Button>
      </div>
    </div>
  )
}
