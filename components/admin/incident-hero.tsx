import Link from 'next/link'
import { ArrowRight, CalendarDays, CheckCircle2, Clock3, FileStack, Images, Send, TriangleAlert } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { PlateBadge } from '@/components/brand/plate'
import { CopyRefButton } from './copy-ref-button'
import { STATUS_LABELS, formatDateTime, formatRelative, shortRef, type IncidentDetail } from '@/lib/admin-claims'

const STATUS_ICONS = {
  SUBMITTED: Clock3,
  UNDER_REVIEW: TriangleAlert,
  SENT_TO_INSURER: Send,
  CLOSED: CheckCircle2,
} as const

function HeroStatusBadge({ status }: { status: string }) {
  const Icon = STATUS_ICONS[status as keyof typeof STATUS_ICONS]
  if (!Icon) return <Badge variant="outline" className="gap-1 border-white/25 bg-white/10 text-white">حالة غير معروفة</Badge>
  return (
    <Badge variant="outline" className="gap-1 border-white/25 bg-white/10 text-white">
      <Icon className="size-3" aria-hidden="true" />
      {STATUS_LABELS[status] ?? 'حالة غير معروفة'}
    </Badge>
  )
}

export function IncidentHero({ incident }: { incident: IncidentDetail }) {
  const stats = [
    { icon: FileStack, label: 'إجمالي المرفقات', value: String(incident.media.length) },
    { icon: Images, label: 'الصور', value: String(incident.media.length) },
    { icon: Clock3, label: 'آخر تحديث', value: formatRelative(incident.updatedAt) },
  ]

  return (
    <div className="space-y-4">
      <Link
        href="/admin/dashboard"
        className="inline-flex items-center gap-2 rounded-lg text-sm font-semibold text-[#003366] transition hover:underline"
      >
        <ArrowRight className="size-4" aria-hidden="true" />
        العودة إلى سجل البلاغات
      </Link>

      <section
        aria-label="ملخص البلاغ"
        className="relative overflow-hidden rounded-[24px] bg-[linear-gradient(150deg,#0b3a7a_0%,#00264d_55%,#04172f_100%)] text-white shadow-float"
      >
        <div aria-hidden="true" className="pointer-events-none absolute -top-24 -end-24 size-72 rounded-full bg-[#2f6fd0]/40 blur-3xl" />
        <div aria-hidden="true" className="pointer-events-none absolute -bottom-28 -start-20 size-72 rounded-full bg-[#0f7a46]/25 blur-3xl" />

        <div className="relative p-6 sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-bold">
                  بلاغ حادث أسطول
                </span>
                <HeroStatusBadge status={incident.status} />
              </div>
              <h1 className="mt-4 text-2xl font-bold tracking-tight sm:text-3xl">
                بلاغ اللوحة <span dir="ltr" className="font-mono">{incident.plateNumber}</span>
              </h1>
              <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-[#b4c8e8]">
                <span>
                  المرجع: <span dir="ltr" className="font-mono font-bold text-white">{shortRef(incident.id)}</span>
                </span>
                <CopyRefButton value={incident.id} label="نسخ المعرف الكامل" />
              </p>
              <p className="mt-1 text-sm text-[#b4c8e8]">
                المؤمن له: <span className="font-semibold text-white">{incident.reporterName}</span>
              </p>
              <div className="mt-5">
                <PlateBadge plate={incident.plateNumber} size="md" />
              </div>
            </div>

            <dl className="grid shrink-0 grid-cols-2 gap-3 sm:grid-cols-3 lg:w-[26rem] lg:grid-cols-2">
              {stats.map(({ icon: Icon, label, value }) => (
                <div key={label} className="rounded-2xl border border-white/15 bg-white/10 p-3.5 backdrop-blur">
                  <dt className="flex items-center gap-1.5 text-xs font-medium text-[#b4c8e8]">
                    <Icon className="size-3.5" aria-hidden="true" />
                    {label}
                  </dt>
                  <dd className="mt-1 truncate text-xl font-bold tabular-nums">{value}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 border-t border-white/15 pt-4 text-xs text-[#b4c8e8]">
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays className="size-3.5" aria-hidden="true" />
              وقت التسجيل: {formatDateTime(incident.createdAt)}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Clock3 className="size-3.5" aria-hidden="true" />
              آخر تحديث: {formatDateTime(incident.updatedAt)}
            </span>
          </div>
        </div>
      </section>
    </div>
  )
}
