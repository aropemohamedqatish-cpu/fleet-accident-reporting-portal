import { MAX_IMAGE_FILE_SIZE, type AllowedMime } from './validation'

const MAX_IMAGE_EDGE = 2560
const WEBP_QUALITIES = [0.88, 0.84, 0.8, 0.76, 0.72]
const MIME_EXTENSIONS: Record<AllowedMime, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
}

type DecodedImage = {
  source: CanvasImageSource
  width: number
  height: number
  dispose: () => void
}

async function decodeImage(file: File): Promise<DecodedImage> {
  if (typeof createImageBitmap === 'function') {
    try {
      const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
      return {
        source: bitmap,
        width: bitmap.width,
        height: bitmap.height,
        dispose: () => bitmap.close(),
      }
    } catch {
      // Fall through to the HTML image decoder for browsers with partial bitmap support.
    }
  }

  const url = URL.createObjectURL(file)
  try {
    const image = new Image()
    image.src = url
    await image.decode()
    return {
      source: image,
      width: image.naturalWidth,
      height: image.naturalHeight,
      dispose: () => URL.revokeObjectURL(url),
    }
  } catch (error) {
    URL.revokeObjectURL(url)
    throw error
  }
}

function canvasToBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('تعذّر تجهيز الصورة للإرسال على هذا الجهاز.'))
          return
        }
        resolve(blob)
      },
      'image/webp',
      quality,
    )
  })
}

function isAllowedMime(mime: string): mime is AllowedMime {
  return mime === 'image/jpeg' || mime === 'image/png' || mime === 'image/webp'
}

/** Resizes large photos and encodes them as high-quality WebP when supported. */
export async function compressIncidentImage(file: File): Promise<File> {
  const image = await decodeImage(file)
  try {
    const scale = Math.min(1, MAX_IMAGE_EDGE / Math.max(image.width, image.height))
    const width = Math.max(1, Math.round(image.width * scale))
    const height = Math.max(1, Math.round(image.height * scale))
    const resized = width !== image.width || height !== image.height
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height

    const context = canvas.getContext('2d')
    if (!context) throw new Error('تعذّر تجهيز الصورة على هذا الجهاز.')
    context.drawImage(image.source, 0, 0, width, height)

    let smallest: Blob | null = null
    for (const quality of WEBP_QUALITIES) {
      const blob = await canvasToBlob(canvas, quality)
      if (!isAllowedMime(blob.type)) continue
      if (!smallest || blob.size < smallest.size) smallest = blob

      if (blob.size <= MAX_IMAGE_FILE_SIZE && (resized || blob.size < file.size)) {
        const extension = MIME_EXTENSIONS[blob.type]
        const baseName = file.name.replace(/\.[^.]+$/, '') || 'incident-image'
        return new File([blob], `${baseName}${extension}`, {
          type: blob.type,
          lastModified: file.lastModified,
        })
      }
    }

    if (!resized && file.size <= MAX_IMAGE_FILE_SIZE) return file
    if (!smallest || smallest.size > MAX_IMAGE_FILE_SIZE) {
      if (!resized && file.size <= MAX_IMAGE_FILE_SIZE) return file
      throw new Error('تعذّر ضغط الصورة إلى الحجم المسموح. اختر صورة أصغر وحاول مجدداً.')
    }

    if (!isAllowedMime(smallest.type)) {
      throw new Error('صيغة الصورة الناتجة غير مدعومة. اختر صورة أخرى وحاول مجدداً.')
    }
    const mime = smallest.type
    const baseName = file.name.replace(/\.[^.]+$/, '') || 'incident-image'
    return new File([smallest], `${baseName}${MIME_EXTENSIONS[mime]}`, {
      type: mime,
      lastModified: file.lastModified,
    })
  } finally {
    image.dispose()
  }
}
