import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { AdminLoginForm } from './login-form'

export default async function AdminLoginPage() {
  if (await getSession()) redirect('/admin/dashboard')

  return (
    <main className="flex min-h-dvh items-center justify-center bg-[#f8fafc] p-4" dir="rtl">
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -top-24 right-[-8%] h-[34rem] w-[34rem] rounded-full bg-[#003366]/16 blur-[128px]" />
        <div className="absolute -bottom-32 left-[-8%] h-[30rem] w-[30rem] rounded-full bg-[#003366]/08 blur-[112px]" />
        <div className="absolute top-[35%] left-[6%] h-[22rem] w-[22rem] rounded-full bg-emerald-500/08 blur-[96px]" />
      </div>
      <div className="relative z-10 w-full max-w-lg">
        <AdminLoginForm />
      </div>
      <footer className="mt-12 flex flex-col items-center gap-2 text-center">
        <p className="text-xs font-semibold tracking-wider text-slate-600">آروب سورية للتأمين</p>
        <p className="text-xs text-slate-600">جميع الحقوق محفوظة © {new Date().getFullYear()}</p>
      </footer>
    </main>
  )
}
