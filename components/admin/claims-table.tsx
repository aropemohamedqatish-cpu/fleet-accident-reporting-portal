'use client'

import { useState, useTransition, type KeyboardEvent } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, FileSearch, ImageOff, Loader2, Paperclip } from 'lucide-react'
import { PlateBadge } from '@/components/brand/plate'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { StatusBadge } from './status-badge'
import {
  formatDateTime,
  formatNumber,
  formatRelative,
  shortRef,
  type IncidentRow,
} from '@/lib/admin-claims'
import { cn } from '@/lib/utils'

export function ClaimsTable({
  rows,
  total,
  filteredTotal,
  currentPage,
  pageCount,
  filterQuery,
}: {
  rows: IncidentRow[]
  total: number
  filteredTotal: number
  currentPage: number
  pageCount: number
  filterQuery: string
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [navigatingId, setNavigatingId] = useState<string | null>(null)

  function openDetail(id: string) {
    setNavigatingId(id)
    startTransition(() => router.push(`/admin/incidents/${encodeURIComponent(id)}`))
  }

  function onRowKey(event: KeyboardEvent, id: string) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      openDetail(id)
    }
  }

  return (
    <>
      <Card className="animate-fade-up" style={{ animationDelay: '300ms' }}>
        <CardHeader className="flex-col gap-3 border-b border-border sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-xl">سجل البلاغات</CardTitle>
            <p className="mt-1 text-sm font-medium text-muted-foreground">اضغط على أي بلاغ لفتح صفحته وتفاصيله الكاملة ومرفقاته.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="h-8 px-3.5 text-sm tabular-nums">
              {formatNumber(rows.length)} بلاغ معروض
            </Badge>
            <Badge variant="outline" className="h-8 px-3.5 text-sm tabular-nums">
              آخر 30 يوماً: {formatNumber(total)}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="p-0 sm:p-0">
          {rows.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <span className="mx-auto flex size-16 items-center justify-center rounded-3xl bg-secondary text-brand">
                <FileSearch className="size-8" aria-hidden="true" />
              </span>
              <p className="mt-4 text-lg font-bold text-ink">لا توجد بلاغات مطابقة</p>
              <p className="mt-1 text-sm font-medium text-muted-foreground">جرّب تعديل الفلاتر أو كلمة البحث.</p>
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>المرجع</TableHead>
                      <TableHead>رقم اللوحة</TableHead>
                      <TableHead>المؤمن له ووسيلة التواصل</TableHead>
                      <TableHead>وقت التسجيل</TableHead>
                      <TableHead>المرفقات</TableHead>
                      <TableHead>الحالة</TableHead>
                      <TableHead className="w-12">
                        <span className="sr-only">فتح</span>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((row) => (
                      <TableRow
                        key={row.id}
                        className="group cursor-pointer outline-none focus-visible:bg-accent focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-ring/30"
                        onClick={() => openDetail(row.id)}
                        tabIndex={0}
                        onKeyDown={(e) => onRowKey(e, row.id)}
                        aria-label={`عرض تفاصيل بلاغ اللوحة ${row.plateNumber}`}
                      >
                        <TableCell>
                          <span dir="ltr" className="inline-flex rounded-lg bg-muted px-2.5 py-1 font-mono text-xs font-bold text-ink">
                            {shortRef(row.id)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <PlateBadge plate={row.plateNumber} size="sm" />
                        </TableCell>
                        <TableCell>
                          <p className="font-bold text-ink">{row.reporterName}</p>
                          <p dir="ltr" className="mt-0.5 text-start font-mono text-xs font-medium text-ink-soft">
                            {row.reporterPhone}
                          </p>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm font-semibold text-ink">{formatDateTime(row.createdAt)}</p>
                          <p suppressHydrationWarning className="mt-0.5 text-xs font-medium text-ink-soft">
                            {formatRelative(row.createdAt)}
                          </p>
                        </TableCell>
                        <TableCell>
                          <Attachments count={row.mediaCount} />
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={row.status} />
                        </TableCell>
                        <TableCell>
                          {pending && navigatingId === row.id ? (
                            <Loader2 className="size-5 animate-spin text-brand" aria-label="جارٍ التحميل" />
                          ) : (
                            <ChevronLeft
                              className="size-5 text-ink-soft transition-transform group-hover:-translate-x-1 group-hover:text-brand"
                              aria-hidden="true"
                            />
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile cards */}
              <ul className="divide-y divide-border md:hidden">
                {rows.map((row) => (
                  <li key={row.id}>
                    <button
                      type="button"
                      onClick={() => openDetail(row.id)}
                      aria-label={`عرض تفاصيل بلاغ اللوحة ${row.plateNumber}`}
                      className="flex w-full flex-col gap-3.5 px-5 py-4 text-start outline-none transition-colors active:bg-accent focus-visible:bg-accent"
                    >
                      <span className="flex items-center justify-between gap-3">
                        <PlateBadge plate={row.plateNumber} size="md" />
                        {pending && navigatingId === row.id ? (
                          <Loader2 className="size-5 animate-spin text-brand" aria-label="جارٍ التحميل" />
                        ) : (
                          <StatusBadge status={row.status} />
                        )}
                      </span>
                      <span className="flex items-end justify-between gap-3">
                        <span className="min-w-0">
                          <span className="block truncate text-base font-bold text-ink">{row.reporterName}</span>
                          <span dir="ltr" className="block text-start font-mono text-sm font-medium text-ink-soft">
                            {row.reporterPhone}
                          </span>
                        </span>
                        <span className="shrink-0 text-end">
                          <span suppressHydrationWarning className="block text-sm font-bold text-ink">
                            {formatRelative(row.createdAt)}
                          </span>
                          <span dir="ltr" className="block font-mono text-xs font-semibold text-ink-soft">
                            {shortRef(row.id)}
                          </span>
                        </span>
                      </span>
                      <span className="flex items-center justify-between gap-3 text-sm font-semibold text-ink-soft">
                        <Attachments count={row.mediaCount} />
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}
        </CardContent>
        {filteredTotal > 0 && (
          <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-5 py-4 sm:px-6">
            <p className="text-sm font-medium text-muted-foreground" aria-live="polite">
              الصفحة {formatNumber(currentPage)} من {formatNumber(pageCount)} — {formatNumber(filteredTotal)} بلاغ
            </p>
            <nav aria-label="ترقيم صفحات سجل البلاغات" className="flex items-center gap-2">
              {currentPage > 1 ? (
                <Link
                  href={`/admin/dashboard?${filterQuery ? `${filterQuery}&` : ''}page=${currentPage - 1}`}
                  className="inline-flex h-10 items-center rounded-lg border border-border px-4 text-sm font-bold text-ink hover:bg-accent"
                  rel="prev"
                >
                  السابق
                </Link>
              ) : (
                <span className="inline-flex h-10 items-center rounded-lg border border-border px-4 text-sm font-bold text-muted-foreground" aria-disabled="true">السابق</span>
              )}
              {currentPage < pageCount ? (
                <Link
                  href={`/admin/dashboard?${filterQuery ? `${filterQuery}&` : ''}page=${currentPage + 1}`}
                  className="inline-flex h-10 items-center rounded-lg border border-border px-4 text-sm font-bold text-ink hover:bg-accent"
                  rel="next"
                >
                  التالي
                </Link>
              ) : (
                <span className="inline-flex h-10 items-center rounded-lg border border-border px-4 text-sm font-bold text-muted-foreground" aria-disabled="true">التالي</span>
              )}
            </nav>
          </footer>
        )}
      </Card>
    </>
  )
}

function Attachments({ count }: { count: number }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold tabular-nums',
        count === 0 ? 'bg-danger-soft text-[#7a1a12]' : 'bg-success-soft text-[#0a5a33]',
      )}
    >
      {count === 0 ? <ImageOff className="size-3.5" aria-hidden="true" /> : <Paperclip className="size-3.5" aria-hidden="true" />}
      {count === 0 ? 'بلا مرفقات' : `${formatNumber(count)} ملفات`}
    </span>
  )
}
