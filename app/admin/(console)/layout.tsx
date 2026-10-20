import { redirect } from 'next/navigation'
import { ShieldCheck } from 'lucide-react'
import { Logo } from '@/components/brand/logo'
import { LogoutButton } from '@/components/shell/logout-button'
import { SidebarNav, TabBarNav } from '@/components/shell/nav-links'
import { getSession } from '@/lib/auth'
import { initialsOf } from '@/lib/admin-claims'
import { BRAND, formatLongDate } from '@/lib/brand'
import { adminLogoutAction } from '../actions'

export const dynamic = 'force-dynamic'

const ROLE_LABELS = { ADMIN: 'مدير النظام', AGENT: 'موظف حوادث' } as const

export default async function ConsoleLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const session = await getSession()
  if (!session) redirect('/admin/login')

  const roleLabel = ROLE_LABELS[session.role]
  const initials = initialsOf(session.name)
  const today = formatLongDate(new Date())

  return (
    <div className="relative min-h-dvh lg:flex lg:gap-6 lg:p-5">
      {/* ── Desktop sidebar: floats on the shared canvas, no seam ─────────── */}
      <aside className="sticky top-5 hidden h-[calc(100dvh-2.5rem)] w-[19rem] shrink-0 flex-col overflow-hidden rounded-[2rem] bg-[linear-gradient(165deg,#0b3a7a_0%,#00264d_48%,#04172f_100%)] text-white shadow-float lg:flex">
        <div aria-hidden="true" className="pointer-events-none absolute -top-24 -end-24 size-72 animate-float rounded-full bg-[#2f6fd0]/40 blur-3xl" />
        <div aria-hidden="true" className="pointer-events-none absolute -bottom-28 -start-20 size-72 animate-float-slow rounded-full bg-[#0f7a46]/25 blur-3xl" />

        <div className="relative px-6 pt-7 pb-6">
          <Logo plated priority className="h-9" />
          <p className="mt-4 text-[13px] font-semibold text-[#b4c8e8]">{BRAND.consoleProduct}</p>
        </div>

        <p className="relative px-8 pb-3 text-[11px] font-bold tracking-wider text-[#9fb6d9]">القائمة الرئيسية</p>
        <div className="relative flex-1 overflow-y-auto">
          <SidebarNav />
        </div>

        <div className="relative space-y-3 p-4">
          <div className="flex items-center gap-2.5 rounded-2xl border border-white/12 bg-white/8 px-4 py-3">
            <span aria-hidden="true" className="size-2.5 shrink-0 animate-pulse-ring rounded-full bg-[#34d399]" />
            <div className="min-w-0">
              <p className="text-[13px] font-bold">النظام يعمل بكفاءة</p>
              <p className="truncate text-xs font-medium text-[#b4c8e8]">{today}</p>
            </div>
          </div>

          <div className="rounded-2xl border border-white/12 bg-white/8 p-4">
            <div className="flex items-center gap-3">
              <span
                aria-hidden="true"
                className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-white text-lg font-bold text-brand"
              >
                {initials}
              </span>
              <div className="min-w-0">
                <p className="truncate text-[15px] font-bold">{session.name}</p>
                <p className="mt-0.5 flex items-center gap-1.5 text-xs font-semibold text-[#b4c8e8]">
                  <ShieldCheck className="size-3.5 text-[#34d399]" aria-hidden="true" />
                  {roleLabel}
                </p>
              </div>
            </div>
            <p dir="ltr" className="mt-3 truncate text-start text-xs font-medium text-[#b4c8e8]">
              {session.email}
            </p>
            <form action={adminLogoutAction} className="mt-3">
              <LogoutButton />
            </form>
          </div>
        </div>
      </aside>

      {/* ── Content column ────────────────────────────────────────────────── */}
      <div className="min-w-0 flex-1">
        <div className="glass sticky top-0 z-30 flex items-center justify-between gap-3 border-x-0 border-t-0 px-4 py-3 lg:hidden">
          <Logo className="h-8" />
          <div className="flex items-center gap-2.5">
            <span className="flex size-10 items-center justify-center rounded-xl bg-brand text-sm font-bold text-white" aria-hidden="true">
              {initials}
            </span>
            <form action={adminLogoutAction}>
              <LogoutButton variant="icon" />
            </form>
          </div>
        </div>

        <main className="mx-auto w-full max-w-[1500px] px-4 pt-6 pb-32 sm:px-6 lg:px-3 lg:pt-3 lg:pb-12">{children}</main>
      </div>

      <TabBarNav />
    </div>
  )
}
