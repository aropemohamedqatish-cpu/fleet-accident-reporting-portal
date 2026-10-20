import { FileText, MapPin } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { mapLink, type IncidentDetail } from '@/lib/admin-claims'

export function IncidentLocationCard({ incident }: { incident: IncidentDetail }) {
  const hasGps = incident.latitude !== null && incident.longitude !== null

  return (
    <Card className="overflow-hidden rounded-[20px] border border-slate-100 bg-white shadow-sm">
      <CardHeader className="border-b border-slate-100 px-6 py-4">
        <CardTitle className="flex items-center gap-2 text-base font-bold text-slate-950">
          <span className="flex size-9 items-center justify-center rounded-xl bg-[#003366]/10 text-[#003366]">
            <MapPin className="size-5" aria-hidden="true" />
          </span>
          الموقع ووصف الحادث
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 px-6 py-5">
        <p className="text-[15px] leading-7 text-slate-700">{incident.locationDescription}</p>
        {hasGps ? (
          <div className="flex flex-col gap-3 rounded-2xl border border-[#003366]/15 bg-[#003366]/5 p-4 sm:flex-row sm:items-center sm:justify-between">
            <p dir="ltr" className="font-mono text-sm font-semibold text-[#003366]">
              {incident.latitude}, {incident.longitude}
            </p>
            <a
              href={mapLink(incident.latitude as number, incident.longitude as number)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#003366] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#00264d]"
            >
              فتح الموقع في خرائط جوجل
            </a>
          </div>
        ) : (
          <p className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-500">
            حُدّد الموقع بوصف يدوي — لا توجد إحداثيات GPS لهذا البلاغ.
          </p>
        )}
        <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
          <p className="mb-1.5 flex items-center gap-1.5 text-xs font-bold text-slate-600">
            <FileText className="size-3.5" aria-hidden="true" />
            وصف الحادث من السائق
          </p>
          {incident.notes ? (
            <p className="text-sm leading-7 whitespace-pre-wrap text-slate-700">{incident.notes}</p>
          ) : (
            <p className="text-sm text-slate-400">لا يوجد وصف إضافي.</p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
