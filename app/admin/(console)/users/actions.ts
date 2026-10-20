'use server'

import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { Prisma } from '@prisma/client'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export type CreateUserState = { error: string; success?: never } | { success: string; error?: never } | null

const createUserSchema = z.object({
  name: z.string().trim().min(2, 'يرجى إدخال اسم الموظف.').max(120, 'الاسم طويل جداً.'),
  email: z.string().trim().email('يرجى إدخال بريد إلكتروني صالح.').max(254).transform((value) => value.toLowerCase()),
  password: z.string().min(12, 'يجب أن تتكون كلمة المرور من 12 محرفاً على الأقل.').max(128, 'كلمة المرور طويلة جداً.'),
  role: z.enum(['ADMIN', 'AGENT'], { error: 'يرجى اختيار صلاحية صالحة.' }),
})

export async function createUserAction(_previousState: CreateUserState, formData: FormData): Promise<CreateUserState> {
  const session = await getSession()
  if (!session) return { error: 'انتهت الجلسة. يرجى تسجيل الدخول مجدداً.' }

  try {
    const actor = await prisma.adminUser.findUnique({
      where: { id: session.userId },
      select: { id: true, role: true },
    })
    if (!actor || actor.role !== 'ADMIN') {
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
      },
    })
    return { success: `تم إنشاء حساب الموظف ${parsed.data.name} بنجاح.` }
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return { error: 'يوجد حساب مسجل بهذا البريد الإلكتروني مسبقاً.' }
    }
    console.error('Admin user creation failed.', error)
    return { error: 'تعذّر إنشاء الحساب حالياً. يرجى المحاولة لاحقاً.' }
  }
}
