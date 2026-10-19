'use server'

import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { createSession } from '@/lib/auth'

export type AdminLoginState = { error: string } | null

const adminLoginSchema = z.object({
  email: z
    .string()
    .trim()
    .email('يرجى إدخال بريد إلكتروني صالح')
    .max(254)
    .transform((email) => email.toLowerCase()),
  password: z.string().min(1, 'يرجى إدخال كلمة المرور').max(128, 'بيانات الدخول غير صالحة'),
})

export async function adminLoginAction(_previousState: AdminLoginState, formData: FormData): Promise<AdminLoginState> {
  const parsed = adminLoginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  })
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'يرجى التحقق من بيانات الدخول.' }
  }

  try {
    const exactMatch = await prisma.adminUser.findUnique({
      where: { email: parsed.data.email },
      select: { id: true, email: true, name: true, passwordHash: true, role: true },
    })
    const legacyMatches = exactMatch
      ? []
      : await prisma.adminUser.findMany({
          where: { email: { equals: parsed.data.email, mode: 'insensitive' } },
          take: 2,
          select: { id: true, email: true, name: true, passwordHash: true, role: true },
        })
    const user = exactMatch ?? (legacyMatches.length === 1 ? legacyMatches[0] : null)
    const passwordMatches = user ? await bcrypt.compare(parsed.data.password, user.passwordHash) : false

    if (!user || !passwordMatches) {
      return { error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة.' }
    }

    await createSession(user.id, user.email, user.name, user.role)
  } catch (error) {
    console.error('Admin login failed.', error)
    return { error: 'تعذّر تسجيل الدخول حالياً. يرجى المحاولة لاحقاً.' }
  }

  redirect('/admin/dashboard')
}
