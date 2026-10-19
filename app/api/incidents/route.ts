import { createHash, randomUUID } from 'node:crypto'
import { mkdir, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import {
  incidentPayloadSchema,
  MAX_IMAGE_FILE_SIZE,
  MAX_IMAGES,
  MAX_VIDEO_FILE_SIZE,
  type AllowedMime,
  type AllowedVideoMime,
} from '@/lib/validation'

export const runtime = 'nodejs'

const MAX_TOTAL_UPLOAD_SIZE = MAX_IMAGES * MAX_IMAGE_FILE_SIZE + MAX_VIDEO_FILE_SIZE
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const EXTENSIONS: Record<AllowedMime | AllowedVideoMime, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'video/mp4': '.mp4',
  'video/quicktime': '.mov',
  'video/webm': '.webm',
}

type UploadedMedia = {
  id: string
  buffer: Buffer
  mime: AllowedMime | AllowedVideoMime
  kind: 'IMAGE' | 'VIDEO'
  size: number
  url: string
}

function errorResponse(error: string, status: number, details?: unknown) {
  return NextResponse.json({ error, ...(details ? { details } : {}) }, { status })
}

function detectMediaMime(buffer: Buffer): AllowedMime | AllowedVideoMime | null {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return 'image/jpeg'
  }
  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return 'image/png'
  }
  if (
    buffer.length >= 12 &&
    buffer.toString('ascii', 0, 4) === 'RIFF' &&
    buffer.toString('ascii', 8, 12) === 'WEBP'
  ) {
    return 'image/webp'
  }
  if (buffer.length >= 12 && buffer.toString('ascii', 4, 8) === 'ftyp') {
    const brand = buffer.toString('ascii', 8, 12)
    return brand === 'qt  ' ? 'video/quicktime' : 'video/mp4'
  }
  if (buffer.length >= 4 && buffer[0] === 0x1a && buffer[1] === 0x45 && buffer[2] === 0xdf && buffer[3] === 0xa3) {
    return 'video/webm'
  }
  return null
}

function isAllowedImageMime(mime: AllowedMime | AllowedVideoMime | null): mime is AllowedMime {
  return mime === 'image/jpeg' || mime === 'image/png' || mime === 'image/webp'
}

function isAllowedVideoMime(mime: AllowedMime | AllowedVideoMime | null): mime is AllowedVideoMime {
  return mime === 'video/mp4' || mime === 'video/quicktime' || mime === 'video/webm'
}

function isFile(value: FormDataEntryValue): value is File {
  return typeof value !== 'string' && typeof value.arrayBuffer === 'function'
}

function createRequestHash(
  payload: ReturnType<typeof incidentPayloadSchema.parse>,
  media: UploadedMedia[],
) {
  const hash = createHash('sha256')
  hash.update(JSON.stringify(payload))
  for (const item of media) {
    hash.update(item.kind)
    hash.update(item.buffer)
  }
  return hash.digest('hex')
}

function isUniqueConstraintError(error: unknown): error is Prisma.PrismaClientKnownRequestError {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002'
}

async function findIdempotentResponse(key: string, requestHash: string) {
  const existing = await prisma.accident.findUnique({
    where: { idempotencyKey: key },
    select: { id: true, requestHash: true },
  })
  if (!existing) return null
  if (existing.requestHash !== requestHash) {
    return errorResponse('مفتاح الإرسال مستخدم مسبقاً مع بيانات بلاغ مختلفة.', 409)
  }
  return NextResponse.json({ incidentId: existing.id, replayed: true })
}

