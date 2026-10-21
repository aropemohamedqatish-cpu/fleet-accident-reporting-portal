import { z } from 'zod'

export const loginCredentialsSchema = z.object({
  email: z
    .string()
    .trim()
    .email('يرجى إدخال بريد إلكتروني صالح')
    .max(254)
    .transform((email) => email.toLowerCase()),
  password: z.string().min(1, 'يرجى إدخال كلمة المرور').max(128, 'بيانات الدخول غير صالحة'),
})

export type LoginFeedbackKind =
  | 'validation'
  | 'credentials'
  | 'rate_limited'
  | 'schema'
  | 'database_unavailable'
  | 'configuration'
  | 'unexpected'

export function isLoginRateLimited(emailFailures: number, ipFailures: number): boolean {
  return emailFailures >= 5 || ipFailures >= 20
}

export function isAccountLoginAllowed(isActive: boolean, passwordMatches: boolean): boolean {
  return isActive && passwordMatches
}

export function shouldRedirectForForcedPasswordChange(
  pathname: string,
  mustChangePassword: boolean,
): boolean {
  return mustChangePassword && pathname !== '/admin/login' && pathname !== '/admin/change-password'
}
