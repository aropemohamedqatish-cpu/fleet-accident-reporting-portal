'use client'

import { useRef, useState, type DragEvent } from 'react'
import { AlertCircle, Camera, ImagePlus, Trash2, UploadCloud, Video } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  ALLOWED_MIME,
  ALLOWED_VIDEO_MIME,
  MAX_IMAGES,
  MAX_IMAGE_FILE_SIZE,
  MAX_VIDEO_FILE_SIZE,
  sniffImageMime,
  sniffVideoMime,
} from '@/lib/validation'
import type { MediaItem } from '@/lib/report-types'
import { StepShell } from './step-shell'
import { cn } from '@/lib/utils'

type Props = {
  photos: MediaItem[]
  videos: MediaItem[]
  onAdd: (items: MediaItem[]) => void
  onRemove: (id: string) => void
  onBack: () => void
  onNext: () => void
}

function formatSize(bytes: number) {
  return bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.round(bytes / 1024)} KB`
}

export function StepMedia({ photos, videos, onAdd, onRemove, onBack, onNext }: Props) {
  const cameraRef = useRef<HTMLInputElement>(null)
  const galleryRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLInputElement>(null)
  const [errors, setErrors] = useState<string[]>([])
  const [dragging, setDragging] = useState(false)
  const remainingPhotos = MAX_IMAGES - photos.length

  async function handleImages(files: File[]) {
    const nextErrors: string[] = []
    const accepted: MediaItem[] = []

    if (files.length > remainingPhotos) {
      nextErrors.push(`يمكنك إضافة ${remainingPhotos} صور أخرى فقط (الحد الأقصى ${MAX_IMAGES} صور).`)
    }

    for (const file of files.slice(0, Math.max(remainingPhotos, 0))) {
      if (file.size === 0 || file.size > MAX_IMAGE_FILE_SIZE) {
        nextErrors.push(`"${file.name}" يتجاوز الحجم المسموح (10MB للصورة).`)
        continue
      }
      const mime = await sniffImageMime(file)
      if (!mime) {
        nextErrors.push(`"${file.name}" ليس صورة صالحة. الصيغ المسموحة: JPEG, PNG, WebP.`)
        continue
      }
      accepted.push({ id: crypto.randomUUID(), file, mime, kind: 'image', previewUrl: URL.createObjectURL(file) })
    }

    setErrors(nextErrors)
    if (accepted.length) onAdd(accepted)
  }

  async function handleVideo(file: File | undefined) {
    if (!file) return
    if (videos.length > 0) {
      setErrors(['يمكنك إرفاق مقطع فيديو واحد فقط لكل بلاغ.'])
      return
    }
    if (file.size === 0 || file.size > MAX_VIDEO_FILE_SIZE) {
      setErrors(['يجب ألا يتجاوز حجم مقطع الفيديو 50MB.'])
      return
    }
    const mime = await sniffVideoMime(file)
    if (!mime || !ALLOWED_VIDEO_MIME.includes(mime)) {
      setErrors(['صيغة الفيديو غير صالحة. الصيغ المسموحة: MP4, MOV, WebM.'])
      return
    }
    setErrors([])
    onAdd([{ id: crypto.randomUUID(), file, mime, kind: 'video', previewUrl: URL.createObjectURL(file) }])
  }

  function onDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    setDragging(false)
    const files = Array.from(event.dataTransfer.files)
    const images = files.filter((file) => file.type.startsWith('image/'))
    const video = files.find((file) => file.type.startsWith('video/'))
    if (images.length) void handleImages(images)
    if (video) void handleVideo(video)
    if (images.length === 0 && !video) {
      setErrors(['الملفات المرفقة غير مدعومة. أضف صوراً أو مقطع فيديو واحداً.'])
    }
    if (files.filter((file) => file.type.startsWith('video/')).length > 1) {
      setErrors(['يمكنك إرفاق مقطع فيديو واحد فقط لكل بلاغ.'])
    }
  }

  const imageAccept = ALLOWED_MIME.join(',')
  const videoAccept = ALLOWED_VIDEO_MIME.join(',')
  const allMedia = [...photos, ...videos]

  return (
    <StepShell
      title="صور وفيديو الحادث"
      description="أرفق صوراً واضحة للأضرار، ويمكنك إضافة مقطع فيديو واحد لتوثيق الحادث."
      onBack={onBack}
      onNext={onNext}
      nextDisabled={allMedia.length === 0}
    >
      <div
        onDragOver={(event) => {
          event.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={cn(
          'flex flex-col items-center gap-4 rounded-2xl border-2 border-dashed border-input bg-card p-6 text-center transition-colors',
          dragging && 'border-primary bg-secondary',
        )}
      >
        <div className="flex size-14 items-center justify-center rounded-full bg-secondary text-primary">
          <UploadCloud className="size-7" aria-hidden="true" />
        </div>
        <div>
          <p className="font-semibold">أضف وسائط الحادث</p>
         <p className="text-sm text-muted-foreground">
  {`حتى ${MAX_IMAGES} صور (10MB للصورة) • ${photos.length}/${MAX_IMAGES} صور`}
</p>

        </div>
        <div className="grid w-full grid-cols-2 gap-3">
          <Button size="lg" className="h-12 gap-2" onClick={() => cameraRef.current?.click()} disabled={remainingPhotos === 0}>
            <Camera className="size-5" aria-hidden="true" />
            التقاط صورة
          </Button>
          <Button size="lg" variant="outline" className="h-12 gap-2" onClick={() => galleryRef.current?.click()} disabled={remainingPhotos === 0}>
            <ImagePlus className="size-5" aria-hidden="true" />
            صور من المعرض
          </Button>
        </div>
        {/* <Button
          size="lg"
          variant="outline"
          className="h-12 w-full gap-2"
          onClick={() => videoRef.current?.click()}
          disabled={videos.length > 0}
        >
          <Video className="size-5" aria-hidden="true" />
          {videos.length > 0 ? 'تم إرفاق فيديو' : 'إرفاق فيديو (اختياري)'}
        </Button> */}
        <input
          ref={cameraRef}
          type="file"
          accept={imageAccept}
          capture="environment"
          className="sr-only"
          tabIndex={-1}
          aria-hidden="true"
          onChange={(event) => {
            void handleImages(event.target.files ? Array.from(event.target.files) : [])
            event.target.value = ''
          }}
        />
        <input
          ref={galleryRef}
          type="file"
          accept={imageAccept}
          multiple
          className="sr-only"
          tabIndex={-1}
          aria-hidden="true"
          onChange={(event) => {
            void handleImages(event.target.files ? Array.from(event.target.files) : [])
            event.target.value = ''
          }}
        />
        <input
          ref={videoRef}
          type="file"
          accept={videoAccept}
          className="sr-only"
          tabIndex={-1}
          aria-hidden="true"
          onChange={(event) => {
            void handleVideo(event.target.files?.[0])
            event.target.value = ''
          }}
        />
      </div>

      {errors.length > 0 && (
        <div role="alert" className="flex flex-col gap-1 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm">
          {errors.map((error) => (
            <p key={error} className="flex items-start gap-2 text-destructive">
              <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              {error}
            </p>
          ))}
        </div>
      )}

      {allMedia.length > 0 && (
        <ul className="grid grid-cols-3 gap-3" aria-label="الوسائط المرفقة">
          {allMedia.map((item, index) => (
            <li key={item.id} className="group relative overflow-hidden rounded-xl border bg-muted">
              {item.kind === 'image' ? (
                // eslint-disable-next-line @next/next/no-img-element -- local blob preview
                <img src={item.previewUrl} alt={`صورة الحادث ${index + 1}`} className="aspect-square w-full object-cover" />
              ) : (
                <video src={item.previewUrl} controls className="aspect-square w-full object-cover" aria-label="معاينة فيديو الحادث" />
              )}
              <span
                className={cn(
                  'absolute top-2 right-2 rounded-full px-2.5 py-1 text-xs font-semibold shadow-sm',
                  item.kind === 'video' ? 'bg-amber-100 text-amber-950' : 'bg-white/95 text-[#003366]',
                )}
              >
                {item.kind === 'video' ? 'فيديو' : `صورة ${index + 1}`}
              </span>
              <div className="absolute inset-x-0 bottom-0 bg-foreground/70 px-1.5 py-0.5 text-[10px] text-background" dir="ltr">
                {`${item.kind === 'video' ? 'VIDEO • ' : ''}${formatSize(item.file.size)}`}
              </div>
              <Button
                size="icon"
                variant="destructive"
                className="absolute top-1.5 left-1.5 size-11 rounded-full shadow"
                onClick={() => onRemove(item.id)}
                aria-label={`حذف ${item.kind === 'video' ? 'الفيديو' : `الصورة ${index + 1}`}`}
              >
                <Trash2 className="size-4" aria-hidden="true" />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </StepShell>
  )
}
