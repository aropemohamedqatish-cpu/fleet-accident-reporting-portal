'use server'

import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { redirect } from 'next/navigation'
import { createSession, getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export type ChangePasswordState = { error: string } | null

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'يرجى إدخال كلمة المرور الحالية.').max(128),
  newPassword: z.string().min(12, 'يجب أن تتكون كلمة المرور الجديدة من 12 محرفاً على الأقل.').max(128),
  confirmPassword: z.string().min(1, 'يرجى تأكيد كلمة المرور الجديدة.').max(128),
}).refine((values) => values.newPassword === values.confirmPassword, {
  path: ['confirmPassword'],
  message: 'تأكيد كلمة المرور غير مطابق.',
})

export async function changePasswordAction(
  _previousState: ChangePasswordState,
  formData: FormData,
): Promise<ChangePasswordState> {
  const parsed = changePasswordSchema.safeParse({
    currentPassword: formData.get('currentPassword'),
    newPassword: formData.get('newPassword'),
    confirmPassword: formData.get('confirmPassword'),
  })
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'يرجى مراجعة البيانات المدخلة.' }

  try {
    const session = await getSession()
    if (!session) return { error: 'انتهت الجلسة. يرجى تسجيل الدخول مجدداً.' }

    const user = await prisma.adminUser.findUnique({
      where: { id: session.userId },
      select: { id: true, email: true, name: true, role: true, passwordHash: true, isActive: true },
    })
    if (!user?.isActive) return { error: 'الحساب غير متاح. يرجى التواصل مع مدير النظام.' }

    const currentPasswordMatches = await bcrypt.compare(parsed.data.currentPassword, user.passwordHash)
    if (!currentPasswordMatches) return { error: 'كلمة المرور الحالية غير صحيحة.' }
    if (parsed.data.currentPassword === parsed.data.newPassword) {
      return { error: 'يجب اختيار كلمة مرور جديدة مختلفة عن الحالية.' }
    }

    const passwordHash = await bcrypt.hash(parsed.data.newPassword, 12)
    const result = await prisma.adminUser.updateMany({
      where: { id: user.id, passwordHash: user.passwordHash, isActive: true },
      data: { passwordHash, mustChangePassword: false, sessionVersion: { increment: 1 } },
    })
    if (result.count !== 1) return { error: 'تغيّرت بيانات الحساب. يرجى تسجيل الدخول مجدداً.' }

    await createSession(user.id, user.email, user.name, user.role, false)
  } catch (error) {
    console.error('Admin password change failed.', error)
    return { error: 'تعذّر تغيير كلمة المرور حالياً. يرجى المحاولة لاحقاً.' }
  }

  redirect('/admin/dashboard')
}
