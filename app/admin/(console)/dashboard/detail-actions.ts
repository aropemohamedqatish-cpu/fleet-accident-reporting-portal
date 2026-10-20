'use server'

import { randomUUID } from 'node:crypto'
import { headers } from 'next/headers'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getRequestIp } from '@/lib/request-ip'
import { isIncidentStatus, STATUS_LABELS } from '@/lib/admin-claims'

export type UpdateStatusResult = { success: true } | { success: false; error: string }

function isAuditTableMissingError(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) return false
  if ('code' in error && error.code === 'P2021') return true
  if ('message' in error && typeof error.message === 'string') {
    return /relation .*"?AuditLog"? .*does not exist/i.test(error.message)
  }
  return false
}

export async function updateStatusAction(id: string, status: string): Promise<UpdateStatusResult> {
  try {
    const session = await getSession()
    if (!session) return { success: false, error: 'انتهت الجلسة. يرجى تسجيل الدخول مجدداً.' }
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) {
      return { success: false, error: 'معرّف البلاغ غير صالح.' }
    }
    if (!isIncidentStatus(status)) return { success: false, error: 'الحالة المحددة غير صالحة.' }

    const ipAddress = getRequestIp(await headers()) ?? 'غير متاح'

    return await prisma.$transaction(async (tx): Promise<UpdateStatusResult> => {
      const [actor, incident] = await Promise.all([
        tx.adminUser.findUnique({ where: { id: session.userId }, select: { id: true, name: true } }),
        tx.accident.findUnique({ where: { id }, select: { id: true, status: true } }),
      ])
      if (!actor) return { success: false, error: 'الحساب غير موجود. يرجى تسجيل الدخول مجدداً.' }
      if (!incident) return { success: false, error: 'البلاغ المطلوب غير موجود.' }
      if (incident.status === status) return { success: true }

      const update = await tx.accident.updateMany({
        where: { id, status: incident.status },
        data: { status },
      })
      if (update.count !== 1) {
        return { success: false, error: 'تغيّرت حالة البلاغ من موظف آخر. حدّث الصفحة ثم أعد المحاولة.' }
      }

      await tx.$executeRaw`
        INSERT INTO "AuditLog" ("id", "userId", "accidentId", "actionType", "details", "ipAddress", "createdAt")
        VALUES (
          ${randomUUID()},
          ${actor.id},
          ${incident.id},
          ${'STATUS_UPDATED'},
          ${`قام الموظف ${actor.name} بتحديث حالة البلاغ من «${STATUS_LABELS[incident.status] ?? 'حالة غير معروفة'}» إلى «${STATUS_LABELS[status]}»`},
          ${ipAddress},
          CURRENT_TIMESTAMP
        )
      `
      return { success: true }
    })
  } catch (error) {
    console.error('Admin incident status update failed.', error)
    if (isAuditTableMissingError(error)) {
      return { success: false, error: 'جدول سجل التدقيق غير مهيأ في قاعدة البيانات. يرجى تطبيق ترحيلات Prisma ثم إعادة المحاولة.' }
    }
    return { success: false, error: 'تعذّر حفظ الحالة وسجل التدقيق. لم يُعتمد التغيير، يرجى المحاولة لاحقاً.' }
  }
}
