'use client'

import { useRef, useState, type DragEvent } from 'react'
import { AlertCircle, Camera, ImagePlus, Trash2, UploadCloud } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ALLOWED_MIME, MAX_IMAGES, MAX_IMAGE_FILE_SIZE, MAX_IMAGE_SOURCE_SIZE, sniffImageMime } from '@/lib/validation'
import { compressIncidentImage } from '@/lib/compress-image'
import type { MediaItem } from '@/lib/report-types'
import { StepShell } from './step-shell'
import { cn } from '@/lib/utils'

type Props = {
  photos: MediaItem[]
  onAdd: (items: MediaItem[]) => void
  onRemove: (id: string) => void
  onBack: () => void
  onNext: () => void
}

function formatSize(bytes: number) {
  return bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.round(bytes / 1024)} KB`
}

export function StepMedia({ photos, onAdd, onRemove, onBack, onNext }: Props) {
  const cameraRef = useRef<HTMLInputElement>(null)
  const galleryRef = useRef<HTMLInputElement>(null)
  const [errors, setErrors] = useState<string[]>([])
  const [dragging, setDragging] = useState(false)
  const [compressing, setCompressing] = useState(false)
  const remainingPhotos = MAX_IMAGES - photos.length

  async function handleImages(files: File[], initialErrors: string[] = []) {
    const nextErrors = [...initialErrors]
    const accepted: MediaItem[] = []
    setCompressing(true)

    try {
      if (files.length > remainingPhotos) {
        nextErrors.push(`يمكنك إضافة ${remainingPhotos} صور أخرى فقط (الحد الأقصى ${MAX_IMAGES} صور).`)
      }

      for (const file of files.slice(0, Math.max(remainingPhotos, 0))) {
        if (file.size === 0 || file.size > MAX_IMAGE_SOURCE_SIZE) {
          nextErrors.push(`"${file.name}" يتجاوز الحجم الأصلي المسموح (30MB للصورة).`)
          continue
        }
        let mime: Awaited<ReturnType<typeof sniffImageMime>>
        try {
          mime = await sniffImageMime(file)
        } catch {
          nextErrors.push(`تعذّرت قراءة الصورة "${file.name}".`)
          continue
        }
        if (!mime) {
          nextErrors.push(`"${file.name}" ليس صورة صالحة. الصيغ المسموحة: JPEG, PNG, WebP.`)
          continue
        }

        try {
          const optimized = await compressIncidentImage(file)
          const optimizedMime = ALLOWED_MIME.find((allowedMime) => allowedMime === optimized.type) ?? mime
          if (!optimizedMime) {
            throw new Error('صيغة الصورة الناتجة غير مدعومة.')
          }
          accepted.push({
            id: crypto.randomUUID(),
            file: optimized,
            mime: optimizedMime,
            previewUrl: URL.createObjectURL(optimized),
          })
        } catch (error) {
          nextErrors.push(
            `"${file.name}": ${error instanceof Error ? error.message : 'تعذّر تجهيز الصورة للإرسال.'}`,
          )
        }
      }
    } finally {
      setCompressing(false)
    }

    setErrors(nextErrors)
    if (accepted.length) onAdd(accepted)
  }

  function onDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    setDragging(false)
    if (compressing) return
    const files = Array.from(event.dataTransfer.files)
    const images = files.filter((file) => file.type.startsWith('image/'))
    const errors = images.length !== files.length ? ['يُسمح بإرفاق الصور فقط.'] : []
    if (images.length) void handleImages(images, errors)
    else setErrors(errors.length ? errors : ['يُسمح بإرفاق الصور فقط.'])
  }

  const imageAccept = ALLOWED_MIME.join(',')

  return (
    <StepShell
      title="صور الحادث"
      description="تُضغط الصور على جهازك قبل الإرسال مع الحفاظ على وضوح التفاصيل (حتى 10 صور، وبحجم أصلي حتى 30MB للصورة)."
      onBack={onBack}
      onNext={onNext}
      nextDisabled={photos.length === 0 || compressing}
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
          <p className="font-semibold">{compressing ? 'جارٍ تجهيز الصور بجودة مناسبة...' : 'أضف صور الحادث'}</p>
          <p className="text-sm text-muted-foreground">
            {`${photos.length}/${MAX_IMAGES} صور • الحد الأصلي 30MB للصورة، وتُضغط قبل الرفع للحفاظ على وضوح التفاصيل`}
          </p>
        </div>
        <div className="grid w-full grid-cols-2 gap-3">
          <Button size="lg" className="h-12 gap-2" onClick={() => cameraRef.current?.click()} disabled={remainingPhotos === 0 || compressing}>
            <Camera className="size-5" aria-hidden="true" />
            التقاط صورة
          </Button>
          <Button size="lg" variant="outline" className="h-12 gap-2" onClick={() => galleryRef.current?.click()} disabled={remainingPhotos === 0 || compressing}>
            <ImagePlus className="size-5" aria-hidden="true" />
            صور من المعرض
          </Button>
        </div>
        <input
          ref={cameraRef}
          type="file"
          accept={imageAccept}
          capture="environment"
          disabled={compressing}
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
          disabled={compressing}
          className="sr-only"
          tabIndex={-1}
          aria-hidden="true"
          onChange={(event) => {
            void handleImages(event.target.files ? Array.from(event.target.files) : [])
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

      {photos.length > 0 && (
        <ul className="grid grid-cols-3 gap-3" aria-label="الوسائط المرفقة">
          {photos.map((item, index) => (
            <li key={item.id} className="group relative overflow-hidden rounded-xl border bg-muted">
              {/* eslint-disable-next-line @next/next/no-img-element -- local blob preview */}
              <img src={item.previewUrl} alt={`صورة الحادث ${index + 1}`} className="aspect-square w-full object-cover" />
              <span className="absolute top-2 right-2 rounded-full bg-white/95 px-2.5 py-1 text-xs font-semibold text-[#003366] shadow-sm">
                صورة {index + 1}
              </span>
              <div className="absolute inset-x-0 bottom-0 bg-foreground/70 px-1.5 py-0.5 text-[10px] text-background" dir="ltr">
                {formatSize(item.file.size)}
              </div>
              <Button
                size="icon"
                variant="destructive"
                className="absolute top-1.5 left-1.5 size-11 rounded-full shadow"
                onClick={() => onRemove(item.id)}
                aria-label={`حذف الصورة ${index + 1}`}
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
