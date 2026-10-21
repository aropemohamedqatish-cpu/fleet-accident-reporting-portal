import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  buildIncidentWhatsAppUrl,
  getIncidentSupervisor,
  IncidentWhatsAppConfigError,
} from '@/lib/incident-whatsapp'

export const runtime = 'nodejs'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string; supervisor: string }> },
) {
  const { id, supervisor: supervisorNumber } = await context.params
  if (!UUID_RE.test(id)) {
    return NextResponse.json({ error: 'معرّف البلاغ غير صالح.' }, { status: 400 })
  }

  let supervisor: ReturnType<typeof getIncidentSupervisor>
  try {
    supervisor = getIncidentSupervisor(supervisorNumber)
  } catch (error) {
    if (error instanceof IncidentWhatsAppConfigError) {
      console.error('Incident WhatsApp is not configured.', error.message)
      return NextResponse.json(
        { error: 'التواصل عبر واتساب غير مهيأ حالياً. يرجى التواصل هاتفياً مع الجهة المختصة.' },
        { status: 503 },
      )
    }
    throw error
  }

  try {
    const incident = await prisma.accident.findUnique({
      where: { id },
      select: {
        id: true,
        reporterName: true,
        reporterPhone: true,
        locationDescription: true,
        latitude: true,
        longitude: true,
        notes: true,
        createdAt: true,
        vehicle: { select: { plateNumber: true } },
        _count: { select: { media: true } },
      },
    })
    if (!incident) {
      return NextResponse.json({ error: 'البلاغ غير موجود.' }, { status: 404 })
    }

    const url = buildIncidentWhatsAppUrl(supervisor.phone, {
      incidentId: incident.id,
      plateNumber: incident.vehicle.plateNumber,
      reporterName: incident.reporterName,
      reporterPhone: incident.reporterPhone,
      locationDescription: incident.locationDescription,
      latitude: incident.latitude,
      longitude: incident.longitude,
      notes: incident.notes,
      mediaCount: incident._count.media,
      createdAt: incident.createdAt,
    })
    return NextResponse.redirect(url, {
      status: 302,
      headers: { 'Cache-Control': 'no-store' },
    })
  } catch (error) {
    console.error('Could not prepare WhatsApp message for incident.', error)
    return NextResponse.json(
      { error: 'تعذّر تجهيز رسالة واتساب لهذا البلاغ حالياً.' },
      { status: 500 },
    )
  }
}
