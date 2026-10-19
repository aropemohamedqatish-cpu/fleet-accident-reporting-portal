export const INCIDENT_STATUSES = ['SUBMITTED', 'UNDER_REVIEW', 'SENT_TO_INSURER', 'CLOSED'] as const
export type IncidentStatus = (typeof INCIDENT_STATUSES)[number]

export const STATUS_LABELS: Record<string, string> = {
  SUBMITTED: 'جديد',
  UNDER_REVIEW: 'قيد المعالجة',
  SENT_TO_INSURER: 'تمت الإحالة',
  CLOSED: 'مغلق',
}

export type VehicleClass = 'PASSENGER' | 'TRANSPORT'

export function vehicleClassOf(plate: string): VehicleClass {
  return plate.startsWith('61') ? 'TRANSPORT' : 'PASSENGER'
}

export const VEHICLE_CLASS_LABELS: Record<VehicleClass, string> = {
  PASSENGER: 'سياحية خاصة',
  TRANSPORT: 'نقل خاص / شاحنة',
}

export type AdminFilters = {
  status: IncidentStatus | 'ALL'
  prefix: 'ALL' | '12' | '61'
  from: string
  to: string
  search: string
}

export const DEFAULT_FILTERS: AdminFilters = {
  status: 'ALL',
  prefix: 'ALL',
  from: '',
  to: '',
  search: '',
}

export type IncidentRow = {
  id: string
  idempotencyKey: string
  reporterName: string
  reporterPhone: string
  status: string
  createdAt: Date
  updatedAt: Date
  plateNumber: string
  vehicleClass: VehicleClass
  mediaCount: number
}

export type IncidentMedia = {
  id: string
  fileUrl: string
  fileType: string
  mediaType: 'IMAGE' | 'VIDEO'
  fileSize: number
}

export type IncidentDetail = IncidentRow & {
  locationDescription: string
  latitude: number | null
  longitude: number | null
  notes: string | null
  media: IncidentMedia[]
}

export type Delta = {
  value: number
  direction: 'up' | 'down' | 'neutral'
}

export type DashboardStats = {
  total: number
  pending: number
  referred: number
  failedNotifications: number
  totalDelta: Delta
  pendingDelta: Delta
  referredDelta: Delta
  failedDelta: Delta
}

export function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat('ar-SY', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Damascus',
  }).format(date)
}

export function formatFileSize(bytes: number) {
  if (!bytes || bytes <= 0) return '—'
  if (bytes < 1024) return `${bytes} بايت`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} ك.ب`
  return `${(bytes / (1024 * 1024)).toFixed(1)} م.ب`
}

export function mapLink(lat: number, lng: number) {
  return `https://www.google.com/maps?q=${lat},${lng}`
}

export function shortRef(id: string) {
  return id.slice(0, 8).toUpperCase()
}
