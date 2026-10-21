'use server'

import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { authenticateAdmin } from '@/lib/admin-login'
import { createSession } from '@/lib/auth'
import { getRequestIp } from '@/lib/request-ip'
import { loginCredentialsSchema } from '@/lib/login-validation'
import { classifyLoginFailure, getLoginFailureMessage, getSafeLoginErrorLog } from '@/lib/login-error'

export type AdminLoginState = { error: string; kind: import('@/lib/login-validation').LoginFeedbackKind } | null

export async function adminLoginAction(_previousState: AdminLoginState, formData: FormData): Promise<AdminLoginState> {
  const parsed = loginCredentialsSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  })
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? 'يرجى التحقق من بيانات الدخول.',
      kind: 'validation',
    }
  }

  let destination = '/admin/dashboard'
  let failureStage: 'authentication' | 'session_creation' = 'authentication'
  try {
    const clientIp = getRequestIp(await headers())
    const result = await authenticateAdmin(parsed.data.email, parsed.data.password, clientIp)

    if (result.status === 'rate_limited') {
      return {
        error: 'تم إيقاف المحاولات مؤقتاً بسبب تكرار الإخفاق. انتظر 15 دقيقة من آخر محاولة مرفوضة ثم أعد المحاولة.',
        kind: 'rate_limited',
      }
    }
    if (result.status === 'invalid') {
      return { error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة، أو أن الحساب غير مفعّل.', kind: 'credentials' }
    }

    const { user } = result
    failureStage = 'session_creation'
    await createSession(user.id, user.email, user.name, user.role, user.mustChangePassword)
    if (user.mustChangePassword) destination = '/admin/change-password'
  } catch (error) {
    const category = classifyLoginFailure(error)
    console.error('Admin login failed.', { stage: failureStage, category, ...getSafeLoginErrorLog(error) })
    return { error: getLoginFailureMessage(category), kind: category }
  }

  redirect(destination)
}
