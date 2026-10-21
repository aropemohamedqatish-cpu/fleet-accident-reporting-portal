import { NextResponse } from 'next/server'
import { checkApiRateLimit } from '@/lib/api-rate-limit'
import { normalizeDigits } from '@/lib/plate'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const rateLimit = await checkApiRateLimit(request.headers, 'vehicle-verification')
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'تجاوزت عدد محاولات التحقق المسموحة. يرجى الانتظار قبل المحاولة مجدداً.' },
        {
          status: 429,
          headers: {
            'Cache-Control': 'no-store, max-age=0',
            'Retry-After': String(rateLimit.retryAfterSeconds),
          },
        },
      )
    }
  } catch (error) {
    console.error('Vehicle verification rate limit check failed.', error)
    return NextResponse.json(
      { error: 'تعذّر التحقق من المركبة حالياً. يرجى المحاولة مجدداً.' },
      { status: 503, headers: { 'Cache-Control': 'no-store, max-age=0' } },
    )
  }

  const plate = normalizeDigits(new URL(request.url).searchParams.get('plate') ?? '')
  if (!/^\d{7}$/.test(plate)) {
    return NextResponse.json({ error: 'رقم اللوحة غير صالح.' }, { status: 400 })
  }

  try {
    const vehicle = await prisma.vehicle.findUnique({
      where: { plateNumber: plate },
      select: { plateNumber: true, isActive: true },
    })
    if (!vehicle || !vehicle.isActive) {
      return NextResponse.json({ error: 'رقم اللوحة غير مسجل أو أن المركبة غير مفعّلة.' }, { status: 404 })
    }

    return NextResponse.json(
      { plate: vehicle.plateNumber },
      { headers: { 'Cache-Control': 'no-store, max-age=0' } },
    )
  } catch (error) {
    console.error('Vehicle verification failed.', error)
    return NextResponse.json(
      { error: 'تعذّر التحقق من المركبة حالياً. يرجى المحاولة مجدداً.' },
      { status: 503, headers: { 'Cache-Control': 'no-store, max-age=0' } },
    )
  }
}
