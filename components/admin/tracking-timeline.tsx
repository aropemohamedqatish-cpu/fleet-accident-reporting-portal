import { ArrowRightLeft, CircleDot, ShieldCheck } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

type TimelineEntry = {
  id: string
  actionType: string
  details: string
  createdAt: Date
  user: { name: string }
}

const ACTION_LABELS: Record<string, string> = {
  CLAIM_TRANSFERRED: 'إعادة إسناد البلاغ',
  STATUS_UPDATED: 'تحديث حالة البلاغ',
  ADMIN_LOGIN: 'تسجيل دخول إداري',
}

const ACTION_ICONS: Record<string, typeof ArrowRightLeft> = {
  CLAIM_TRANSFERRED: ArrowRightLeft,
  STATUS_UPDATED: CircleDot,
  ADMIN_LOGIN: ShieldCheck,
}

const DAMASCUS_DATE = new Intl.DateTimeFormat('ar-SY', {
  dateStyle: 'long',
  timeStyle: 'short',
  timeZone: 'Asia/Damascus',
})

export function TrackingTimeline({ entries, loadError }: { entries: TimelineEntry[]; loadError?: string }) {
  return (
    <section
      aria-labelledby="tracking-timeline-title"
      className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm"
      dir="rtl"
    >
      <header className="border-b border-slate-200 bg-slate-50 px-5 py-5 sm:px-7">
        <p className="text-xs font-bold tracking-wide text-[#003366]">سجل موثّق</p>
        <h2 id="tracking-timeline-title" className="mt-1 text-xl font-extrabold text-slate-950">
          الخط الزمني لمتابعة البلاغ
        </h2>
        <p className="mt-1 text-sm font-medium text-slate-700">
          سجل الإجراءات المسجلة على هذا البلاغ مرتبة من الأحدث إلى الأقدم.
        </p>
      </header>

      {loadError ? (
        <div role="alert" className="m-5 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm font-bold leading-6 text-amber-950">
          {loadError}
        </div>
      ) : entries.length === 0 ? (
        <div className="px-6 py-10 text-center">
          <span className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-[#003366]/10 text-[#003366]">
            <CircleDot className="size-6" aria-hidden="true" />
          </span>
          <p className="mt-3 font-bold text-slate-900">لا توجد إجراءات مسجلة بعد</p>
          <p className="mt-1 text-sm font-medium text-slate-700">ستظهر تحديثات متابعة البلاغ هنا.</p>
        </div>
      ) : (
        <ol className="space-y-0 px-5 py-5 sm:px-7">
          {entries.map((entry, index) => {
            const Icon = ACTION_ICONS[entry.actionType] ?? CircleDot
            return (
              <li key={entry.id} className="relative pb-6 last:pb-0">
                {index < entries.length - 1 && (
                  <span aria-hidden="true" className="absolute start-[19px] top-11 bottom-0 w-px bg-slate-300" />
                )}
                <article className="relative flex gap-4">
                  <span className="z-10 flex size-10 shrink-0 items-center justify-center rounded-full border-2 border-white bg-[#003366] text-white shadow-sm ring-1 ring-[#003366]/20">
                    <Icon className="size-4" aria-hidden="true" />
                  </span>
                  <div className="min-w-0 flex-1 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h3 className="font-extrabold text-slate-950">{entry.user.name}</h3>
                      <Badge className="border border-[#003366]/15 bg-[#003366]/10 font-bold text-[#003366] hover:bg-[#003366]/10">
                        {ACTION_LABELS[entry.actionType] ?? 'إجراء مسجل'}
                      </Badge>
                    </div>
                    <p className="mt-3 text-sm font-semibold leading-7 text-slate-800">{entry.details}</p>
                    <div className="mt-4 border-t border-slate-200 pt-3">
                      <time dateTime={entry.createdAt.toISOString()} className="text-xs font-semibold text-slate-700">
                        {DAMASCUS_DATE.format(entry.createdAt)}
                      </time>
                    </div>
                  </div>
                </article>
              </li>
            )
          })}
        </ol>
      )}
    </section>
  )
}
