import { ExternalLink, FileText, MapPin } from 'lucide-react'
import { mapLink, type IncidentDetail } from '@/lib/admin-claims'

export function DrawerLocation({ incident }: { incident: IncidentDetail }) {
  const hasGps = incident.latitude !== null && incident.longitude !== null
  return (
    <section aria-label="الموقع" className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
      <h3 className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-900">
        <MapPin className="size-4 text-[#003366]" aria-hidden="true" />
        الموقع والوصف
      </h3>
      <p className="text-sm leading-6 text-slate-600">{incident.locationDescription}</p>
      {hasGps && (
        <a href={mapLink(incident.latitude as number, incident.longitude as number)} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-[#003366]/20 bg-[#003366]/5 px-3 py-2 text-sm font-semibold text-[#003366] hover:bg-[#003366]/10">
          <ExternalLink className="size-4" aria-hidden="true" />
          فتح الإحداثيات في خرائط جوجل
          <span dir="ltr" className="font-mono text-xs">({incident.latitude}, {incident.longitude})</span>
        </a>
      )}
      {incident.notes && (
        <div className="mt-3 rounded-xl border border-slate-100 bg-white p-3 shadow-sm">
          <p className="mb-1 flex items-center gap-1.5 text-xs font-bold text-slate-600">
            <FileText className="size-3.5" aria-hidden="true" />
            ملاحظات إضافية
          </p>
          <p className="text-sm leading-6 text-slate-600">{incident.notes}</p>
        </div>
      )}
    </section>
  )
}
