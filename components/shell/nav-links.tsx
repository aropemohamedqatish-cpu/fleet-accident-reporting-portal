'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, UsersRound } from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { href: '/admin/dashboard', label: 'الحوادث', hint: 'البلاغات الواردة وحالات المعالجة', icon: LayoutDashboard },
  { href: '/admin/users', label: 'المستخدمون', hint: 'إدارة حسابات الموظفين', icon: UsersRound, adminOnly: true },
] as const

function useActive() {
  const pathname = usePathname()
  return (href: string) => pathname === href || pathname.startsWith(`${href}/`)
}

export function SidebarNav({ role }: { role: 'ADMIN' | 'AGENT' }) {
  const isActive = useActive()
  return (
    <nav aria-label="التنقل الرئيسي" className="flex flex-col gap-1.5 px-4">
      {NAV_ITEMS.filter((item) => !('adminOnly' in item) || role === 'ADMIN').map(({ href, label, hint, icon: Icon }) => {
        const active = isActive(href)
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'group relative flex items-center gap-3.5 rounded-2xl px-4 py-3.5 outline-none transition-all duration-200 focus-visible:ring-4 focus-visible:ring-white/30',
              active
                ? 'bg-white/14 text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.16)]'
                : 'text-[#dbe6f7] hover:bg-white/8 hover:text-white',
            )}
          >
            {active && <span aria-hidden="true" className="absolute inset-y-3 start-0 w-1 rounded-full bg-[#7fb0ff]" />}
            <span
              className={cn(
                'flex size-10 shrink-0 items-center justify-center rounded-xl transition-colors',
                active ? 'bg-white text-brand' : 'bg-white/10 text-white group-hover:bg-white/18',
              )}
            >
              <Icon className="size-5" aria-hidden="true" />
            </span>
            <span className="flex min-w-0 flex-col">
              <span className="text-[15px] font-bold">{label}</span>
              <span className="truncate text-xs font-medium text-[#b4c8e8]">{hint}</span>
            </span>
          </Link>
        )
      })}
    </nav>
  )
}

export function TabBarNav({ role }: { role: 'ADMIN' | 'AGENT' }) {
  const isActive = useActive()
  const items = NAV_ITEMS.filter((item) => !('adminOnly' in item) || role === 'ADMIN')
  return (
    <nav
      aria-label="التنقل الرئيسي"
      className="fixed inset-x-4 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-40 mx-auto flex max-w-md gap-1.5 rounded-[1.75rem] bg-brand-strong p-1.5 shadow-float lg:hidden"
    >
      {items.map(({ href, label, icon: Icon }) => {
        const active = isActive(href)
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'flex min-h-14 flex-1 items-center justify-center gap-2.5 rounded-[1.4rem] text-[15px] font-bold outline-none transition-all duration-200 focus-visible:ring-4 focus-visible:ring-white/40',
              active ? 'bg-white text-brand shadow-sm' : 'text-[#dbe6f7] active:bg-white/10',
            )}
          >
            <Icon className="size-5" aria-hidden="true" />
            {label}
          </Link>
        )
      })}
    </nav>
  )
}
