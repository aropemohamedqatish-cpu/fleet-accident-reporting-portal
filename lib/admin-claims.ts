export { formatDateTime, formatDate, formatRelative, formatNumber } from './brand'

export const INCIDENT_STATUSES = ['SUBMITTED', 'UNDER_REVIEW', 'SENT_TO_INSURER', 'CLOSED'] as const
export type IncidentStatus = (typeof INCIDENT_STATUSES)[number]
export const ALLOWED_STATUS_TRANSITIONS: Record<IncidentStatus, readonly IncidentStatus[]> = {
  SUBMITTED: ['UNDER_REVIEW'],
  UNDER_REVIEW: ['SENT_TO_INSURER'],
  SENT_TO_INSURER: ['CLOSED'],
  CLOSED: [],
}

export type StatusTone = 'blue' | 'amber' | 'indigo' | 'green'

export const STATUS_META: Record<IncidentStatus, { label: string; description: string; tone: StatusTone }> = {
  SUBMITTED: { label: 'جديد', description: 'بلاغ مستلم بانتظار الفرز', tone: 'blue' },
  UNDER_REVIEW: { label: 'قيد المعالجة', description: 'فريق الحوادث يراجع التفاصيل', tone: 'amber' },
  SENT_TO_INSURER: { label: 'تمت الإحالة', description: 'أُحيل الملف إلى شركة التأمين', tone: 'indigo' },
  CLOSED: { label: 'مغلق', description: 'اكتملت معالجة الحادث', tone: 'green' },
}

export const STATUS_LABELS: Record<string, string> = Object.fromEntries(
  INCIDENT_STATUSES.map((status) => [status, STATUS_META[status].label]),
)

export function isIncidentStatus(value: string): value is IncidentStatus {
  return (INCIDENT_STATUSES as readonly string[]).includes(value)
}

export function canTransitionIncidentStatus(from: string, to: string): boolean {
  return isIncidentStatus(from) && isIncidentStatus(to) && ALLOWED_STATUS_TRANSITIONS[from].includes(to)
}

export function requiresStatusTransitionConfirmation(status: string): boolean {
  return status === 'SENT_TO_INSURER' || status === 'CLOSED'
}

export type AdminFilters = {
  status: IncidentStatus | 'ALL'
  from: string
  to: string
  search: string
}

export const DEFAULT_FILTERS: AdminFilters = {
  status: 'ALL',
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
  mediaCount: number
}

export type IncidentMedia = {
  id: string
  fileUrl: string
  fileType: string
  fileSize: number
}

export type IncidentDetail = IncidentRow & {
  governorate: string | null
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

export type TrendPoint = { key: string; label: string; count: number }

export type DashboardStats = {
  /** Every incident ever recorded. */
  allTime: number
  /** Incidents in the last 30 days. */
  total: number
  pending: number
  referred: number
  totalDelta: Delta
  pendingDelta: Delta
  referredDelta: Delta
  statusBreakdown: Record<IncidentStatus, number>
  /** Daily incident counts for the last 14 days (Damascus time), oldest first. */
  trend: TrendPoint[]
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

export function initialsOf(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  return (parts[0]?.[0] ?? '') + (parts.length > 1 ? (parts[1]?.[0] ?? '') : '')
}
