import { CalendarDays, CarFront, Phone, User } from 'lucide-react'
import { formatDateTime, VEHICLE_CLASS_LABELS, type IncidentDetail } from '@/lib/admin-claims'

export function DrawerDriverInfo({ incident }: { incident: IncidentDetail }) {
  return (
    <section aria-label="بيانات السائق" className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
      <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-900">
        <User className="size-4 text-[#003366]" aria-hidden="true" />
        بيانات السائق المُبلِّغ
      </h3>
      <dl className="grid gap-2.5 text-sm">
        <div className="flex items-center justify-between gap-2">
          <dt className="text-slate-600">الاسم الكامل</dt>
          <dd className="font-semibold text-slate-900">{incident.reporterName}</dd>
        </div>
        <div className="flex items-center justify-between gap-2">
          <dt className="flex items-center gap-1 text-slate-600"><Phone className="size-3.5" aria-hidden="true" /> الجوال</dt>
          <dd dir="ltr" className="font-mono font-semibold text-slate-900">{incident.reporterPhone}</dd>
        </div>
        <div className="flex items-center justify-between gap-2">
          <dt className="flex items-center gap-1 text-slate-600"><CarFront className="size-3.5" aria-hidden="true" /> فئة المركبة</dt>
          <dd className="font-semibold text-slate-900">{VEHICLE_CLASS_LABELS[incident.vehicleClass]}</dd>
        </div>
        <div className="flex items-center justify-between gap-2">
          <dt className="flex items-center gap-1 text-slate-600"><CalendarDays className="size-3.5" aria-hidden="true" /> وقت التسجيل</dt>
          <dd className="text-slate-600">{formatDateTime(incident.createdAt)}</dd>
        </div>
      </dl>
    </section>
  )
}
