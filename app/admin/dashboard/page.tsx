import { Suspense } from 'react'
import { ShieldCheck } from 'lucide-react'
import { RefreshButton } from '@/components/dashboard/refresh-button'
import { ClaimsFilters } from '@/components/admin/claims-filters'
import { ClaimsTable } from '@/components/admin/claims-table'
import { StatsGrid } from '@/components/admin/stats-grid'
import { DEFAULT_FILTERS, type AdminFilters } from '@/lib/admin-claims'
import { getDashboardStats, getIncidents } from '@/lib/admin-queries'

const VALID_STATUS = ['ALL', 'SUBMITTED', 'UNDER_REVIEW', 'SENT_TO_INSURER', 'CLOSED'] as const
const VALID_PREFIX = ['ALL', '12', '61'] as const

function parseFilters(params: Record<string, string | string[] | undefined>): AdminFilters {
  const pick = (k: string) => {
    const v = params[k]
    return typeof v === 'string' ? v : ''
  }
  const status = pick('status')
  const prefix = pick('prefix')
  return {
    status: (VALID_STATUS as readonly string[]).includes(status) ? (status as AdminFilters['status']) : DEFAULT_FILTERS.status,
    prefix: (VALID_PREFIX as readonly string[]).includes(prefix) ? (prefix as AdminFilters['prefix']) : DEFAULT_FILTERS.prefix,
    from: pick('from').slice(0, 10),
    to: pick('to').slice(0, 10),
    search: pick('search').slice(0, 100),
  }
}

export default async function AdminDashboardPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const filters = parseFilters(await searchParams)
  const [stats, rows] = await Promise.all([getDashboardStats(), getIncidents(filters)])

  return (
    <div className="mx-auto w-full max-w-[1600px] bg-[#f8fafc] space-y-10 pb-16" dir="rtl">
      <section className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <div className="inline-flex items-center gap-2 rounded-xl border border-[#003366]/15 bg-[#003366]/5 px-3 py-1 text-xs font-semibold text-[#003366]">
            <ShieldCheck className="size-3.5" aria-hidden="true" />
            مركز عمليات المطالبات — آروب سورية
          </div>
          <h1 className="mt-4 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">لوحة التحكم التنفيذية للمطالبات</h1>
          <p className="mt-2 text-sm text-slate-600 leading-relaxed">
            راجع البلاغات الواردة، صَفّها حسب الأولوية، وعالج المطالبات بدقة وأمان من لوحة واحدة موحّدة.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <span className="hidden items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700 lg:inline-flex">
            <span className="size-2 rounded-full bg-emerald-500" />
            النظام يعمل
          </span>
          <RefreshButton />
        </div>
      </section>

      <StatsGrid stats={stats} />

      <Suspense fallback={<div className="rounded-[20px] bg-white p-5 text-sm text-slate-600 border border-slate-100 shadow-sm">جارٍ تحميل الفلاتر...</div>}>
        <ClaimsFilters />
      </Suspense>

      <ClaimsTable rows={rows} total={stats.total} />
    </div>
  )
}
