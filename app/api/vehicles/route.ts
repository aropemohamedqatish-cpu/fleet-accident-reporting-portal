import { NextResponse } from 'next/server'
import { checkApiRateLimit } from '@/lib/api-rate-limit'
import { getPlateSearchCandidates } from '@/lib/plate'
import { prisma } from '@/lib/prisma'
import { isSyrianGovernorate } from '@/lib/syrian-governorates'

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

  const searchParams = new URL(request.url).searchParams
  const plate = searchParams.get('plate') ?? ''
  const governorate = searchParams.get('governorate') ?? ''
  const candidates = getPlateSearchCandidates(plate)
  if (candidates.length === 0) {
    return NextResponse.json({ error: 'أدخل رقم لوحة من 6 أو 7 أرقام، ويمكن الفصل بينها بأي رمز.' }, { status: 400 })
  }
  if (!isSyrianGovernorate(governorate)) {
    return NextResponse.json({ error: 'يرجى اختيار المحافظة من القائمة.' }, { status: 400 })
  }

  try {
    const vehicles = await prisma.vehicle.findMany({
      where: {
        plateNumber: { in: candidates },
        isActive: true,
        OR: [{ governorate }, { governorate: null }],
      },
      select: { plateNumber: true, governorate: true },
    })
    const vehicle =
      candidates
      .map((candidate) => vehicles.find((item) => item.plateNumber === candidate && item.governorate === governorate))
      .find((item) => item !== undefined) ??
      candidates
      .map((candidate) => vehicles.find((item) => item.plateNumber === candidate && item.governorate === null))
      .find((item) => item !== undefined)
    if (!vehicle) {
      return NextResponse.json({ error: 'رقم اللوحة غير مسجل أو أن المركبة غير مفعّلة.' }, { status: 404 })
    }

    return NextResponse.json(
      { plate: vehicle.plateNumber, governorate },
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
