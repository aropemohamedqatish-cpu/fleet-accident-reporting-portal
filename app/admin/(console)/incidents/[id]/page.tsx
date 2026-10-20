import { notFound } from 'next/navigation'
import { IncidentHero } from '@/components/admin/incident-hero'
import { IncidentDriverCard } from '@/components/admin/incident-driver-card'
import { IncidentLocationCard } from '@/components/admin/incident-location-card'
import { IncidentRecordCard } from '@/components/admin/incident-record-card'
import { IncidentImageViewer } from '@/components/admin/incident-image-viewer'
import { IncidentActionsPanel } from '@/components/admin/incident-actions-panel'
import { getIncidentDetail } from '@/lib/admin-queries'
import { prisma } from '@/lib/prisma'
import { TrackingTimeline } from '@/components/admin/tracking-timeline'

type AuditTimelineRow = {
  id: string
  actionType: string
  details: string
  createdAt: Date
  userName: string
}

export default async function IncidentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const incident = await getIncidentDetail(id)
  if (!incident) notFound()
  let auditEntries = null
  try {
    const rows = await prisma.$queryRaw<AuditTimelineRow[]>`
      SELECT log."id", log."actionType", log."details", log."createdAt",
             admin."name" AS "userName"
      FROM "AuditLog" AS log
      INNER JOIN "AdminUser" AS admin ON admin."id" = log."userId"
      WHERE log."accidentId" = ${id}
      ORDER BY log."createdAt" DESC
    `
    auditEntries = rows.map(({ userName, ...entry }) => ({
      ...entry,
      user: { name: userName },
    }))
  } catch (error) {
    console.error('Incident audit timeline could not be loaded.', error)
  }

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-6 pb-16" dir="rtl">
      <IncidentHero incident={incident} />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_24rem]">
        {/* ── Main column ────────────────────────────────── */}
        <div className="min-w-0 space-y-6">
          <IncidentDriverCard incident={incident} />
          <IncidentLocationCard incident={incident} />
          <IncidentImageViewer images={incident.media} />
          <IncidentRecordCard incident={incident} />
          <TrackingTimeline
            entries={auditEntries ?? []}
            loadError={auditEntries === null ? 'تعذّر تحميل سجل الإجراءات. لا تزال تفاصيل البلاغ متاحة، يرجى المحاولة لاحقاً.' : undefined}
          />
        </div>

        {/* ── Actions sidebar ────────────────────────────── */}
        <aside className="min-w-0">
          <IncidentActionsPanel incident={incident} />
        </aside>
      </div>
    </div>
  )
}
