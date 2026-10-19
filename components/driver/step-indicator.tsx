import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

const STEPS = ['المركبة', 'الموقع', 'الوسائط', 'البيانات']

export function StepIndicator({ current }: { current: number }) {
  return (
    <nav aria-label="مراحل البلاغ" className="px-5 pt-5 pb-2">
      <p className="mb-3 text-sm text-muted-foreground">
        الخطوة <span className="font-semibold text-foreground">{current}</span> من {STEPS.length}
      </p>
      <ol className="flex items-center gap-2">
        {STEPS.map((label, i) => {
          const n = i + 1
          const done = n < current
          const active = n === current
          return (
            <li key={label} className="flex flex-1 flex-col gap-1.5" aria-current={active ? 'step' : undefined}>
              <div className={cn('h-1.5 rounded-full bg-border transition-colors', (done || active) && 'bg-primary')} />
              <span
                className={cn(
                  'flex items-center gap-1 text-xs text-muted-foreground',
                  active && 'font-semibold text-primary',
                  done && 'text-foreground',
                )}
              >
                {done && <Check className="size-3" aria-hidden="true" />}
                {label}
              </span>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
