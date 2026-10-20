'use client'

import { createContext, useContext, useState, type ReactNode } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { IncidentHero } from './incident-hero'
import { IncidentDriverCard } from './incident-driver-card'
import { IncidentLocationCard } from './incident-location-card'
import { IncidentImageViewer } from './incident-image-viewer'
import { IncidentVideoViewer } from './incident-video-viewer'
import { IncidentRecordCard } from './incident-record-card'
import { IncidentActionsPanel } from './incident-actions-panel'
import type { IncidentDetail } from '@/lib/admin-claims'

type IncidentDrawerContextValue = {
  selected: IncidentDetail | null
  setSelected: (incident: IncidentDetail | null) => void
  close: () => void
}

const IncidentDrawerContext = createContext<IncidentDrawerContextValue | null>(null)

export function useIncidentDrawer() {
  const ctx = useContext(IncidentDrawerContext)
  if (!ctx) throw new Error('useIncidentDrawer must be used within an IncidentDrawerProvider')
  return ctx
}

export function IncidentDrawerProvider({ children }: { children: ReactNode }) {
  const [selected, setSelected] = useState<IncidentDetail | null>(null)

  const close = () => setSelected(null)

  return (
    <IncidentDrawerContext.Provider value={{ selected, setSelected, close }}>
      {children}
      <IncidentDrawer incident={selected} onClose={close} />
    </IncidentDrawerContext.Provider>
  )
}

export function IncidentDrawer({ incident, onClose }: { incident: IncidentDetail | null; onClose: () => void }) {
  if (!incident) return null

  const images = incident.media.filter((m) => m.mediaType === 'IMAGE')
  const videos = incident.media.filter((m) => m.mediaType === 'VIDEO')

  return (
    <Sheet>
      <SheetContent side="right" className="sm:max-w-2xl p-0">
        <SheetHeader className="pb-4 border-b">
          <SheetTitle>تفاصيل البلاغ</SheetTitle>
          <SheetDescription>
            لوحة الرقم <span className="font-mono font-semibold">{incident.plateNumber}</span> — الحالة{' '}
            {incident.status}
          </SheetDescription>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto p-6 space-y-6 dir-rtl">
          <IncidentHero incident={incident} />
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_1fr]">
            <div className="space-y-6">
              <IncidentDriverCard incident={incident} />
              <IncidentLocationCard incident={incident} />
              <IncidentImageViewer images={images} />
              <IncidentVideoViewer videos={videos} />
              <IncidentRecordCard incident={incident} />
            </div>
            <aside className="space-y-6">
              <IncidentActionsPanel incident={incident} />
            </aside>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}