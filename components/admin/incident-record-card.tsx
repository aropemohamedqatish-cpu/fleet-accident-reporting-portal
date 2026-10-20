import { CalendarDays, Clock3, Hash } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDateTime, formatRelative, type IncidentDetail } from '@/lib/admin-claims'

export function IncidentRecordCard({ incident }: { incident: IncidentDetail }) {
  return (
    <Card className="overflow-hidden rounded-[20px] border border-slate-100 bg-white shadow-sm">
      <CardHeader className="border-b border-slate-100 px-6 py-4">
        <CardTitle className="flex items-center gap-2 text-base font-bold text-slate-950">
          <span className="flex size-9 items-center justify-center rounded-xl bg-[#003366]/10 text-[#003366]">
            <Hash className="size-5" aria-hidden="true" />
          </span>
          سجل البلاغ
        </CardTitle>
      </CardHeader>
      <CardContent className="px-6 py-4">
        <ol className="relative space-y-5 border-s-2 border-slate-100 ps-5">
          <li className="relative">
            <span aria-hidden="true" className="absolute -start-[29px] top-0.5 size-3 rounded-full bg-[#003366] ring-4 ring-[#003366]/15" />
            <p className="text-sm font-bold text-slate-900">استلام البلاغ</p>
            <p className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-500">
              <CalendarDays className="size-3.5" aria-hidden="true" />
              {formatDateTime(incident.createdAt)}
            </p>
          </li>
          <li className="relative">
            <span aria-hidden="true" className="absolute -start-[29px] top-0.5 size-3 rounded-full bg-emerald-500 ring-4 ring-emerald-500/15" />
            <p className="text-sm font-bold text-slate-900">آخر نشاط على الملف</p>
            <p className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-500">
              <Clock3 className="size-3.5" aria-hidden="true" />
              {formatDateTime(incident.updatedAt)} ({formatRelative(incident.updatedAt)})
            </p>
          </li>
        </ol>
        <div className="mt-5 rounded-2xl bg-slate-50 p-4">
          <p className="text-xs font-semibold text-slate-500">المعرف الكامل للبلاغ</p>
          <p dir="ltr" className="mt-1 break-all text-left font-mono text-xs text-slate-700">{incident.id}</p>
        </div>
      </CardContent>
    </Card>
  )
}
