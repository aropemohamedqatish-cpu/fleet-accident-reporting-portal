import Image from 'next/image'
import Link from 'next/link'
import { Car, LayoutDashboard, LogOut } from 'lucide-react'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { getSession } from '@/lib/auth'
import { logoutAction } from './actions'

export default async function DashboardLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const session = await getSession()
  if (!session) redirect('/login')

  const roleLabel = session.role === 'ADMIN' ? 'مدير النظام' : 'موظف مطالبات'

  return (
    <div className="flex min-h-dvh bg-[#f4f6fa] text-slate-900" dir="rtl">
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col bg-[#07182d] text-slate-200 md:flex xl:w-72">
        <div className="flex h-[76px] items-center justify-center border-b border-white/10 bg-white px-4">
          <Image src="/images/arope-logo.png" alt="آروب سورية" width={180} height={58} className="h-10 w-auto" />
        </div>
        <div className="px-5 pb-2 pt-6 text-[11px] font-semibold tracking-wider text-slate-500">القائمة الرئيسية</div>
        <nav aria-label="التنقل الرئيسي" className="flex-1 space-y-2 px-3">
          <Link
            href="/dashboard"
            className="flex items-center gap-3 rounded-xl border border-blue-400/20 bg-blue-500/15 px-3 py-3 font-medium text-white shadow-sm transition-colors hover:bg-blue-500/20"
          >
            <LayoutDashboard className="size-5" aria-hidden="true" />
            البلاغات
          </Link>
          <Link
            href="/dashboard/vehicles"
            className="flex items-center gap-3 rounded-xl px-3 py-3 text-slate-300 transition-colors hover:bg-white/5 hover:text-white"
          >
            <Car className="size-5" aria-hidden="true" />
            المركبات
          </Link>
        </nav>
        <div className="border-t border-white/10 p-4">
          <div className="mb-4 rounded-xl border border-white/10 bg-white/5 p-3">
            <p className="truncate text-sm font-semibold text-white">{session.name}</p>
            <p className="mt-1 truncate text-xs text-slate-400" dir="ltr">{session.email}</p>
            <p className="mt-2 text-xs text-slate-500">{roleLabel}</p>
          </div>
          <form action={logoutAction}>
            <Button
              type="submit"
              variant="outline"
              className="h-11 w-full justify-start gap-2 border-white/10 bg-transparent text-slate-200 hover:bg-white/5 hover:text-white"
            >
              <LogOut className="size-4" aria-hidden="true" />
              تسجيل الخروج
            </Button>
          </form>
        </div>
      </aside>

      <main className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/95 shadow-sm backdrop-blur">
          <div className="flex min-h-[76px] items-center justify-between gap-4 px-4 sm:px-6 xl:px-9">
            <div>
              <p className="text-xs font-medium text-slate-500">آروب سورية للتأمين</p>
              <h1 className="mt-0.5 text-lg font-bold text-slate-900 sm:text-xl">لوحة تحكم المطالبات</h1>
            </div>
            <div className="flex items-center gap-3">
              <span className="hidden max-w-56 truncate text-sm text-slate-600 sm:block">{session.name}</span>
              <form action={logoutAction} className="md:hidden">
                <Button type="submit" variant="outline" size="icon" aria-label="تسجيل الخروج">
                  <LogOut className="size-4" aria-hidden="true" />
                </Button>
              </form>
            </div>
          </div>
          <nav aria-label="التنقل الرئيسي" className="flex gap-2 overflow-x-auto border-t border-slate-100 px-4 py-2 md:hidden">
            <Link href="/dashboard" className="inline-flex min-h-10 shrink-0 items-center gap-2 rounded-lg bg-blue-50 px-3 text-sm font-semibold text-[#003366]">
              <LayoutDashboard className="size-4" aria-hidden="true" />
              البلاغات
            </Link>
            <Link href="/dashboard/vehicles" className="inline-flex min-h-10 shrink-0 items-center gap-2 rounded-lg px-3 text-sm font-medium text-slate-600 hover:bg-slate-100">
              <Car className="size-4" aria-hidden="true" />
              المركبات
            </Link>
          </nav>
        </header>
        <div className="flex-1 overflow-auto p-4 sm:p-6 xl:p-9">{children}</div>
      </main>
    </div>
  )
}
