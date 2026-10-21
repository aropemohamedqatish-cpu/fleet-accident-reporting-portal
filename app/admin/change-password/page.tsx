import { redirect } from 'next/navigation'
import { KeyRound } from 'lucide-react'
import { ChangePasswordForm } from '@/components/admin/change-password-form'
import { getSession } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export default async function ChangePasswordPage() {
  const session = await getSession()
  if (!session) redirect('/admin/login')

  return (
    <main dir="rtl" className="flex min-h-dvh items-center justify-center bg-slate-50 p-4 sm:p-8">
      <section className="w-full max-w-xl space-y-6 rounded-[28px] border border-slate-200 bg-white p-6 shadow-xl sm:p-9">
        <header className="space-y-3">
          <span className="flex size-12 items-center justify-center rounded-2xl bg-[#003366]/10 text-[#003366]">
            <KeyRound className="size-6" aria-hidden="true" />
          </span>
          <p className="text-sm font-bold text-[#003366]">أمان الحساب</p>
          <h1 className="text-2xl font-extrabold text-slate-950">تغيير كلمة المرور</h1>
          <p className="text-sm font-medium leading-7 text-slate-700">
            {session.mustChangePassword
              ? 'تعيين كلمة مرور جديدة ضروري لتفعيل الوصول إلى لوحة التحكم.'
              : 'يمكنك تحديث كلمة مرور حسابك من هذه الصفحة.'}
          </p>
        </header>
        <ChangePasswordForm forced={session.mustChangePassword} />
      </section>
    </main>
  )
}
