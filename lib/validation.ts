import { z } from 'zod'
import { normalizeDigits } from './fleet-data'

export const MAX_IMAGES = 10
export const MAX_IMAGE_FILE_SIZE = 10 * 1024 * 1024
export const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp'] as const
export type AllowedMime = (typeof ALLOWED_MIME)[number]

const NAME_PART = /^[\p{L}\u0600-\u06FF'-]{2,}$/u

export const reporterSchema = z.object({
  fullName: z
    .string()
    .trim()
    .max(80, 'الاسم طويل جداً')
    .refine((v) => {
      const parts = v.split(/\s+/).filter(Boolean)
      return parts.length >= 3 && parts.every((p) => NAME_PART.test(p))
    }, 'يرجى إدخال الاسم الثلاثي (الاسم، اسم الأب، الكنية)'),
  mobile: z
    .string()
    .trim()
    .transform((v) => normalizeDigits(v).replace(/[\s-]/g, ''))
    .refine((v) => /^09\d{8}$/.test(v), 'رقم الجوال يجب أن يكون بصيغة 09XXXXXXXX'),
  notes: z
    .string()
    .trim()
    .min(10, 'يرجى كتابة وصف مختصر للحادث (10 أحرف على الأقل)')
    .max(1000, 'الحد الأقصى 1000 حرف'),
})

export type ReporterInput = z.input<typeof reporterSchema>
export type ReporterData = z.output<typeof reporterSchema>

export const incidentPayloadSchema = z.object({
  plate: z.string().regex(/^\d{7}$/, 'رقم اللوحة يجب أن يتكون من 7 أرقام'),
  location: z.discriminatedUnion('mode', [
    z.object({
      mode: z.literal('gps'),
      lat: z.number().min(-90).max(90),
      lng: z.number().min(-180).max(180),
      accuracy: z.number().nonnegative(),
    }),
    z.object({ mode: z.literal('manual'), description: z.string().trim().min(5).max(500) }),
  ]),
  reporter: reporterSchema,
  photos: z
    .array(
      z.object({
        name: z.string().max(200),
        size: z.number().int().positive().max(MAX_IMAGE_FILE_SIZE),
        type: z.enum(ALLOWED_MIME),
      }),
    )
    .max(MAX_IMAGES),
  createdAt: z.string().datetime(),
}).refine((payload) => payload.photos.length > 0, {
  message: 'يرجى إرفاق صورة واحدة على الأقل.',
  path: ['photos'],
})

export type IncidentPayload = z.input<typeof incidentPayloadSchema>

/** Detects the real image type from magic bytes instead of trusting the file extension. */
export async function sniffImageMime(file: File): Promise<AllowedMime | null> {
  const bytes = new Uint8Array(await file.slice(0, 12).arrayBuffer())
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'image/jpeg'
  if (
    bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47 &&
    bytes[4] === 0x0d && bytes[5] === 0x0a && bytes[6] === 0x1a && bytes[7] === 0x0a
  )
    return 'image/png'
  const riff = String.fromCharCode(...bytes.slice(0, 4))
  const webp = String.fromCharCode(...bytes.slice(8, 12))
  if (riff === 'RIFF' && webp === 'WEBP') return 'image/webp'
  return null
}
