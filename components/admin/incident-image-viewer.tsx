'use client'

import { useCallback, useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight, Expand, Images, X } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatFileSize, type IncidentMedia } from '@/lib/admin-claims'
import { cn } from '@/lib/utils'

export function IncidentImageViewer({ images }: { images: IncidentMedia[] }) {
  const total = images.length
  const [active, setActive] = useState(0)
  const [lightbox, setLightbox] = useState(false)
  const current = images[Math.min(active, Math.max(total - 1, 0))]

  const go = useCallback(
    (dir: 1 | -1) => setActive((i) => (i + dir + total) % total),
    [total],
  )

  useEffect(() => {
    if (!lightbox) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightbox(false)
      if (e.key === 'ArrowLeft') go(-1)
      if (e.key === 'ArrowRight') go(1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [lightbox, go])

  return (
    <Card className="overflow-hidden rounded-[20px] border border-slate-100 bg-white shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 px-6 py-4">
        <CardTitle className="flex items-center gap-2 text-base font-bold text-slate-950">
          <span className="flex size-9 items-center justify-center rounded-xl bg-[#003366]/10 text-[#003366]">
            <Images className="size-5" aria-hidden="true" />
          </span>
          صور الحادث
        </CardTitle>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600 tabular-nums">{total}</span>
      </CardHeader>
      <CardContent className="px-6 py-5">
        {total === 0 ? <EmptyState /> : <GalleryBody images={images} current={current} active={active} total={total} go={go} onZoom={() => setLightbox(true)} onSelect={setActive} />}
      </CardContent>
      {lightbox && current && <Lightbox current={current} active={active} total={total} go={go} onClose={() => setLightbox(false)} />}
    </Card>
  )
}

function GalleryBody({ images, current, active, total, go, onZoom, onSelect }: {
  images: IncidentMedia[]
  current: IncidentMedia
  active: number
  total: number
  go: (dir: 1 | -1) => void
  onZoom: () => void
  onSelect: (i: number) => void
}) {
  return (
    <>
      <div className="group relative overflow-hidden rounded-2xl bg-[#0b1120]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={current.fileUrl}
          alt={`صورة الحادث ${Math.min(active + 1, total)} من ${total}`}
          className="mx-auto max-h-[26rem] w-full cursor-zoom-in object-contain sm:max-h-[32rem]"
          onClick={onZoom}
        />
        {total > 1 && (
          <>
            <button type="button" aria-label="الصورة السابقة" onClick={() => go(-1)} className="absolute top-1/2 right-3 -translate-y-1/2 rounded-full bg-white/90 p-2.5 text-[#003366] shadow-md transition hover:bg-white sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100">
              <ChevronRight className="size-5" aria-hidden="true" />
            </button>
            <button type="button" aria-label="الصورة التالية" onClick={() => go(1)} className="absolute top-1/2 left-3 -translate-y-1/2 rounded-full bg-white/90 p-2.5 text-[#003366] shadow-md transition hover:bg-white sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100">
              <ChevronLeft className="size-5" aria-hidden="true" />
            </button>
          </>
        )}
        <button type="button" aria-label="عرض بملء الشاشة" onClick={onZoom} className="absolute bottom-3 left-3 rounded-full bg-black/60 p-2.5 text-white backdrop-blur transition hover:bg-black/80 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100">
          <Expand className="size-4" aria-hidden="true" />
        </button>
        <span className="absolute bottom-3 right-3 rounded-full bg-black/60 px-3 py-1 text-xs font-bold text-white tabular-nums backdrop-blur">
          {Math.min(active + 1, total)} / {total}
        </span>
      </div>
      <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
        <span dir="ltr" className="font-mono">{current.fileType}</span>
        <span>{formatFileSize(current.fileSize)}</span>
      </div>
      {total > 1 && (
        <div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-6 lg:grid-cols-8">
          {images.map((img, i) => (
            <button key={img.id} type="button" onClick={() => onSelect(i)} aria-label={`عرض الصورة ${i + 1}`} aria-current={i === active} className={cn('overflow-hidden rounded-xl border-2 transition', i === active ? 'border-[#003366] ring-2 ring-[#003366]/25' : 'border-transparent opacity-70 hover:border-slate-300 hover:opacity-100')}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.fileUrl} alt="" loading="lazy" className="h-16 w-full object-cover sm:h-20" />
            </button>
          ))}
        </div>
      )}
    </>
  )
}

function Lightbox({ current, active, total, go, onClose }: {
  current: IncidentMedia
  active: number
  total: number
  go: (dir: 1 | -1) => void
  onClose: () => void
}) {
  return (
    <div role="dialog" aria-modal="true" aria-label="عارض الصور بملء الشاشة" className="fixed inset-0 z-50 flex flex-col bg-black/95 p-4" onClick={onClose}>
      <div className="flex items-center justify-between text-white">
        <span className="font-mono text-sm tabular-nums">{Math.min(active + 1, total)} / {total}</span>
        <button type="button" aria-label="إغلاق العارض" onClick={onClose} className="rounded-full bg-white/10 p-2.5 transition hover:bg-white/20">
          <X className="size-5" aria-hidden="true" />
        </button>
      </div>
      <div className="flex min-h-0 flex-1 items-center justify-center gap-2" onClick={(e) => e.stopPropagation()}>
        {total > 1 && (
          <button type="button" aria-label="الصورة السابقة" onClick={() => go(-1)} className="shrink-0 rounded-full bg-white/10 p-3 text-white transition hover:bg-white/20">
            <ChevronRight className="size-5" aria-hidden="true" />
          </button>
        )}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={current.fileUrl} alt={`صورة الحادث ${Math.min(active + 1, total)}`} className="max-h-full max-w-full rounded-lg object-contain" />
        {total > 1 && (
          <button type="button" aria-label="الصورة التالية" onClick={() => go(1)} className="shrink-0 rounded-full bg-white/10 p-3 text-white transition hover:bg-white/20">
            <ChevronLeft className="size-5" aria-hidden="true" />
          </button>
        )}
      </div>
    </div>
  )
}


function EmptyState() {
  return (
    <p className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
      لا توجد صور مرفقة لهذا البلاغ.
    </p>
  )
}
