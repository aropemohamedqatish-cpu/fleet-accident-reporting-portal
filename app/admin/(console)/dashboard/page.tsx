import { Suspense } from 'react'
import { ShieldCheck } from 'lucide-react'
import { RefreshButton } from '@/components/dashboard/refresh-button'
import { ClaimsFilters } from '@/components/admin/claims-filters'
import { ClaimsTable } from '@/components/admin/claims-table'
import { OverviewPanel } from '@/components/admin/overview-panel'
import { StatsGrid } from '@/components/admin/stats-grid'
import { PageHeader } from '@/components/shell/page-header'
import { DEFAULT_FILTERS, type AdminFilters } from '@/lib/admin-claims'
import { getDashboardStats, getIncidents } from '@/lib/admin-queries'

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
  const filters = parseFilters(await searchParams)
  const [stats, rows] = await Promise.all([getDashboardStats(), getIncidents(filters)])

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

      <ClaimsTable rows={rows} total={stats.total} />
    </div>
  )
}
