import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getIncidentDetail } from '@/lib/admin-queries'

export const runtime = 'nodejs'

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'غير مصرّح. يرجى تسجيل الدخول.' }, { status: 401 })
  const { id } = await ctx.params
  try {
    const detail = await getIncidentDetail(id)
    if (!detail) return NextResponse.json({ error: 'البلاغ غير موجود.' }, { status: 404 })
    return NextResponse.json(detail)
  } catch (error) {
    console.error('Admin incident detail failed.', error)
    return NextResponse.json({ error: 'تعذّر تحميل التفاصيل حالياً.' }, { status: 500 })
  }
}
