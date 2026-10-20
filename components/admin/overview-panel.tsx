import { INCIDENT_STATUSES, STATUS_META, formatNumber, type DashboardStats, type IncidentStatus } from '@/lib/admin-claims'
import { cn } from '@/lib/utils'

const SEGMENT_COLORS: Record<IncidentStatus, { bar: string; dot: string }> = {
  SUBMITTED: { bar: 'bg-[#2563eb]', dot: 'bg-[#2563eb]' },
  UNDER_REVIEW: { bar: 'bg-[#d98a00]', dot: 'bg-[#d98a00]' },
  SENT_TO_INSURER: { bar: 'bg-[#5b4bc4]', dot: 'bg-[#5b4bc4]' },
  CLOSED: { bar: 'bg-success', dot: 'bg-success' },
}

/** Read-only visual summary built from data the dashboard already loads. */
export function OverviewPanel({ stats }: { stats: DashboardStats }) {
  const total = INCIDENT_STATUSES.reduce((sum, status) => sum + stats.statusBreakdown[status], 0)
  const peak = Math.max(1, ...stats.trend.map((point) => point.count))
  const weekTotal = stats.trend.reduce((sum, point) => sum + point.count, 0)

  return (
    <section aria-label="نظرة عامة" className="grid gap-4 lg:grid-cols-5">
      {/* Pipeline ------------------------------------------------------- */}
      <article className="surface animate-fade-up p-5 sm:p-6 lg:col-span-2" style={{ animationDelay: '120ms' }}>
        <header className="flex items-baseline justify-between gap-3">
          <h2 className="text-lg font-bold text-ink">مسار المعالجة</h2>
          <span className="text-sm font-semibold text-ink-soft tabular-nums">{formatNumber(total)} بلاغ</span>
        </header>

        {total === 0 ? (
          <p className="mt-6 rounded-2xl bg-muted px-4 py-6 text-center text-sm font-semibold text-ink-soft">لا توجد بلاغات لعرض توزيعها بعد.</p>
        ) : (
          <>
            <div
              role="img"
              aria-label={INCIDENT_STATUSES.map((s) => `${STATUS_META[s].label}: ${stats.statusBreakdown[s]}`).join('، ')}
              className="mt-5 flex h-4 overflow-hidden rounded-full bg-muted"
            >
              {INCIDENT_STATUSES.map((status) => {
                const count = stats.statusBreakdown[status]
                if (count === 0) return null
                return (
                  <span
                    key={status}
                    className={cn('h-full transition-[width] duration-700', SEGMENT_COLORS[status].bar)}
                    style={{ width: `${(count / total) * 100}%` }}
                  />
                )
              })}
            </div>
            <ul className="mt-5 grid grid-cols-2 gap-x-4 gap-y-3.5">
              {INCIDENT_STATUSES.map((status) => {
                const count = stats.statusBreakdown[status]
                const percent = Math.round((count / total) * 100)
                return (
                  <li key={status} className="flex items-center gap-2.5">
                    <span aria-hidden="true" className={cn('size-3 shrink-0 rounded-full', SEGMENT_COLORS[status].dot)} />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-bold text-ink">{STATUS_META[status].label}</span>
                      <span className="block text-xs font-semibold text-ink-soft tabular-nums">
                        {formatNumber(count)} · {percent}%
                      </span>
                    </span>
                  </li>
                )
              })}
            </ul>
          </>
        )}
      </article>

      {/* 14-day trend --------------------------------------------------- */}
      <article className="surface animate-fade-up p-5 sm:p-6 lg:col-span-3" style={{ animationDelay: '180ms' }}>
        <header className="flex items-baseline justify-between gap-3">
          <h2 className="text-lg font-bold text-ink">وتيرة البلاغات — آخر 14 يوماً</h2>
          <span className="text-sm font-semibold text-ink-soft tabular-nums">{formatNumber(weekTotal)} بلاغ</span>
        </header>

        <div role="img" aria-label={`عدد البلاغات اليومي خلال 14 يوماً، المجموع ${weekTotal}`} className="mt-5 flex h-40 items-end gap-1.5 sm:gap-2" dir="rtl">
          {stats.trend.map((point) => {
            const height = point.count === 0 ? 4 : Math.max(10, (point.count / peak) * 100)
            return (
              <div key={point.key} className="group relative flex h-full flex-1 flex-col justify-end">
                <span
                  className="pointer-events-none absolute -top-1 left-1/2 z-10 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-lg bg-ink px-2.5 py-1 text-xs font-bold text-white opacity-0 shadow-raised transition-opacity group-hover:opacity-100"
                  aria-hidden="true"
                >
                  {point.label} · {point.count}
                </span>
                <span
                  className={cn(
                    'w-full rounded-t-lg transition-all duration-300 group-hover:brightness-110',
                    point.count === 0 ? 'bg-border' : 'bg-linear-to-t from-brand to-[#3b7ee0]',
                  )}
                  style={{ height: `${height}%` }}
                />
              </div>
            )
          })}
        </div>
        <div className="mt-2 flex gap-1.5 sm:gap-2" aria-hidden="true">
          {stats.trend.map((point, index) => (
            <span key={point.key} className="flex-1 text-center text-[11px] font-semibold text-ink-soft tabular-nums">
              {index % 2 === 0 || stats.trend.length <= 7 ? point.label.split(' ')[0] : ''}
            </span>
          ))}
        </div>
      </article>
    </section>
  )
}
