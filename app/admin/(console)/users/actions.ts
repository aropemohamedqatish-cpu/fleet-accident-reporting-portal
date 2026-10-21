'use server'

import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export type CreateUserState = { error: string; success?: never } | { success: string; error?: never } | null

const createUserSchema = z.object({
  name: z.string().trim().min(2, 'يرجى إدخال اسم الموظف.').max(120, 'الاسم طويل جداً.'),
  email: z.string().trim().email('يرجى إدخال بريد إلكتروني صالح.').max(254).transform((value) => value.toLowerCase()),
  password: z.string().min(12, 'يجب أن تتكون كلمة المرور من 12 محرفاً على الأقل.').max(128, 'كلمة المرور طويلة جداً.'),
  role: z.enum(['ADMIN', 'AGENT'], { error: 'يرجى اختيار صلاحية صالحة.' }),
})

const userIdSchema = z.string().uuid('معرّف المستخدم غير صالح.')
const resetPasswordSchema = z.object({
  userId: userIdSchema,
  password: z.string().min(12, 'يجب أن تتكون كلمة المرور المؤقتة من 12 محرفاً على الأقل.').max(128, 'كلمة المرور طويلة جداً.'),
})

function isUniqueConstraintError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === 'P2002'
  )
}

async function getAuthorizedAdmin() {
  const session = await getSession()
  if (!session || session.mustChangePassword) return null

  const actor = await prisma.adminUser.findUnique({
    where: { id: session.userId },
    select: { id: true, role: true, isActive: true },
  })
  return actor?.isActive && actor.role === 'ADMIN' ? actor : null
}

export async function createUserAction(_previousState: CreateUserState, formData: FormData): Promise<CreateUserState> {
  try {
    if (!(await getAuthorizedAdmin())) {
      return { error: 'غير مصرح لك بإنشاء حسابات الموظفين.' }
    }
  } catch (error) {
    console.error('Admin authorization lookup failed during user creation.', error)
    return { error: 'تعذّر التحقق من الصلاحية حالياً.' }
  }

  const parsed = createUserSchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    password: formData.get('password'),
    role: formData.get('role'),
  })
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'يرجى مراجعة البيانات المدخلة.' }
  }

  try {
    const passwordHash = await bcrypt.hash(parsed.data.password, 12)
    await prisma.adminUser.create({
      data: {
        name: parsed.data.name,
        email: parsed.data.email,
        role: parsed.data.role,
        passwordHash,
        mustChangePassword: true,
      },
    })
    revalidatePath('/admin/users')
    return { success: `تم إنشاء حساب الموظف ${parsed.data.name} بنجاح.` }
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return { error: 'يوجد حساب مسجل بهذا البريد الإلكتروني مسبقاً.' }
    }
    console.error('Admin user creation failed.', error)
    return { error: 'تعذّر إنشاء الحساب حالياً. يرجى المحاولة لاحقاً.' }
  }
}

export type UserAccountState = { error: string; success?: never } | { success: string; error?: never } | null

export async function toggleUserActiveAction(
  _previousState: UserAccountState,
  formData: FormData,
): Promise<UserAccountState> {
  const parsed = z.object({ userId: userIdSchema, isActive: z.enum(['true', 'false']) }).safeParse({
    userId: formData.get('userId'),
    isActive: formData.get('isActive'),
  })
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'البيانات المدخلة غير صالحة.' }

  try {
    const actor = await getAuthorizedAdmin()
    if (!actor) return { error: 'غير مصرح لك بإدارة حسابات الموظفين.' }
    if (parsed.data.userId === actor.id) return { error: 'لا يمكن تعطيل حسابك من هنا.' }

    const isActive = parsed.data.isActive === 'true'
    const result = await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT 1 FROM (SELECT pg_advisory_xact_lock(hashtextextended('admin-account-status', 0))) AS lock_result`
      const target = await tx.adminUser.findUnique({
        where: { id: parsed.data.userId },
        select: { id: true, name: true, role: true, isActive: true },
      })
      if (!target) return { error: 'حساب المستخدم غير موجود.' }
      if (target.isActive === isActive) {
        return { success: isActive ? 'الحساب مفعّل بالفعل.' : 'الحساب معطّل بالفعل.' }
      }

      if (!isActive && target.role === 'ADMIN') {
        const activeAdmins = await tx.adminUser.count({ where: { role: 'ADMIN', isActive: true } })
        if (activeAdmins <= 1) return { error: 'لا يمكن تعطيل آخر حساب نشط لمدير النظام.' }
      }

      await tx.adminUser.update({
        where: { id: target.id },
        data: { isActive, sessionVersion: { increment: 1 } },
      })
      return { success: isActive ? `تم تفعيل حساب ${target.name}.` : `تم تعطيل حساب ${target.name}.` }
    })
    if ('success' in result) revalidatePath('/admin/users')
    return result
  } catch (error) {
    console.error('Admin user activation update failed.', error)
    return { error: 'تعذّر تحديث حالة الحساب حالياً.' }
  }
}

export async function resetUserPasswordAction(
  _previousState: UserAccountState,
  formData: FormData,
): Promise<UserAccountState> {
  const parsed = resetPasswordSchema.safeParse({
    userId: formData.get('userId'),
    password: formData.get('password'),
  })
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'يرجى مراجعة كلمة المرور المؤقتة.' }

  try {
    const actor = await getAuthorizedAdmin()
    if (!actor) return { error: 'غير مصرح لك باستعادة كلمات مرور الموظفين.' }
    if (parsed.data.userId === actor.id) return { error: 'استخدم صفحة تغيير كلمة المرور لتحديث كلمة مرورك.' }

    const target = await prisma.adminUser.findUnique({
      where: { id: parsed.data.userId },
      select: { id: true, name: true },
    })
    if (!target) return { error: 'حساب المستخدم غير موجود.' }

    const passwordHash = await bcrypt.hash(parsed.data.password, 12)
    await prisma.adminUser.update({
      where: { id: target.id },
      data: { passwordHash, mustChangePassword: true, sessionVersion: { increment: 1 } },
    })
    revalidatePath('/admin/users')
    return { success: `تم تعيين كلمة مرور مؤقتة لـ ${target.name}. يجب تغييرها عند تسجيل الدخول التالي.` }
  } catch (error) {
    console.error('Admin user password reset failed.', error)
    return { error: 'تعذّرت استعادة كلمة المرور حالياً.' }
  }
}
