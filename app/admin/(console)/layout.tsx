import { redirect } from 'next/navigation'
import { CalendarDays, ShieldCheck } from 'lucide-react'
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
      <aside className="sticky top-5 hidden h-[calc(100dvh-2.5rem)] w-[19rem] shrink-0 flex-col overflow-hidden rounded-[2rem] border border-white/10 bg-[linear-gradient(155deg,#0b3a7a_0%,#06305d_42%,#04172f_100%)] text-white shadow-float lg:flex">
        <div aria-hidden="true" className="pointer-events-none absolute -top-24 -end-24 size-72 animate-float rounded-full bg-[#4b8be8]/30 blur-3xl" />
        <div aria-hidden="true" className="pointer-events-none absolute -bottom-28 -start-20 size-72 animate-float-slow rounded-full bg-[#0f7a46]/20 blur-3xl" />

        <div className="relative px-5 pt-6 pb-5">
          <div className="flex justify-center rounded-[1.4rem] border border-white/70 bg-white px-4 py-3.5 shadow-[0_12px_35px_-18px_rgba(0,0,0,0.8)]">
            <Logo priority className="h-12" />
          </div>
          <div className="mt-5 flex items-center justify-between gap-3 px-1">
            <div>
              <p className="text-sm font-extrabold tracking-wide text-white">{BRAND.consoleProduct}</p>
              <p className="mt-1 text-xs font-medium text-[#b4c8e8]">بوابة متابعة أسطول المركبات</p>
            </div>
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/10 text-[#c9dcff]">
              <ShieldCheck className="size-5" aria-hidden="true" />
            </span>
          </div>
        </div>

        <div className="relative mx-5 mb-3 flex items-center gap-3 px-1">
          <p className="text-[11px] font-bold tracking-wider text-[#a9bfdf]">القائمة الرئيسية</p>
          <span aria-hidden="true" className="h-px flex-1 bg-white/15" />
        </div>
        <div className="relative flex-1 overflow-y-auto">
          <SidebarNav role={session.role} />
        </div>

        <div className="relative space-y-3 p-4">
          <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-950/20 px-4 py-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-white/10 text-[#c9dcff]">
              <CalendarDays className="size-4" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-[#b4c8e8]">تاريخ اليوم</p>
              <p className="mt-0.5 truncate text-[13px] font-bold text-white">{today}</p>
            </div>
          </div>

          <div className="rounded-2xl border border-white/15 bg-white/[0.07] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
            <div className="flex items-center gap-3">
              <span
                aria-hidden="true"
                className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-[linear-gradient(145deg,#ffffff_0%,#dce9fb_100%)] text-lg font-extrabold text-brand shadow-sm ring-1 ring-white/50"
              >
                {initials}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-extrabold text-white">{session.name}</p>
                <span className="mt-1 inline-flex items-center gap-1.5 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-2 py-0.5 text-[11px] font-bold text-emerald-100">
                  <ShieldCheck className="size-3 text-emerald-300" aria-hidden="true" />
                  {roleLabel}
                </span>
              </div>
            </div>
            <p dir="ltr" className="mt-3 truncate border-t border-white/10 pt-3 text-start text-xs font-medium text-[#c2d2e9]">
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
          <Logo className="h-9" />
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

      <TabBarNav role={session.role} />
    </div>
  )
}
