'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, Maximize, Minimize, Pause, Play, Volume2, VolumeX } from 'lucide-react'
import { formatFileSize, type IncidentMedia } from '@/lib/admin-claims'

type PlaybackState = 'idle' | 'playing' | 'paused' | 'ended'

export function ImageCarousel({ images }: { images: IncidentMedia[] }) {
  const [active, setActive] = useState(0)
  if (images.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6 text-center">
        <p className="text-sm text-slate-600">لا توجد صور مرفقة لهذا البلاغ.</p>
      </div>
    )
  }
  const current = images[Math.min(active, images.length - 1)]
  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="relative overflow-hidden rounded-xl bg-[#0b1120] aspect-video">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={current.fileUrl} alt={`صورة الحادث ${active + 1}`} className="mx-auto max-h-72 w-full object-contain" />
        {images.length > 1 && (
          <>
            <button
              type="button"
              aria-label="الصورة السابقة"
              onClick={() => setActive((i) => (i - 1 + images.length) % images.length)}
              className="absolute right-3 top-1/2 -translate-y-1/2 size-9 rounded-full bg-white/90 p-2 text-[#003366] shadow-md hover:bg-white transition"
            >
              <ChevronRight className="size-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              aria-label="الصورة التالية"
              onClick={() => setActive((i) => (i + 1) % images.length)}
              className="absolute left-3 top-1/2 -translate-y-1/2 size-9 rounded-full bg-white/90 p-2 text-[#003366] shadow-md hover:bg-white transition"
            >
              <ChevronLeft className="size-4" aria-hidden="true" />
            </button>
          </>
        )}
      </div>
      <div className="mt-2 flex items-center justify-between px-4 py-2 text-xs text-slate-600 border-t border-slate-100 bg-white">
        <span>الصورة {Math.min(active + 1, images.length)} من {images.length}</span>
        <span>{formatFileSize(current.fileSize)}</span>
      </div>
      {images.length > 1 && (
        <div className="mt-2 grid grid-cols-5 gap-2 px-4 pb-3">
          {images.map((img, i) => (
            <button
              key={img.id}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`عرض الصورة ${i + 1}`}
              className={`overflow-hidden rounded-lg border border-slate-200 ring-2 ${i === active ? 'ring-[#003366]' : 'ring-transparent hover:ring-slate-300'}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.fileUrl} alt="" className="h-14 w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export function VideoPlayer({ src, fileSize }: { src: string; fileSize: number }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const progressRef = useRef<HTMLInputElement>(null)
  const [playback, setPlayback] = useState<PlaybackState>('idle')
  const [duration, setDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [volume, setVolume] = useState(1)
  const [muted, setMuted] = useState(false)
  const [showControls, setShowControls] = useState(false)
  const [seeking, setSeeking] = useState(false)
  const [fullscreen, setFullscreen] = useState(false)
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const togglePlay = useCallback(() => {
    const video = videoRef.current
    if (!video) return
    if (video.paused || playback === 'ended') {
      video.play().then(() => setPlayback('playing')).catch(() => setPlayback('paused'))
    } else {
      video.pause()
      setPlayback('paused')
    }
  }, [playback])

  const toggleMute = useCallback(() => {
    const video = videoRef.current
    if (!video) return
    const next = !muted
    setMuted(next)
    video.muted = next
  }, [muted])

  const setVolumeLevel = useCallback(
    (value: number) => {
      const video = videoRef.current
      if (!video) return
      setMuted(value === 0)
      video.muted = value === 0
      video.volume = value
      setVolume(value)
    },
    [],
  )

  const requestFullscreen = useCallback(() => {
    const el = containerRef.current
    if (!el) return
    if (!document.fullscreenElement) {
      el.requestFullscreen().catch(() => undefined)
    } else {
      document.exitFullscreen().catch(() => undefined)
    }
  }, [])

  useEffect(() => {
    const onFsChange = () => setFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', onFsChange)
    return () => document.removeEventListener('fullscreenchange', onFsChange)
  }, [])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    video.volume = muted ? 0 : volume
  }, [volume, muted])

  const formatTime = useCallback((seconds: number) => {
    if (!Number.isFinite(seconds)) return '0:00'
    const m = Math.floor(seconds / 60)
    const s = Math.floor(seconds % 60)
    return `${m}:${s.toString().padStart(2, '0')}`
  }, [])

  const startHideTimer = useCallback(() => {
    if (hideTimer.current) clearTimeout(hideTimer.current)
    if (playback === 'playing') {
      hideTimer.current = setTimeout(() => setShowControls(false), 2500)
    }
  }, [playback])

  const handleMouseEnter = useCallback(() => {
    setShowControls(true)
    startHideTimer()
  }, [startHideTimer])
  const handleMouseLeave = useCallback(() => {
    if (playback === 'playing') startHideTimer()
  }, [startHideTimer])

  return (
      <div
        ref={containerRef}
        className="relative w-full overflow-hidden rounded-[20px] border border-slate-100 bg-white shadow-sm"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div className="relative w-full aspect-video bg-[#0b1120]">
          <video
            ref={videoRef}
            src={src}
            playsInline
            preload="metadata"
            className="w-full h-full block"
            onLoadedData={(e) => setDuration(e.currentTarget.duration)}
            onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
            onPlay={() => { setPlayback('playing'); startHideTimer() }}
            onPause={() => { setPlayback('paused'); setShowControls(true) }}
            onEnded={() => setPlayback('ended')}
            onClick={togglePlay}
          />
          {(playback === 'idle' || playback === 'paused') && (
            <div className="absolute inset-0 flex items-center justify-center bg-[#0b1120]/70">
              <button
                type="button"
                onClick={togglePlay}
                aria-label="تشغيل الفيديو"
                className="size-16 rounded-full bg-white/95 flex items-center justify-center text-[#003366] shadow-lg hover:bg-white transition"
              >
                <Play className="size-7 ml-0.5" aria-hidden="true" />
              </button>
            </div>
          )}
          <div className="absolute bottom-3 left-3 z-20 inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-black/60 px-2.5 py-1.5 text-[10px] font-semibold text-white backdrop-blur">
            <span dir="ltr" className="flex size-5 items-center justify-center rounded bg-[#003366] text-[10px] font-bold text-white">MP4</span>
            <span>{formatFileSize(fileSize)}</span>
          </div>
        </div>

        {showControls && (
          <div className="relative -mt-1 flex items-center gap-2.5 px-5 py-3.5 border-t border-slate-100 bg-white">
            <button
              type="button"
              onClick={togglePlay}
              aria-label={playback === 'playing' ? 'إيقاف مؤقت' : 'تشغيل'}
              className="shrink-0 size-10 rounded-lg flex items-center justify-center text-[#003366] hover:bg-[#003366]/10 transition"
            >
              {playback === 'playing' ? <Pause size={4} /> : <Play size={4} />}
            </button>
            <div className="flex-1">
              <div className="flex items-center justify-between text-[10px] text-slate-500 mb-1">
                <span dir="ltr" className="font-mono">{formatTime(currentTime)}</span>
                <span dir="ltr" className="font-mono">{formatTime(duration)}</span>
              </div>
              <input
                ref={progressRef}
                type="range"
                min="0"
                max={duration || 1}
                value={seeking ? currentTime : 0}
                onChange={(e) => {
                  setSeeking(true)
                  setCurrentTime(Number((e.target as HTMLInputElement).value))
                }}
                onInput={(e) => setCurrentTime(Number((e.target as HTMLInputElement).value))}
                onBlur={() => {
                  const video = videoRef.current
                  if (video) video.currentTime = Number(progressRef.current?.value ?? 0)
                  setSeeking(false)
                }}
                className="w-full h-1.5 bg-slate-200 rounded-full appearance-none cursor-pointer accent-[#003366]"
              />
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <button
                type="button"
                onClick={toggleMute}
                aria-label={muted ? 'تشغيل الصوت' : 'إيقاف الصوت'}
                className="size-9 rounded-lg flex items-center justify-center text-[#003366] hover:bg-[#003366]/10 transition"
              >
                {muted ? <VolumeX size={4} /> : <Volume2 size={4} />}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={volume}
                onChange={(e) => setVolumeLevel(Number((e.target as HTMLInputElement).value))}
                className="w-20 h-1.5 bg-slate-200 rounded-full appearance-none cursor-pointer accent-[#003366]"
              />
              <button
                type="button"
                onClick={requestFullscreen}
                aria-label={fullscreen ? 'تصغير الشاشة' : 'تكبير الشاشة'}
                className="size-9 rounded-lg flex items-center justify-center text-[#003366] hover:bg-[#003366]/10 transition"
              >
                {fullscreen ? <Minimize size={4} /> : <Maximize size={4} />}
              </button>
            </div>
          </div>
        )}
      </div>
    )
  }

export function VideoGallery({ videos }: { videos: IncidentMedia[] }) {
  if (videos.length === 0) {
    return <p className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 py-6 text-center text-sm text-slate-500">لا يوجد فيديو مرفق لهذا البلاغ.</p>
  }
  return (
    <div className="space-y-3">
      {videos.map((v) => (
        <figure key={v.id} className="overflow-hidden rounded-xl bg-slate-950">
          <video src={v.fileUrl} controls preload="metadata" playsInline className="max-h-72 w-full bg-black">
            متصفحك لا يدعم تشغيل الفيديو.
          </video>
          <figcaption className="flex items-center justify-between px-3 py-2 text-xs text-slate-300">
            <span dir="ltr" className="font-mono">{v.fileType}</span>
            <span>{formatFileSize(v.fileSize)}</span>
          </figcaption>
        </figure>
      ))}
    </div>
  )
}
