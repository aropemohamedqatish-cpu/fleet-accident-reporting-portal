import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { ShieldCheck } from 'lucide-react'
import { RefreshButton } from '@/components/dashboard/refresh-button'
import { ClaimsFilters } from '@/components/admin/claims-filters'
import { ClaimsTable } from '@/components/admin/claims-table'
import { OverviewPanel } from '@/components/admin/overview-panel'
import { StatsGrid } from '@/components/admin/stats-grid'
import { PageHeader } from '@/components/shell/page-header'
import { DEFAULT_FILTERS, type AdminFilters } from '@/lib/admin-claims'
import { countIncidents, getDashboardStats, getIncidents, INCIDENTS_PAGE_SIZE } from '@/lib/admin-queries'

const VALID_STATUS = ['ALL', 'SUBMITTED', 'UNDER_REVIEW', 'SENT_TO_INSURER', 'CLOSED'] as const

function parseFilters(params: Record<string, string | string[] | undefined>): AdminFilters {
  const pick = (k: string) => {
    const v = params[k]
    return typeof v === 'string' ? v : ''
  }
  const status = pick('status')
  return {
    status: (VALID_STATUS as readonly string[]).includes(status) ? (status as AdminFilters['status']) : DEFAULT_FILTERS.status,
    from: pick('from').slice(0, 10),
    to: pick('to').slice(0, 10),
    search: pick('search').slice(0, 100),
  }
}

export default async function AdminDashboardPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams
  const filters = parseFilters(params)
  const rawPage = typeof params.page === 'string' ? Number(params.page) : 1
  const page = Number.isSafeInteger(rawPage) && rawPage > 0 ? rawPage : 1
  const [stats, filteredTotal] = await Promise.all([getDashboardStats(), countIncidents(filters)])
  const pageCount = Math.max(1, Math.ceil(filteredTotal / INCIDENTS_PAGE_SIZE))
  const currentPage = Math.min(page, pageCount)
  const rows = await getIncidents(filters, currentPage)
  if (page !== currentPage) {
    const normalizedQuery = new URLSearchParams()
    for (const [key, value] of Object.entries(params)) {
      if (key !== 'page' && typeof value === 'string' && value) normalizedQuery.set(key, value)
    }
    normalizedQuery.set('page', String(currentPage))
    redirect(`/admin/dashboard?${normalizedQuery.toString()}`)
  }
  const query = new URLSearchParams()
  for (const key of ['status', 'from', 'to', 'search']) {
    const value = params[key]
    if (typeof value === 'string' && value) query.set(key, value)
  }

  return (
    <div className="space-y-8">
      <PageHeader
        icon={ShieldCheck}
        eyebrow="مركز عمليات الحوادث — آروب سورية"
        title="لوحة التحكم التنفيذية للحوادث"
        description="راجع البلاغات الواردة، صَفّها حسب الأولوية، وعالج الحوادث بدقة وأمان من لوحة واحدة موحّدة."
        actions={
          <>
            <span className="hidden items-center gap-2.5 rounded-full border border-success/30 bg-success-soft px-4 py-2 text-sm font-bold text-success lg:inline-flex">
              <span aria-hidden="true" className="size-2.5 animate-pulse-ring rounded-full bg-success" />
              النظام يعمل
            </span>
            <RefreshButton />
          </>
        }
      />

      <StatsGrid stats={stats} />

      <OverviewPanel stats={stats} />

      <Suspense fallback={<div className="surface skeleton h-44" aria-label="جارٍ تحميل الفلاتر" />}>
        <ClaimsFilters />
      </Suspense>

      <ClaimsTable
        rows={rows}
        total={stats.total}
        filteredTotal={filteredTotal}
        currentPage={currentPage}
        pageCount={pageCount}
        filterQuery={query.toString()}
      />
    </div>
  )
}
