import { CalendarDays, Phone, User } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDateTime, formatRelative, type IncidentDetail } from '@/lib/admin-claims'

export function IncidentDriverCard({ incident }: { incident: IncidentDetail }) {
  return (
    <Card className="overflow-hidden rounded-[20px] border border-slate-100 bg-white shadow-sm">
      <CardHeader className="border-b border-slate-100 px-6 py-4">
        <CardTitle className="flex items-center gap-2 text-base font-bold text-slate-950">
          <span className="flex size-9 items-center justify-center rounded-xl bg-[#003366]/10 text-[#003366]">
            <User className="size-5" aria-hidden="true" />
          </span>
          بيانات السائق المُبلِّغ
        </CardTitle>
      </CardHeader>
      <CardContent className="px-6 py-4">
        <dl className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl bg-slate-50 p-4">
            <dt className="text-xs font-semibold text-slate-500">الاسم الكامل</dt>
            <dd className="mt-1 font-bold text-slate-900">{incident.reporterName}</dd>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4">
            <dt className="flex items-center gap-1 text-xs font-semibold text-slate-500">
              <Phone className="size-3.5" aria-hidden="true" />
              رقم الجوال
            </dt>
            <dd dir="ltr" className="mt-1 text-right font-mono font-bold text-slate-900">
              <a href={`tel:${incident.reporterPhone}`} className="hover:text-[#003366] hover:underline">
                {incident.reporterPhone}
              </a>
            </dd>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4">
            <dt className="flex items-center gap-1 text-xs font-semibold text-slate-500">
              <CalendarDays className="size-3.5" aria-hidden="true" />
              وقت التسجيل
            </dt>
            <dd className="mt-1 text-sm font-semibold text-slate-900">{formatDateTime(incident.createdAt)}</dd>
            <dd className="text-xs text-slate-500">{formatRelative(incident.createdAt)}</dd>
          </div>
        </dl>
      </CardContent>
    </Card>
  )
}
