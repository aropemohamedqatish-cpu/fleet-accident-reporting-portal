'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { updateStatusAction } from '@/app/admin/dashboard/detail-actions'
import { STATUS_LABELS } from '@/lib/admin-claims'

export function StatusUpdater({ id, current }: { id: string; current: string }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [status, setStatus] = useState(current)
  const [notice, setNotice] = useState<string | null>(null)

  function save() {
    setNotice(null)
    startTransition(async () => {
      const ok = await updateStatusAction(id, status)
      if (ok) {
        setNotice('تم تحديث حالة البلاغ بنجاح.')
        router.refresh()
      } else {
        setNotice('تعذّر تحديث الحالة. يرجى المحاولة لاحقاً.')
      }
    })
  }

  return (
    <section aria-label="تغيير الحالة" className="rounded-xl border border-slate-200 p-4">
      <h3 className="mb-3 text-sm font-bold text-slate-900">تحديث حالة المعالجة</h3>
      <div className="flex gap-2">
        <Select value={status} onValueChange={setStatus} disabled={pending}>
          <SelectTrigger className="h-11 flex-1 border-slate-300">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="SUBMITTED">{STATUS_LABELS.SUBMITTED}</SelectItem>
            <SelectItem value="UNDER_REVIEW">{STATUS_LABELS.UNDER_REVIEW}</SelectItem>
            <SelectItem value="SENT_TO_INSURER">{STATUS_LABELS.SENT_TO_INSURER}</SelectItem>
            <SelectItem value="CLOSED">{STATUS_LABELS.CLOSED}</SelectItem>
          </SelectContent>
        </Select>
        <Button type="button" onClick={save} disabled={pending || status === current} className="h-11 bg-[#003366] hover:bg-[#00264d]">
          {pending && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
          حفظ
        </Button>
      </div>
      {notice && <p className="mt-2 text-xs font-medium text-[#003366]" role="status">{notice}</p>}
    </section>
  )
}
