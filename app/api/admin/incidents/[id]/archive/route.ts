import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { NextResponse } from 'next/server'
import JSZip from 'jszip'
import { getSession } from '@/lib/auth'
import { getIncidentDetail } from '@/lib/admin-queries'
import { STATUS_LABELS, formatDateTime, shortRef } from '@/lib/admin-claims'

export const runtime = 'nodejs'

const EXT_BY_MIME: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
}

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'غير مصرّح. يرجى تسجيل الدخول.' }, { status: 401 })
  const { id } = await ctx.params

  try {
    const incident = await getIncidentDetail(id)
    if (!incident) return NextResponse.json({ error: 'البلاغ غير موجود.' }, { status: 404 })

    const zip = new JSZip()
    const ref = shortRef(incident.id)
    const folder = zip.folder(`incident-${incident.plateNumber}-${ref}`)
    if (!folder) throw new Error('zip folder failed')

    const lines = [
      'آروب سورية للتأمين — تقرير بلاغ حادث أسطول',
      '='.repeat(48),
      `المرجع: ${ref}`,
      `المعرف الكامل: ${incident.id}`,
      `رقم اللوحة: ${incident.plateNumber}`,
      `الحالة: ${STATUS_LABELS[incident.status] ?? incident.status}`,
      `المؤمن له: ${incident.reporterName}`,
      `الجوال: ${incident.reporterPhone}`,
      `وقت التسجيل: ${formatDateTime(incident.createdAt)}`,
      `آخر تحديث: ${formatDateTime(incident.updatedAt)}`,
      `الوصف: ${incident.locationDescription}`,
      incident.latitude !== null && incident.longitude !== null
        ? `الإحداثيات: ${incident.latitude}, ${incident.longitude} — https://www.google.com/maps?q=${incident.latitude},${incident.longitude}`
        : 'الإحداثيات: غير متوفرة (وصف يدوي)',
      `ملاحظات: ${incident.notes ?? '—'}`,
      `عدد المرفقات: ${incident.media.length}`,
      `صُدّر بواسطة: ${session.name} (${session.email})`,
    ]
    folder.file('report.txt', lines.join('\n'))

    const missing: string[] = []
    let index = 0
    for (const m of incident.media) {
      index += 1
      const ext = EXT_BY_MIME[m.fileType]
      if (!ext) continue
      const name = `image-${String(index).padStart(2, '0')}${ext}`
      const relative = m.fileUrl.startsWith('/') ? m.fileUrl.slice(1) : m.fileUrl
      const diskPath = path.join(process.cwd(), 'public', relative)
      try {
        const buf = await readFile(diskPath)
        folder.file(`attachments/${name}`, buf)
      } catch {
        missing.push(name)
      }
    }
    if (missing.length > 0) {
      folder.file('MISSING_FILES.txt', `تعذّر تضمين الملفات التالية (غير موجودة على القرص):\n${missing.join('\n')}\n`)
    }

    const buffer = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' })
    const body = new Uint8Array(buffer)
    return new NextResponse(body, {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="incident-${incident.plateNumber}-${ref}.zip"`,
        'Content-Length': String(body.byteLength),
        'Cache-Control': 'no-store',
      },
    })
  } catch (error) {
    console.error('Admin archive export failed.', error)
    return NextResponse.json({ error: 'تعذّر تصدير الأرشيف حالياً.' }, { status: 500 })
  }
}
