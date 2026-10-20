import type { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { normalizeDigits } from '@/lib/plate'
import {
  INCIDENT_STATUSES,
  isIncidentStatus,
  type AdminFilters,
  type DashboardStats,
  type Delta,
  type IncidentDetail,
  type IncidentRow,
  type IncidentStatus,
  type TrendPoint,
} from './admin-claims'

const PAGE_SIZE = 50
const DAY_MS = 24 * 60 * 60 * 1000
const TIME_ZONE = 'Asia/Damascus'
/** Syria observes permanent UTC+3. */
const DAMASCUS_OFFSET = '+03:00'

/* -------------------------------------------------------------------------- */
/* Incidents                                                                  */
/* -------------------------------------------------------------------------- */

function buildWhere(filters: AdminFilters): Prisma.AccidentWhereInput {
  const and: Prisma.AccidentWhereInput[] = []

  if (filters.status !== 'ALL') and.push({ status: filters.status })

  const createdAt: { gte?: Date; lte?: Date } = {}
  if (filters.from) {
    const gte = new Date(`${filters.from}T00:00:00${DAMASCUS_OFFSET}`)
    if (!Number.isNaN(gte.getTime())) createdAt.gte = gte
  }
  if (filters.to) {
    const lte = new Date(`${filters.to}T23:59:59.999${DAMASCUS_OFFSET}`)
    if (!Number.isNaN(lte.getTime())) createdAt.lte = lte
  }
  if (createdAt.gte || createdAt.lte) and.push({ createdAt })

  const raw = filters.search.trim()
  if (raw) {
    const digits = normalizeDigits(raw).replace(/[\s-]/g, '')
    const or: Prisma.AccidentWhereInput[] = [
      { reporterName: { contains: raw, mode: 'insensitive' } },
      { reporterPhone: { contains: digits } },
      { vehicle: { plateNumber: { contains: digits } } },
    ]
    if (/^[0-9a-f]{6,}$/i.test(digits) && /[a-f]/i.test(digits)) {
      or.push({ id: { startsWith: digits.toLowerCase() } })
    }
    and.push({ OR: or })
  }

  return and.length > 0 ? { AND: and } : {}
}

export async function countIncidents(filters: AdminFilters): Promise<number> {
  return prisma.accident.count({ where: buildWhere(filters) })
}

export async function getIncidents(filters: AdminFilters): Promise<IncidentRow[]> {
  const rows = await prisma.accident.findMany({
    where: buildWhere(filters),
    orderBy: { createdAt: 'desc' },
    take: PAGE_SIZE,
    select: {
      id: true,
      idempotencyKey: true,
      reporterName: true,
      reporterPhone: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      vehicle: { select: { plateNumber: true } },
      _count: { select: { media: true } },
    },
  })
  return rows.map((row) => ({
    id: row.id,
    idempotencyKey: row.idempotencyKey,
    reporterName: row.reporterName,
    reporterPhone: row.reporterPhone,
    status: row.status,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    plateNumber: row.vehicle.plateNumber,
    vehicleClass: row.vehicle.plateNumber.slice(0, 2),
    mediaCount: row._count.media,
  }))
}

export async function getIncidentDetail(id: string): Promise<IncidentDetail | null> {
  if (!/^[0-9a-f-]{8,}$/i.test(id)) return null
  const row = await prisma.accident.findUnique({
    where: { id },
    select: {
      id: true,
      idempotencyKey: true,
      reporterName: true,
      reporterPhone: true,
      locationDescription: true,
      latitude: true,
      longitude: true,
      notes: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      vehicle: { select: { plateNumber: true } },
      media: {
        orderBy: { createdAt: 'asc' },
        select: { id: true, fileUrl: true, fileType: true, mediaType: true, fileSize: true },
      },
    },
  })
  if (!row) return null
  return {
    id: row.id,
    idempotencyKey: row.idempotencyKey,
    reporterName: row.reporterName,
    reporterPhone: row.reporterPhone,
    status: row.status,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    plateNumber: row.vehicle.plateNumber,
    mediaCount: row.media.length,
    locationDescription: row.locationDescription,
    latitude: row.latitude,
    longitude: row.longitude,
    notes: row.notes,
    media: row.media.map((m) => ({
      id: m.id,
      fileUrl: m.fileUrl,
      fileType: m.fileType,
      mediaType: m.mediaType,
      fileSize: m.fileSize,
    })),
  }
}

export async function updateIncidentStatus(id: string, status: string): Promise<boolean> {
  if (!isIncidentStatus(status)) return false
  try {
    await prisma.accident.update({ where: { id }, data: { status } })
    return true
  } catch {
    return false
  }
}

/* -------------------------------------------------------------------------- */
/* Dashboard statistics                                                       */
/* -------------------------------------------------------------------------- */

function delta(current: number, previous: number): Delta {
  if (previous === 0) {
    return current === 0 ? { value: 0, direction: 'neutral' } : { value: 100, direction: 'up' }
  }
  const change = ((current - previous) / previous) * 100
  const magnitude = Math.round(Math.abs(change))
  if (magnitude < 1) return { value: 0, direction: 'neutral' }
  return { value: magnitude, direction: change > 0 ? 'up' : 'down' }
}

const dayKeyFormat = new Intl.DateTimeFormat('en-CA', { timeZone: TIME_ZONE })
const dayLabelFormat = new Intl.DateTimeFormat('ar-SY-u-nu-latn', { day: 'numeric', month: 'short', timeZone: TIME_ZONE })

function buildTrend(now: Date, createdAts: Date[]): TrendPoint[] {
  const buckets = new Map<string, TrendPoint>()
  for (let i = 13; i >= 0; i -= 1) {
    const date = new Date(now.getTime() - i * DAY_MS)
    const key = dayKeyFormat.format(date)
    buckets.set(key, { key, label: dayLabelFormat.format(date), count: 0 })
  }
  for (const createdAt of createdAts) {
    const bucket = buckets.get(dayKeyFormat.format(createdAt))
    if (bucket) bucket.count += 1
  }
  return [...buckets.values()]
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const now = new Date()
  const currentFrom = new Date(now.getTime() - 30 * DAY_MS)
  const previousFrom = new Date(now.getTime() - 60 * DAY_MS)
  const trendFrom = new Date(now.getTime() - 14 * DAY_MS)

  const count = (where: Prisma.AccidentWhereInput, gte: Date, lte: Date) =>
    prisma.accident.count({ where: { ...where, createdAt: { gte, lte } } })

  const openWhere: Prisma.AccidentWhereInput = { status: { in: ['SUBMITTED', 'UNDER_REVIEW'] } }
  const referredWhere: Prisma.AccidentWhereInput = { status: { in: ['SENT_TO_INSURER', 'CLOSED'] } }
  const noMediaWhere: Prisma.AccidentWhereInput = { media: { none: {} } }

  const [
    allTime,
    totalCurrent,
    totalPrevious,
    pendingCurrent,
    pendingPrevious,
    referredCurrent,
    referredPrevious,
    missingCurrent,
    missingPrevious,
    grouped,
    recent,
  ] = await Promise.all([
    prisma.accident.count(),
    count({}, currentFrom, now),
    count({}, previousFrom, currentFrom),
    count(openWhere, currentFrom, now),
    count(openWhere, previousFrom, currentFrom),
    count(referredWhere, currentFrom, now),
    count(referredWhere, previousFrom, currentFrom),
    count(noMediaWhere, currentFrom, now),
    count(noMediaWhere, previousFrom, currentFrom),
    prisma.accident.groupBy({ by: ['status'], _count: { _all: true } }),
    prisma.accident.findMany({ where: { createdAt: { gte: trendFrom } }, select: { createdAt: true } }),
  ])

  const statusBreakdown = Object.fromEntries(INCIDENT_STATUSES.map((status) => [status, 0])) as Record<
    IncidentStatus,
    number
  >
  for (const row of grouped) {
    if (isIncidentStatus(row.status)) statusBreakdown[row.status] = row._count._all
  }

  return {
    allTime,
    total: totalCurrent,
    pending: pendingCurrent,
    referred: referredCurrent,
    missingMedia: missingCurrent,
    totalDelta: delta(totalCurrent, totalPrevious),
    pendingDelta: delta(pendingCurrent, pendingPrevious),
    referredDelta: delta(referredCurrent, referredPrevious),
    missingMediaDelta: delta(missingCurrent, missingPrevious),
    statusBreakdown,
    trend: buildTrend(now, recent.map((r) => r.createdAt)),
  }
}

/* -------------------------------------------------------------------------- */
/* Vehicles                                                                   */
/* -------------------------------------------------------------------------- */

export const VEHICLE_PAGE_SIZE = 40

export type VehicleFilters = {
  q: string
  active: 'ALL' | 'ACTIVE' | 'INACTIVE'
  page: number
}

export type VehicleRow = {
  id: string
  plateNumber: string
  isActive: boolean
  createdAt: Date
  incidentCount: number
}

export type VehicleSummary = {
  total: number
  active: number
  inactive: number
}

function buildVehicleWhere(filters: VehicleFilters): Prisma.VehicleWhereInput {
  const and: Prisma.VehicleWhereInput[] = []
  if (filters.active !== 'ALL') and.push({ isActive: filters.active === 'ACTIVE' })
  const digits = normalizeDigits(filters.q.trim()).replace(/\D/g, '')
  if (digits) and.push({ plateNumber: { contains: digits } })
  return and.length > 0 ? { AND: and } : {}
}

export async function getVehicles(
  filters: VehicleFilters,
): Promise<{ rows: VehicleRow[]; matching: number; pageCount: number; page: number }> {
  const where = buildVehicleWhere(filters)
  const matching = await prisma.vehicle.count({ where })
  const pageCount = Math.max(1, Math.ceil(matching / VEHICLE_PAGE_SIZE))
  const page = Math.min(Math.max(1, filters.page), pageCount)
  const rows = await prisma.vehicle.findMany({
    where,
    orderBy: { plateNumber: 'asc' },
    skip: (page - 1) * VEHICLE_PAGE_SIZE,
    take: VEHICLE_PAGE_SIZE,
    select: {
      id: true,
      plateNumber: true,
      isActive: true,
      createdAt: true,
      _count: { select: { accidents: true } },
    },
  })
  return {
    rows: rows.map((row) => ({
      id: row.id,
      plateNumber: row.plateNumber,
      isActive: row.isActive,
      createdAt: row.createdAt,
      incidentCount: row._count.accidents,
    })),
    matching,
    pageCount,
    page,
  }
}

export async function getVehicleSummary(): Promise<VehicleSummary> {
  const [total, active] = await Promise.all([
    prisma.vehicle.count(),
    prisma.vehicle.count({ where: { isActive: true } }),
  ])
  return { total, active, inactive: total - active }
}

export async function setVehicleActive(id: string, isActive: boolean): Promise<boolean> {
  try {
    await prisma.vehicle.update({ where: { id }, data: { isActive } })
    return true
  } catch {
    return false
  }
}
