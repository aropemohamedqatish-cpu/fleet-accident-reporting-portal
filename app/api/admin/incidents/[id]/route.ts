import { randomUUID } from 'node:crypto'
import { NextResponse, type NextRequest } from 'next/server'
import { getSession } from '@/lib/auth'
import { getIncidentDetail } from '@/lib/admin-queries'
import { prisma } from '@/lib/prisma'
import { getRequestIp } from '@/lib/request-ip'

export const runtime = 'nodejs'

type RouteContext = { params: Promise<{ id: string }> }

export async function GET(_req: Request, ctx: RouteContext) {
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

export async function PATCH(request: NextRequest, ctx: RouteContext) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'غير مصرّح. يرجى تسجيل الدخول.' }, { status: 401 })

  const ipAddress = getRequestIp(request.headers)
  if (!ipAddress) {
    return NextResponse.json(
      { error: 'تعذّر تحديد عنوان الشبكة الآمن. يرجى المحاولة عبر اتصال موثوق.' },
      { status: 400 },
    )
  }

  const { id: accidentId } = await ctx.params
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(accidentId)) {
    return NextResponse.json({ error: 'معرّف البلاغ غير صالح.' }, { status: 400 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'بيانات الطلب غير صالحة.' }, { status: 400 })
  }

  if (
    typeof body !== 'object' ||
    body === null ||
    !('assignedToId' in body) ||
    typeof body.assignedToId !== 'string' ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(body.assignedToId)
  ) {
    return NextResponse.json({ error: 'يجب تحديد موظف صالح لإسناد البلاغ إليه.' }, { status: 400 })
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const [actor, target, accidents] = await Promise.all([
        tx.adminUser.findUnique({ where: { id: session.userId }, select: { id: true, name: true } }),
        tx.adminUser.findUnique({ where: { id: body.assignedToId }, select: { id: true, name: true } }),
        tx.$queryRaw<Array<{ id: string; assignedToId: string | null }>>`
          SELECT "id", "assignedToId" FROM "Accident" WHERE "id" = ${accidentId}
        `,
      ])
      const accident = accidents[0]

      if (!actor) return { error: 'انتهت صلاحية الحساب. يرجى تسجيل الدخول مجدداً.', status: 401 as const }
      if (!target) return { error: 'الموظف المحدد غير موجود.', status: 404 as const }
      if (!accident) return { error: 'البلاغ غير موجود.', status: 404 as const }
      if (accident.assignedToId === target.id) {
        return { error: 'البلاغ مسند بالفعل إلى هذا الموظف.', status: 409 as const }
      }

      const updated = await tx.$executeRaw`
        UPDATE "Accident"
        SET "assignedToId" = ${target.id}, "updatedAt" = CURRENT_TIMESTAMP
        WHERE "id" = ${accidentId} AND "assignedToId" IS NOT DISTINCT FROM ${accident.assignedToId}
      `
      if (updated !== 1) {
        return { error: 'تغيّر إسناد البلاغ من موظف آخر. حدّث الصفحة ثم أعد المحاولة.', status: 409 as const }
      }

      const details = `قام الموظف ${actor.name} بنقل ملكية ومتابعة البلاغ إلى الموظف ${target.name}`
      const auditLogId = randomUUID()
      await tx.$executeRaw`
        INSERT INTO "AuditLog" ("id", "userId", "accidentId", "actionType", "details", "ipAddress", "createdAt")
        VALUES (
          ${auditLogId},
          ${actor.id},
          ${accidentId},
          ${'CLAIM_TRANSFERRED'},
          ${details},
          ${ipAddress},
          CURRENT_TIMESTAMP
        )
      `

      return { auditLogId, assignedTo: { id: target.id, name: target.name } }
    })

    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: result.status })
    }

    return NextResponse.json({
      assignedTo: result.assignedTo,
      auditLog: {
        id: result.auditLogId,
        createdAt: new Date().toLocaleString('ar-SY', { timeZone: 'Asia/Damascus' }),
      },
    })
  } catch (error) {
    console.error('Admin incident reassignment failed.', error)
    return NextResponse.json({ error: 'تعذّرت إعادة إسناد البلاغ حالياً.' }, { status: 500 })
  }
}
