import { Activity, AlertTriangle, CheckCircle2, Clock3, FileText, Plus } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { RefreshButton } from '@/components/dashboard/refresh-button'
import { prisma } from '@/lib/prisma'

const STATUS_LABELS: Record<string, string> = {
  SUBMITTED: 'جديد',
  UNDER_REVIEW: 'قيد المراجعة',
  CLOSED: 'مغلق',
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat('ar-SY', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Damascus',
  }).format(date)
}

export default async function DashboardPage() {
  const [totalAccidents, newAccidents, reviewingAccidents, closedAccidents, accidents] = await Promise.all([
    prisma.accident.count(),
    prisma.accident.count({ where: { status: 'SUBMITTED' } }),
    prisma.accident.count({ where: { status: 'UNDER_REVIEW' } }),
    prisma.accident.count({ where: { status: 'CLOSED' } }),
    prisma.accident.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        reporterName: true,
        status: true,
        createdAt: true,
        vehicle: { select: { plateNumber: true } },
        _count: { select: { media: true } },
      },
    }),
  ])

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-7">
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold text-[#003366]">مركز العمليات</p>
          <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">نظرة عامة على المطالبات</h2>
          <p className="mt-2 text-sm text-slate-600">تابع البلاغات الواردة وحالة معالجتها من مكان واحد.</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden items-center gap-2 rounded-full border border-green-200 bg-green-50 px-3 py-2 text-xs font-medium text-green-800 lg:inline-flex">
            <span className="size-2 rounded-full bg-green-500" />
            النظام يعمل
          </span>
          <RefreshButton />
        </div>
      </section>

      <section aria-label="إحصائيات البلاغات" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="إجمالي البلاغات" value={totalAccidents} icon={FileText} tone="slate" detail="جميع البلاغات المسجلة" />
        <StatCard title="بلاغات جديدة" value={newAccidents} icon={Plus} tone="blue" detail="بانتظار بدء المعالجة" />
        <StatCard title="قيد المراجعة" value={reviewingAccidents} icon={Clock3} tone="amber" detail="تتم متابعتها حالياً" />
        <StatCard title="بلاغات مغلقة" value={closedAccidents} icon={CheckCircle2} tone="green" detail="اكتملت معالجتها" />
      </section>

      <Card className="overflow-hidden border-0 shadow-sm ring-1 ring-slate-200">
        <CardHeader className="flex flex-col gap-2 border-b border-slate-100 bg-white px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            <CardTitle className="text-lg font-bold text-slate-950">أحدث البلاغات</CardTitle>
            <p className="mt-1 text-sm text-slate-500">آخر البلاغات المسجلة في النظام</p>
          </div>
          <Badge variant="secondary" className="w-fit rounded-full px-3 py-1">
            {accidents.length} من {totalAccidents}
          </Badge>
        </CardHeader>
        <CardContent className="p-0">
          <Table className="min-w-[850px]">
            <TableHeader>
              <TableRow className="bg-slate-50/80 hover:bg-slate-50/80">
                <TableHead className="h-12 px-5 text-right text-xs font-semibold text-slate-500">رقم البلاغ</TableHead>
                <TableHead className="h-12 text-right text-xs font-semibold text-slate-500">المركبة</TableHead>
                <TableHead className="h-12 text-right text-xs font-semibold text-slate-500">اسم المبلّغ</TableHead>
                <TableHead className="h-12 text-right text-xs font-semibold text-slate-500">تاريخ البلاغ</TableHead>
                <TableHead className="h-12 text-right text-xs font-semibold text-slate-500">المرفقات</TableHead>
                <TableHead className="h-12 px-5 text-right text-xs font-semibold text-slate-500">الحالة</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {accidents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-16 text-center">
                  <div className="mx-auto flex max-w-sm flex-col items-center">
                    <span className="mb-3 flex size-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
                      <FileText className="size-5" aria-hidden="true" />
                    </span>
                    <span className="font-semibold text-slate-800">لا توجد بلاغات حتى الآن</span>
                    <span className="mt-1 text-sm text-slate-500">ستظهر البلاغات الجديدة هنا فور تسجيلها.</span>
                  </div>
                  </TableCell>
                </TableRow>
              ) : (
                accidents.map((accident) => (
                  <TableRow key={accident.id}>
                    <TableCell className="px-5">
                      <span className="rounded-md bg-slate-100 px-2 py-1 font-mono text-xs font-semibold text-slate-700" dir="ltr">
                        {accident.id.slice(0, 8).toUpperCase()}
                      </span>
                    </TableCell>
                    <TableCell><span className="font-mono font-semibold text-slate-800" dir="ltr">{accident.vehicle.plateNumber}</span></TableCell>
                    <TableCell className="font-medium text-slate-800">{accident.reporterName}</TableCell>
                    <TableCell className="whitespace-nowrap text-sm text-slate-600">{formatDate(accident.createdAt)}</TableCell>
                    <TableCell>
                      <span className="inline-flex items-center gap-2 text-sm text-slate-600">
                        <span className="size-1.5 rounded-full bg-slate-400" />
                        {accident._count.media} ملفات
                      </span>
                    </TableCell>
                    <TableCell className="px-5"><StatusBadge status={accident.status} /></TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

function StatCard({
  title,
  value,
  icon: Icon,
  tone,
  detail,
}: {
  title: string
  value: number
  icon: typeof FileText
  tone: 'slate' | 'blue' | 'amber' | 'green'
  detail: string
}) {
  const tones = {
    slate: 'bg-slate-100 text-slate-600',
    blue: 'bg-blue-100 text-blue-700',
    amber: 'bg-amber-100 text-amber-700',
    green: 'bg-green-100 text-green-700',
  }

  return (
    <Card className="border-0 bg-white shadow-sm ring-1 ring-slate-200/80">
      <CardHeader className="flex flex-row items-start justify-between pb-2">
        <div className="space-y-1">
          <CardTitle className="text-sm font-medium text-slate-600">{title}</CardTitle>
          <p className="text-3xl font-bold tabular-nums tracking-tight text-slate-950">{value}</p>
        </div>
        <span className={`flex size-10 items-center justify-center rounded-xl ${tones[tone]}`}>
          <Icon className="size-5" aria-hidden="true" />
        </span>
      </CardHeader>
      <CardContent><p className="text-xs text-slate-500">{detail}</p></CardContent>
    </Card>
  )
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'SUBMITTED') {
    return <Badge variant="outline" className="gap-1 border-blue-200 bg-blue-50 text-blue-800"><Clock3 className="size-3" aria-hidden="true" />جديد</Badge>
  }
  if (status === 'UNDER_REVIEW') {
    return <Badge variant="outline" className="gap-1 border-amber-200 bg-amber-50 text-amber-900"><AlertTriangle className="size-3" aria-hidden="true" />قيد المراجعة</Badge>
  }
  if (status === 'CLOSED') {
    return <Badge variant="outline" className="gap-1 border-green-200 bg-green-50 text-green-900"><CheckCircle2 className="size-3" aria-hidden="true" />مغلق</Badge>
  }
  return <Badge variant="outline">{status}</Badge>
}
