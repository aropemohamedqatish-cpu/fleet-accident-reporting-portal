'use client'

import { useState } from 'react'
import { TriangleAlert, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { StatusBadge } from './status-badge'
import { ImageCarousel, VideoGallery } from './media-gallery'
import { StatusUpdater } from './status-updater'
import { ArchiveExportButton } from './archive-export-button'
import { DrawerDriverInfo } from './drawer-driver-info'
import { DrawerLocation } from './drawer-location'
import { shortRef, type IncidentDetail } from '@/lib/admin-claims'

export function IncidentDrawer({ incident, onClose }: { incident: IncidentDetail | null; onClose: () => void }) {
  return (
    <Sheet open={incident !== null} onOpenChange={(v) => { if (!v) onClose() }}>
      <SheetContent side="left" showCloseButton={false} className="flex w-full flex-col gap-0 overflow-hidden bg-white p-0 sm:max-w-xl">
        {incident && <DrawerBody key={incident.id} incident={incident} onClose={onClose} />}
      </SheetContent>
    </Sheet>
  )
}

function DrawerBody({ incident, onClose }: { incident: IncidentDetail; onClose: () => void }) {
  const images = incident.media.filter((m) => m.mediaType === 'IMAGE')
  const videos = incident.media.filter((m) => m.mediaType === 'VIDEO')
  return (
    <>
      <SheetHeader className="border-b border-slate-100 bg-[#003366] px-5 py-4 text-right text-white">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs text-blue-200">المرجع: <span dir="ltr" className="font-mono font-semibold">{shortRef(incident.id)}</span></p>
            <SheetTitle className="mt-1 text-lg font-bold text-white">بلاغ اللوحة <span dir="ltr" className="font-mono">{incident.plateNumber}</span></SheetTitle>
            <div className="mt-2"><StatusBadge status={incident.status} /></div>
          </div>
          <Button type="button" variant="ghost" size="icon" onClick={onClose} aria-label="إغلاق التفاصيل" className="text-white hover:bg-white/10 hover:text-white">
            <X className="size-5" aria-hidden="true" />
          </Button>
        </div>
      </SheetHeader>
      <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5" dir="rtl">
        <DrawerDriverInfo incident={incident} />
        <DrawerLocation incident={incident} />
        <section aria-label="معرض الصور" className="rounded-xl border border-slate-200 p-4">
          <h3 className="mb-3 text-sm font-bold text-slate-900">صور الحادث ({images.length})</h3>
          <ImageCarousel images={images} />
        </section>
        <section aria-label="فيديو الحادث" className="rounded-xl border border-slate-200 p-4">
          <h3 className="mb-3 text-sm font-bold text-slate-900">فيديو الحادث ({videos.length})</h3>
          <VideoGallery videos={videos} />
        </section>
        <StatusUpdater id={incident.id} current={incident.status} />
        {incident.mediaCount === 0 && (
          <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
            <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            تنبيه: هذا البلاغ بدون أي مرفقات — تحقق من سلامة الإرسال قبل الإحالة.
          </div>
        )}
      </div>
      <ArchiveExportButton id={incident.id} plate={incident.plateNumber} />
    </>
  )
}

export function useIncidentDrawer() {
  const [selected, setSelected] = useState<IncidentDetail | null>(null)
  return { selected, setSelected, close: () => setSelected(null) }
}
