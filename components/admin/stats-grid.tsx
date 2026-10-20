import { BellRing, CheckCircle2, Clock3, FileText, Minus, TrendingDown, TrendingUp } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { DashboardStats, Delta } from '@/lib/admin-claims'

type TrendDirection = 'up' | 'down' | 'neutral'

const TONES: Record<string, { bg: string; text: string; border: string }> = {
  slate: { bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-200' },
  primary: { bg: 'bg-[#003366]/10', text: 'text-[#003366]', border: 'border-[#003366]/20' },
  amber: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  emerald: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  rose: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
}

export function StatsGrid({ stats }: { stats: DashboardStats }) {
  return (
    <section aria-label="مؤشرات الحوادث" className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard
        title="إجمالي البلاغات"
        value={stats.total}
        icon={FileText}
        tone="primary"
        detail="جميع البلاغات المسجلة في النظام"
        delta={stats.totalDelta}
      />
      <StatCard
        title="قيد المعالجة"
        value={stats.pending}
        icon={Clock3}
        tone="amber"
        detail="بلاغات جديدة وقيد المراجعة بانتظار الفرز"
        delta={stats.pendingDelta}
      />
      <StatCard
        title="تمت الإحالة"
        value={stats.referred}
        icon={CheckCircle2}
        tone="emerald"
        detail="مُحالة لشركة التأمين أو مغلقة"
        delta={stats.referredDelta}
      />
      <StatCard
        title="مشاكل الإشعارات"
        value={stats.missingMedia}
        icon={BellRing}
        tone="rose"
        detail="بلاغات بدون أي مرفقات تحتاج مراجعة عاجلة"
        delta={stats.missingMediaDelta}
      />
    </section>
  )
}

function StatCard({
  title,
  value,
  icon: Icon,
  tone,
  detail,
  delta,
}: {
  title: string
  value: number
  icon: typeof FileText
  tone: keyof typeof TONES
  detail: string
  delta: Delta
}) {
  const { bg, text, border } = TONES[tone]
  const trend =
    delta.direction === 'up'
      ? { icon: TrendingUp, color: 'text-emerald-600', label: 'تصاعد مقارنة بالفترة السابقة' }
      : delta.direction === 'down'
        ? { icon: TrendingDown, color: 'text-rose-600', label: 'انخفاض مقارنة بالفترة السابقة' }
        : { icon: Minus, color: 'text-slate-600', label: 'بدون تغيير ملحوظ' }

  return (
    <Card className="border-0 bg-white rounded-[20px] border border-slate-100 shadow-sm">
      <CardHeader className="flex flex-row items-start justify-between pb-3">
        <div className="space-y-1">
          <CardTitle className="text-sm font-semibold {text}">{title}</CardTitle>
          <p className="text-3xl font-bold tabular-nums tracking-tight text-slate-950">{value}</p>
          <div className="flex items-center gap-1.5 pt-1.5">
            <trend.icon className={`size-3.5 shrink-0 ${trend.color}`} aria-hidden="true" />
            <span className={`text-xs font-semibold ${trend.color}`}>{delta.value}%</span>
            <span className="text-xs text-slate-600">{trend.label}</span>
          </div>
        </div>
        <span className={`flex size-10 items-center justify-center rounded-xl border ${bg} ${text} ${border}`}>
          <Icon className="size-5" aria-hidden="true" />
        </span>
      </CardHeader>
      <CardContent>
        <p className="text-xs text-slate-600">{detail}</p>
      </CardContent>
    </Card>
  )
}
