import { ListChecks, PhoneCall, TriangleAlert } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StatusUpdater } from './status-updater'
import { ArchiveExportButton } from './archive-export-button'
import type { IncidentDetail } from '@/lib/admin-claims'

export function IncidentActionsPanel({ incident }: { incident: IncidentDetail }) {
  const hasMedia = incident.media.length > 0

  return (
    <div className="space-y-6 lg:sticky lg:top-5">
      {/* ── Status ─────────────────────────────────────────── */}
      <Card className="overflow-hidden rounded-[20px] border border-slate-100 bg-white shadow-sm">
        <CardHeader className="border-b border-slate-100 px-6 py-4">
          <CardTitle className="flex items-center gap-2 text-base font-bold text-slate-950">
            <span className="flex size-9 items-center justify-center rounded-xl bg-[#003366]/10 text-[#003366]">
              <ListChecks className="size-5" aria-hidden="true" />
            </span>
            معالجة البلاغ
          </CardTitle>
        </CardHeader>
        <CardContent className="px-6 py-5">
          <StatusUpdater id={incident.id} current={incident.status} />
        </CardContent>
      </Card>

      {/* ── Warnings ───────────────────────────────────────── */}
      {!hasMedia && (
        <div className="flex items-start gap-2.5 rounded-[20px] border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-800" role="alert">
          <TriangleAlert className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
          <p>
            <span className="font-bold">تنبيه: بدون مرفقات.</span>
            {' '}تحقق من سلامة الإرسال قبل إحالة الملف إلى شركة التأمين.
          </p>
        </div>
      )}

      {/* ── Contact ────────────────────────────────────────── */}
      <Card className="overflow-hidden rounded-[20px] border border-slate-100 bg-white shadow-sm">
        <CardContent className="px-6 py-5">
          <a
            href={`tel:${incident.reporterPhone}`}
            className="flex min-h-12 items-center justify-center gap-2 rounded-xl border-2 border-[#003366] px-4 py-2.5 text-sm font-bold text-[#003366] transition hover:bg-[#003366] hover:text-white"
          >
            <PhoneCall className="size-4" aria-hidden="true" />
            <span dir="ltr" className="font-mono">{incident.reporterPhone}</span>
            <span>— اتصال بالسائق</span>
          </a>
        </CardContent>
      </Card>

      {/* ── Export ─────────────────────────────────────────── */}
      <Card className="overflow-hidden rounded-[20px] border border-slate-100 bg-white shadow-sm">
        <CardContent className="p-0">
          <ArchiveExportButton id={incident.id} plate={incident.plateNumber} />
        </CardContent>
      </Card>
    </div>
  )
}
