import type { Vehicle } from './fleet-data'
import type { LocationData, SubmissionOutcome } from './report-types'
import type { ReporterData } from './validation'

export const INCIDENT_SUPERVISORS = [
  { name: 'المشرف الأول', phone: '963992576455' },
  { name: 'المشرف الثاني', phone: '963966888943' },
] as const

export type IncidentWhatsAppDetails = {
  outcome: SubmissionOutcome
  vehicle: Vehicle
  location: LocationData
  reporter: ReporterData
  photoCount: number
}

export function buildIncidentWhatsAppText({
  outcome,
  vehicle,
  location,
  reporter,
  photoCount,
}: IncidentWhatsAppDetails): string {
  const locationDetails = location.mode === 'gps'
    ? [
        `الإحداثيات: ${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}`,
        `دقة الموقع التقريبية: ${Math.round(location.accuracy)} متر`,
        `رابط الخريطة: https://www.google.com/maps?q=${location.lat},${location.lng}`,
      ]
    : [`الموقع: ${location.description}`]

  const submittedAt = new Intl.DateTimeFormat('ar-SY', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Damascus',
  }).format(new Date(outcome.submittedAt))

  return [
    'بلاغ حادث أسطول — آروب سورية',
    `رقم البلاغ: ${outcome.ticketId}`,
    `رقم اللوحة: ${vehicle.plate}`,
    `اسم المؤمن له: ${reporter.fullName}`,
    `رقم الجوال: ${reporter.mobile}`,
    ...locationDetails,
    `تفاصيل الحادث: ${reporter.notes}`,
    `عدد الصور المرفقة: ${photoCount}`,
    `وقت تسجيل البلاغ: ${submittedAt}`,
  ].join('\n')
}

export function buildIncidentWhatsAppUrl(phone: string, details: IncidentWhatsAppDetails): string {
  return `https://wa.me/${phone}?text=${encodeURIComponent(buildIncidentWhatsAppText(details))}`
}
