import { prisma } from '@/lib/prisma'
import { normalizeDigits } from '@/lib/fleet-data'
import {
  vehicleClassOf,
  type AdminFilters,
  type DashboardStats,
  type IncidentDetail,
  type IncidentRow,
} from './admin-claims'

const PAGE_SIZE = 50

function buildWhere(filters: AdminFilters) {
  const normalizedSearch = normalizeDigits(filters.search.trim()).replace(/[\s-]/g, '')
  const where: Record<string, unknown> = {}

  if (filters.status !== 'ALL') {
    where.status = filters.status
  }
  const and: Record<string, unknown>[] = []

  if (filters.prefix !== 'ALL') {
    and.push({ vehicle: { plateNumber: { startsWith: filters.prefix } } })
  }
  if (filters.from || filters.to) {
    const createdAt: { gte?: Date; lte?: Date } = {}
    if (filters.from) {
      const gte = new Date(`${filters.from}T00:00:00`)
      if (!Number.isNaN(gte.getTime())) createdAt.gte = gte
    }
    if (filters.to) {
      const lte = new Date(`${filters.to}T23:59:59.999`)
      if (!Number.isNaN(lte.getTime())) createdAt.lte = lte
    }
    if (createdAt.gte || createdAt.lte) {
      and.push({ createdAt })
    }
  }
  if (filters.search.trim()) {
    const raw = filters.search.trim()
    and.push({
      OR: [
        { reporterName: { contains: raw, mode: 'insensitive' as const } },
        { reporterPhone: { contains: normalizedSearch } },
        { vehicle: { plateNumber: { contains: normalizedSearch } } },
      ],
    })
  }
  if (and.length > 0) where.AND = and
  return where
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const now = new Date()
  const currentFrom = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  const previousFrom = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000)

  async function count(
    extra: Record<string, unknown>,
    gte: Date,
    lte: Date,
  ): Promise<number> {
    return prisma.accident.count({
      where: { ...extra, createdAt: { gte, lte } },
    })
  }

  const openWhere = { status: { in: ['SUBMITTED', 'UNDER_REVIEW'] } }
  const referredWhere = { status: { in: ['SENT_TO_INSURER', 'CLOSED'] } }
  const noMediaWhere = { media: { none: {} } }

  const [
    totalCurrent,
    totalPrevious,
    pendingCurrent,
    pendingPrevious,
    referredCurrent,
    referredPrevious,
    failedCurrent,
    failedPrevious,
  ] = await Promise.all([
    count({}, currentFrom, now),
    count({}, previousFrom, currentFrom),
    count(openWhere, currentFrom, now),
    count(openWhere, previousFrom, currentFrom),
    count(referredWhere, currentFrom, now),
    count(referredWhere, previousFrom, currentFrom),
    count(noMediaWhere, currentFrom, now),
    count(noMediaWhere, previousFrom, currentFrom),
  ])

  return {
    total: totalCurrent,
    pending: pendingCurrent,
    referred: referredCurrent,
    failedNotifications: failedCurrent,
    totalDelta: delta(totalCurrent, totalPrevious),
    pendingDelta: delta(pendingCurrent, pendingPrevious),
    referredDelta: delta(referredCurrent, referredPrevious),
    failedDelta: delta(failedCurrent, failedPrevious),
  }
}

type Delta = {
  value: number
  direction: 'up' | 'down' | 'neutral'
}

function delta(current: number, previous: number): Delta {
  if (previous === 0) {
    return current === 0 ? { value: 0, direction: 'neutral' } : { value: current, direction: 'up' }
  }
  const change = ((current - previous) / previous) * 100
  const magnitude = Math.round(Math.abs(change))
  if (magnitude < 1) return { value: 0, direction: 'neutral' }
  return { value: magnitude, direction: change > 0 ? 'up' : 'down' }
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
    vehicleClass: vehicleClassOf(row.vehicle.plateNumber),
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
    vehicleClass: vehicleClassOf(row.vehicle.plateNumber),
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
  const allowed = ['SUBMITTED', 'UNDER_REVIEW', 'SENT_TO_INSURER', 'CLOSED']
  if (!allowed.includes(status)) return false
  try {
    await prisma.accident.update({ where: { id }, data: { status } })
    return true
  } catch {
    return false
  }
}
