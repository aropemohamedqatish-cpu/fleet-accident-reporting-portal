'use client'

import { useRef, useState, type DragEvent } from 'react'
import { Camera, ImagePlus, Trash2, UploadCloud, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ALLOWED_MIME, MAX_FILES, MAX_FILE_SIZE, sniffImageMime } from '@/lib/validation'
import type { PhotoItem } from '@/lib/report-types'
import { StepShell } from './step-shell'
import { cn } from '@/lib/utils'

type Props = {
  photos: PhotoItem[]
  onAdd: (items: PhotoItem[]) => void
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
  const remaining = MAX_FILES - photos.length

  async function handleFiles(list: FileList | null) {
    if (!list || list.length === 0) return
    const files = Array.from(list)
    const nextErrors: string[] = []
    const accepted: PhotoItem[] = []

    if (files.length > remaining) {
      nextErrors.push(`يمكنك إضافة ${remaining} صور فقط (الحد الأقصى ${MAX_FILES} صور).`)
    }

    for (const file of files.slice(0, Math.max(remaining, 0))) {
      if (file.size > MAX_FILE_SIZE) {
        nextErrors.push(`"${file.name}" يتجاوز الحجم المسموح (10MB).`)
        continue
      }
      const mime = await sniffImageMime(file)
      if (!mime) {
        nextErrors.push(`"${file.name}" ليس صورة صالحة. الصيغ المسموحة: JPEG, PNG, WebP.`)
        continue
      }
      accepted.push({ id: crypto.randomUUID(), file, mime, previewUrl: URL.createObjectURL(file) })
    }

    setErrors(nextErrors)
    if (accepted.length) onAdd(accepted)
  }

  function onDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setDragging(false)
    void handleFiles(e.dataTransfer.files)
  }

  const accept = ALLOWED_MIME.join(',')

  return (
    <StepShell
      title="صور الحادث"
      description="التقط صوراً واضحة للأضرار ولوحات المركبات ومكان الحادث من زوايا مختلفة."
      onBack={onBack}
      onNext={onNext}
      nextDisabled={photos.length === 0}
    >
      <div
        onDragOver={(e) => {
          e.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={cn(
          'flex flex-col items-center gap-4 rounded-2xl border-2 border-dashed border-input bg-card p-6 text-center transition-colors',
          dragging && 'border-primary bg-secondary',
          remaining === 0 && 'opacity-60',
        )}
      >
        <div className="flex size-14 items-center justify-center rounded-full bg-secondary text-primary">
          <UploadCloud className="size-7" aria-hidden="true" />
        </div>
        <div>
          <p className="font-semibold">أضف صور الحادث</p>
          <p className="text-sm text-muted-foreground">{`JPEG, PNG, WebP • حتى 10MB للصورة • ${photos.length}/${MAX_FILES}`}</p>
        </div>
        <div className="grid w-full grid-cols-2 gap-3">
          <Button size="lg" className="h-12 gap-2" onClick={() => cameraRef.current?.click()} disabled={remaining === 0}>
            <Camera className="size-5" aria-hidden="true" />
            التقاط صورة
          </Button>
          <Button size="lg" variant="outline" className="h-12 gap-2" onClick={() => galleryRef.current?.click()} disabled={remaining === 0}>
            <ImagePlus className="size-5" aria-hidden="true" />
            من المعرض
          </Button>
        </div>
        <input
          ref={cameraRef}
          type="file"
          accept={accept}
          capture="environment"
          className="sr-only"
          tabIndex={-1}
          aria-hidden="true"
          onChange={(e) => {
            void handleFiles(e.target.files)
            e.target.value = ''
          }}
        />
        <input
          ref={galleryRef}
          type="file"
          accept={accept}
          multiple
          className="sr-only"
          tabIndex={-1}
          aria-hidden="true"
          onChange={(e) => {
            void handleFiles(e.target.files)
            e.target.value = ''
          }}
        />
      </div>

      {errors.length > 0 && (
        <div role="alert" className="flex flex-col gap-1 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm">
          {errors.map((err) => (
            <p key={err} className="flex items-start gap-2 text-destructive">
              <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              {err}
            </p>
          ))}
        </div>
      )}

      {photos.length > 0 && (
        <ul className="grid grid-cols-3 gap-3" aria-label="الصور المرفقة">
          {photos.map((p, i) => (
            <li key={p.id} className="group relative overflow-hidden rounded-xl border bg-muted">
              {/* eslint-disable-next-line @next/next/no-img-element -- local blob preview */}
              <img src={p.previewUrl} alt={`صورة الحادث ${i + 1}`} className="aspect-square w-full object-cover" />
              <div className="absolute inset-x-0 bottom-0 bg-foreground/70 px-1.5 py-0.5 text-[10px] text-background" dir="ltr">
                {formatSize(p.file.size)}
              </div>
              <Button
                size="icon"
                variant="destructive"
                className="absolute top-1.5 left-1.5 size-8 rounded-full shadow"
                onClick={() => onRemove(p.id)}
                aria-label={`حذف الصورة ${i + 1}`}
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
