import { AlertTriangle, CheckCircle2, Clock3, Send } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { STATUS_LABELS } from '@/lib/admin-claims'

export function StatusBadge({ status }: { status: string }) {
  if (status === 'SUBMITTED') {
    return (
      <Badge variant="outline" className="gap-1 border-blue-200 bg-blue-50 text-blue-800">
        <Clock3 className="size-3" aria-hidden="true" />
        {STATUS_LABELS.SUBMITTED}
      </Badge>
    )
  }
  if (status === 'UNDER_REVIEW') {
    return (
      <Badge variant="outline" className="gap-1 border-amber-200 bg-amber-50 text-amber-800">
        <AlertTriangle className="size-3" aria-hidden="true" />
        {STATUS_LABELS.UNDER_REVIEW}
      </Badge>
    )
  }
  if (status === 'SENT_TO_INSURER') {
    return (
      <Badge variant="outline" className="gap-1 border-[#003366]/20 bg-[#003366]/10 text-[#003366] font-semibold">
        <Send className="size-3" aria-hidden="true" />
        {STATUS_LABELS.SENT_TO_INSURER}
      </Badge>
    )
  }
  if (status === 'CLOSED') {
    return (
      <Badge variant="outline" className="gap-1 border-emerald-200 bg-emerald-50 text-emerald-800 font-semibold">
        <CheckCircle2 className="size-3" aria-hidden="true" />
        {STATUS_LABELS.CLOSED}
      </Badge>
    )
  }
  return <Badge variant="outline" className="text-slate-700">{status}</Badge>
}
