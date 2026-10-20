import { AlertTriangle, CheckCircle2, Clock3, Send, type LucideIcon } from 'lucide-react'
import { STATUS_META, isIncidentStatus, type IncidentStatus, type StatusTone } from '@/lib/admin-claims'
import { cn } from '@/lib/utils'

const TONE_CLASSES: Record<StatusTone, string> = {
  blue: 'border-[#9db9f5] bg-[#e4edff] text-[#103a9e]',
  amber: 'border-[#f0c46a] bg-warning-soft text-[#7a4300]',
  indigo: 'border-[#b9aef0] bg-[#ece8ff] text-[#3b2c99]',
  green: 'border-[#8fd6b0] bg-success-soft text-[#0a5a33]',
}

const ICONS: Record<IncidentStatus, LucideIcon> = {
  SUBMITTED: Clock3,
  UNDER_REVIEW: AlertTriangle,
  SENT_TO_INSURER: Send,
  CLOSED: CheckCircle2,
}

/** Status is always conveyed by icon + text, never by colour alone. */
export function StatusBadge({ status, className }: { status: string; className?: string }) {
  if (!isIncidentStatus(status)) {
    return (
      <span className={cn('inline-flex h-7 items-center rounded-full border border-input bg-white px-3 text-xs font-bold text-ink', className)}>
        {status}
      </span>
    )
  }
  const meta = STATUS_META[status]
  const Icon = ICONS[status]
  return (
    <span
      className={cn('inline-flex h-7 items-center gap-1.5 rounded-full border px-3 text-xs font-bold whitespace-nowrap', TONE_CLASSES[meta.tone], className)}
    >
      <Icon className="size-3.5" aria-hidden="true" />
      {meta.label}
    </span>
  )
}