export async function POST(request: Request) {
  const key = request.headers.get('Idempotency-Key')
  if (!key || !UUID_RE.test(key)) {
    return errorResponse('مفتاح البلاغ مفقود أو غير صالح. يرجى إعادة المحاولة.', 400)
  }

  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return errorResponse('تعذّر قراءة بيانات البلاغ أو ملفاته. تحقق من البيانات وأعد المحاولة.', 400)
  }

  const rawPayload = formData.get('payload')
  if (typeof rawPayload !== 'string') {
    return errorResponse('بيانات البلاغ مفقودة أو غير صالحة.', 400)
  }

  let body: unknown
  try {
    body = JSON.parse(rawPayload)
  } catch {
    return errorResponse('تعذّر قراءة بيانات البلاغ. تحقق من البيانات وأعد المحاولة.', 400)
  }

  const parsed = incidentPayloadSchema.safeParse(body)
  if (!parsed.success) {
    return errorResponse('بيانات البلاغ غير مكتملة أو غير صالحة.', 400, parsed.error.issues)
  }

  const videos = parsed.data.videos ?? []
  const uploadedFiles = formData.getAll('files')
  const files = uploadedFiles.filter(isFile)
  const expectedCount = parsed.data.photos.length + videos.length
  if (uploadedFiles.length !== expectedCount || files.length !== uploadedFiles.length) {
    return errorResponse('عدد ملفات الوسائط المرسلة لا يطابق بيانات البلاغ.', 400)
  }

  const totalSize = files.reduce((sum, file) => sum + file.size, 0)
  if (totalSize > MAX_TOTAL_UPLOAD_SIZE) {
    return errorResponse('الحجم الإجمالي للوسائط يتجاوز الحد المسموح.', 400)
  }

  const expectedMedia = [
    ...parsed.data.photos.map((metadata) => ({ metadata, kind: 'IMAGE' as const })),
    ...videos.map((metadata) => ({ metadata, kind: 'VIDEO' as const })),
  ]
  const media: UploadedMedia[] = []
  for (const [index, file] of files.entries()) {
    const expected = expectedMedia[index]
    const metadata = expected.metadata
    const maxFileSize = expected.kind === 'IMAGE' ? MAX_IMAGE_FILE_SIZE : MAX_VIDEO_FILE_SIZE
    if (
      file.size === 0 ||
      file.size > maxFileSize ||
      file.size !== metadata.size ||
      file.name !== metadata.name
    ) {
      return errorResponse('بيانات أحد ملفات الوسائط لا تطابق الملف المرفق.', 400)
    }

    let buffer: Buffer
    try {
      buffer = Buffer.from(await file.arrayBuffer())
    } catch {
      return errorResponse('تعذّر قراءة أحد ملفات الوسائط المرفقة.', 400)
    }
    const mime = detectMediaMime(buffer)
    const mimeAllowed =
      expected.kind === 'IMAGE'
        ? isAllowedImageMime(mime)
        : isAllowedVideoMime(mime)
    if (!mime || !mimeAllowed || mime !== metadata.type) {
      return errorResponse('أحد ملفات الوسائط غير صالح أو بصيغة غير مدعومة.', 400)
    }
    media.push({ id: randomUUID(), buffer, mime, kind: expected.kind, size: buffer.length, url: '' })
  }

  const requestHash = createRequestHash(parsed.data, media)

  try {
    const priorResponse = await findIdempotentResponse(key, requestHash)
    if (priorResponse) return priorResponse

    const vehicle = await prisma.vehicle.findFirst({
      where: { plateNumber: parsed.data.plate, isActive: true },
      select: { id: true },
    })
    if (!vehicle) {
      return errorResponse('رقم اللوحة غير مسجل أو أن المركبة غير مفعّلة في الأسطول.', 400)
    }

    const accidentId = randomUUID()
    const incidentDirectory = path.join(
      process.cwd(),
      'public',
      'uploads',
      'incidents',
      parsed.data.plate,
      accidentId,
    )
    for (const item of media) {
      item.url = `/uploads/incidents/${parsed.data.plate}/${accidentId}/${item.id}${EXTENSIONS[item.mime]}`
    }

    try {
      await mkdir(incidentDirectory, { recursive: true })
      await Promise.all(
        media.map((item) =>
          writeFile(
            path.join(incidentDirectory, path.basename(item.url)),
            item.buffer,
            { flag: 'wx' },
          ),
        ),
      )

      await prisma.$transaction(async (tx) =>
        tx.accident.create({
          data: {
            id: accidentId,
            idempotencyKey: key,
            requestHash,
            vehicleId: vehicle.id,
            reporterName: parsed.data.reporter.fullName,
            reporterPhone: parsed.data.reporter.mobile,
            locationDescription:
              parsed.data.location.mode === 'manual'
                ? parsed.data.location.description
                : `إحداثيات GPS: ${parsed.data.location.lat}, ${parsed.data.location.lng}`,
            latitude: parsed.data.location.mode === 'gps' ? parsed.data.location.lat : null,
            longitude: parsed.data.location.mode === 'gps' ? parsed.data.location.lng : null,
            notes: parsed.data.reporter.notes,
            media: {
              create: media.map((item) => ({
                fileUrl: item.url,
                fileType: item.mime,
                mediaType: item.kind,
                fileSize: item.size,
              })),
            },
          },
          select: { id: true },
        }),
      )

      return NextResponse.json({ incidentId: accidentId, replayed: false }, { status: 201 })
    } catch (error) {
      await rm(incidentDirectory, { recursive: true, force: true }).catch((cleanupError: unknown) => {
        console.error('Failed to clean up incident upload directory after submission failure.', cleanupError)
      })

      if (isUniqueConstraintError(error)) {
        const conflictResponse = await findIdempotentResponse(key, requestHash)
        if (conflictResponse) return conflictResponse
      }
      throw error
    }
  } catch (error) {
    console.error('Incident submission failed.', error)
    return errorResponse('تعذّر حفظ البلاغ حالياً بسبب خطأ في الخادم. يرجى المحاولة لاحقاً.', 500)
  }
}
