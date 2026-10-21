import 'server-only'

const SUPERVISOR_CONFIG = {
  '1': {
    name: 'INCIDENT_SUPERVISOR_1_NAME',
    phone: 'INCIDENT_SUPERVISOR_1_PHONE',
    fallbackName: 'المشرف الأول',
  },
  '2': {
    name: 'INCIDENT_SUPERVISOR_2_NAME',
    phone: 'INCIDENT_SUPERVISOR_2_PHONE',
    fallbackName: 'المشرف الثاني',
  },
} as const

export class IncidentWhatsAppConfigError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'IncidentWhatsAppConfigError'
  }
}

export function getIncidentSupervisor(supervisorNumber: string) {
  if (supervisorNumber !== '1' && supervisorNumber !== '2') {
    throw new IncidentWhatsAppConfigError('رقم المشرف المحدد غير صالح.')
  }

  const config = SUPERVISOR_CONFIG[supervisorNumber]
  const rawPhone = process.env[config.phone]?.trim()
  if (!rawPhone) {
    throw new IncidentWhatsAppConfigError(`إعداد رقم ${config.fallbackName} غير موجود على الخادم.`)
  }

  const phone = rawPhone.replace(/[\s()+.-]/g, '')
  if (!/^[1-9]\d{7,14}$/.test(phone)) {
    throw new IncidentWhatsAppConfigError(`إعداد رقم ${config.fallbackName} غير صالح.`)
  }

  const name = process.env[config.name]?.trim() || config.fallbackName
  return { name, phone }
}

type IncidentWhatsAppDetails = {
  incidentId: string
  plateNumber: string
  reporterName: string
  reporterPhone: string
  locationDescription: string
  latitude: number | null
  longitude: number | null
  notes: string | null
  mediaCount: number
  createdAt: Date
}

export function buildIncidentWhatsAppUrl(phone: string, incident: IncidentWhatsAppDetails) {
  const locationDetails =
    incident.latitude !== null && incident.longitude !== null
      ? [
          `الإحداثيات: ${incident.latitude.toFixed(6)}, ${incident.longitude.toFixed(6)}`,
          `رابط الخريطة: https://www.google.com/maps?q=${incident.latitude},${incident.longitude}`,
        ]
      : [`الموقع: ${incident.locationDescription}`]
  const submittedAt = new Intl.DateTimeFormat('ar-SY', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Damascus',
  }).format(incident.createdAt)
  const message = [
    'بلاغ حادث أسطول — آروب سورية',
    `رقم البلاغ: ${incident.incidentId}`,
    `رقم اللوحة: ${incident.plateNumber}`,
    `اسم المؤمن له: ${incident.reporterName}`,
    `رقم الجوال: ${incident.reporterPhone}`,
    ...locationDetails,
    `تفاصيل الحادث: ${incident.notes ?? '—'}`,
    `عدد المرفقات: ${incident.mediaCount}`,
    `وقت تسجيل البلاغ: ${submittedAt}`,
  ].join('\n')

  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
}
