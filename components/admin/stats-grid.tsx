import { CheckCircle2, Clock3, FileText, Minus, TrendingDown, TrendingUp, type LucideIcon } from 'lucide-react'
import { AnimatedNumber } from '@/components/ui/animated-number'
import type { DashboardStats, Delta } from '@/lib/admin-claims'
import { cn } from '@/lib/utils'

type Tone = 'primary' | 'amber' | 'emerald'
/** Which direction of change is good news for this metric. */
type GoodWhen = 'up' | 'down' | 'none'

const TONES: Record<Tone, { accent: string; tile: string }> = {
  primary: { accent: 'from-[#003366] to-[#2f6fd0]', tile: 'bg-brand-soft text-brand' },
  amber: { accent: 'from-[#a35a00] to-[#f0a63a]', tile: 'bg-warning-soft text-warning' },
  emerald: { accent: 'from-[#0f7a46] to-[#34d399]', tile: 'bg-success-soft text-success' },
}

export function StatsGrid({ stats }: { stats: DashboardStats }) {
  return (
    <section aria-label="مؤشرات الحوادث" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      <StatCard
        index={0}
        title="إجمالي البلاغات"
        value={stats.total}
        icon={FileText}
        tone="primary"
        detail="البلاغات المسجلة خلال آخر 30 يوماً"
        delta={stats.totalDelta}
        goodWhen="none"
      />
      <StatCard
        index={1}
        title="قيد المعالجة"
        value={stats.pending}
        icon={Clock3}
        tone="amber"
        detail="بلاغات جديدة وقيد المراجعة بانتظار الفرز"
        delta={stats.pendingDelta}
        goodWhen="down"
      />
      <StatCard
        index={2}
        title="تمت الإحالة"
        value={stats.referred}
        icon={CheckCircle2}
        tone="emerald"
        detail="مُحالة لشركة التأمين أو مغلقة"
        delta={stats.referredDelta}
        goodWhen="up"
      />
    </section>
  )
}

function deltaPresentation(delta: Delta, goodWhen: GoodWhen) {
  const Icon = delta.direction === 'up' ? TrendingUp : delta.direction === 'down' ? TrendingDown : Minus
  const label =
    delta.direction === 'up' ? 'ارتفاع عن آخر 30 يوماً سابقة' : delta.direction === 'down' ? 'انخفاض عن آخر 30 يوماً سابقة' : 'مستقر عن الفترة السابقة'
  let chip = 'bg-muted text-ink-soft'
  if (delta.direction !== 'neutral') {
    if (goodWhen === 'none') chip = 'bg-brand-soft text-brand'
    else chip = delta.direction === goodWhen ? 'bg-success-soft text-success' : 'bg-danger-soft text-destructive'
  }
  return { Icon, label, chip }
}

function StatCard({
  index,
  title,
  value,
  icon: Icon,
  tone,
  detail,
  delta,
  goodWhen,
}: {
  index: number
  title: string
  value: number
  icon: LucideIcon
  tone: Tone
  detail: string
  delta: Delta
  goodWhen: GoodWhen
}) {
  const { accent, tile } = TONES[tone]
  const { Icon: TrendIcon, label, chip } = deltaPresentation(delta, goodWhen)

  return (
    <article
      className="surface lift animate-fade-up relative overflow-hidden p-5"
      style={{ animationDelay: `${index * 70}ms` }}
    >
      <span aria-hidden="true" className={cn('absolute inset-x-0 top-0 h-1.5 bg-linear-to-l', accent)} />
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-[15px] font-bold text-ink-soft">{title}</h2>
          <p className="mt-2 text-4xl font-bold tracking-tight text-ink tabular-nums">
            <AnimatedNumber value={value} />
          </p>
        </div>
        <span className={cn('flex size-12 shrink-0 items-center justify-center rounded-2xl', tile)}>
          <Icon className="size-6" aria-hidden="true" />
        </span>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold tabular-nums', chip)}>
          <TrendIcon className="size-3.5" aria-hidden="true" />
          {delta.value}%
        </span>
        <span className="text-xs font-semibold text-ink-soft">{label}</span>
      </div>
      <p className="mt-3 border-t border-border/80 pt-3 text-sm leading-6 text-muted-foreground">{detail}</p>
    </article>
  )
}
