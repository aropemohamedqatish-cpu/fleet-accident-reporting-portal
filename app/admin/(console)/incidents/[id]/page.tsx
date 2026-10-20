import { notFound } from 'next/navigation'
import { IncidentHero } from '@/components/admin/incident-hero'
import { IncidentDriverCard } from '@/components/admin/incident-driver-card'
import { IncidentLocationCard } from '@/components/admin/incident-location-card'
import { IncidentRecordCard } from '@/components/admin/incident-record-card'
import { IncidentImageViewer } from '@/components/admin/incident-image-viewer'
import { IncidentVideoViewer } from '@/components/admin/incident-video-viewer'
import { IncidentActionsPanel } from '@/components/admin/incident-actions-panel'
import { getIncidentDetail } from '@/lib/admin-queries'

export default async function IncidentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const incident = await getIncidentDetail(id)
  if (!incident) notFound()

  const images = incident.media.filter((m) => m.mediaType === 'IMAGE')
  const videos = incident.media.filter((m) => m.mediaType === 'VIDEO')

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-6 pb-16" dir="rtl">
      <IncidentHero incident={incident} />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_24rem]">
        {/* ── Main column ────────────────────────────────── */}
        <div className="min-w-0 space-y-6">
          <IncidentDriverCard incident={incident} />
          <IncidentLocationCard incident={incident} />
          <IncidentImageViewer images={images} />
          <IncidentVideoViewer videos={videos} />
          <IncidentRecordCard incident={incident} />
        </div>

        {/* ── Actions sidebar ────────────────────────────── */}
        <aside className="min-w-0">
          <IncidentActionsPanel incident={incident} />
        </aside>
      </div>
    </div>
  )
}
