'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { updateStatusAction } from '@/app/admin/(console)/dashboard/detail-actions'
import { INCIDENT_STATUSES, isIncidentStatus, STATUS_META } from '@/lib/admin-claims'

export function StatusUpdater({ id, current }: { id: string; current: string }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [status, setStatus] = useState(isIncidentStatus(current) ? current : '')
  const [notice, setNotice] = useState<string | null>(null)
  const currentIsKnown = isIncidentStatus(current)

  function save() {
    setNotice(null)
    startTransition(async () => {
      try {
        const result = await updateStatusAction(id, status)
        if (result.success) {
          setNotice('تم تحديث حالة البلاغ بنجاح.')
          router.refresh()
        } else {
          setNotice(result.error)
        }
      } catch (error) {
        console.error('Status update action could not be completed.', error)
        setNotice('تعذّر الاتصال بالخادم لحفظ الحالة. تحقق من الاتصال ثم أعد المحاولة.')
      }
    })
  }

  return (
    <section aria-label="تغيير الحالة" className="rounded-xl border border-slate-200 p-4">
      <h3 className="mb-3 text-sm font-bold text-slate-900">تحديث حالة المعالجة</h3>
      <div className="flex gap-2">
        <select
          aria-label="الحالة الجديدة للبلاغ"
          value={status}
          onChange={(event) => setStatus(event.target.value)}
          disabled={pending}
          dir="rtl"
          className="h-11 min-w-0 flex-1 rounded-xl border-[1.5px] border-slate-300 bg-white px-4 text-right text-sm font-bold text-slate-950 outline-none transition focus-visible:border-[#003366] focus-visible:ring-4 focus-visible:ring-[#003366]/15 disabled:cursor-not-allowed disabled:bg-slate-100"
        >
          <option value="" disabled>اختر الحالة</option>
          {INCIDENT_STATUSES.map((incidentStatus) => (
            <option key={incidentStatus} value={incidentStatus}>
              {STATUS_META[incidentStatus].label}
            </option>
          ))}
        </select>
        <Button type="button" onClick={save} disabled={pending || !isIncidentStatus(status) || status === current} className="h-11 bg-[#003366] hover:bg-[#00264d]">
          {pending && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
          حفظ
        </Button>
      </div>
      {!currentIsKnown && (
        <p className="mt-3 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs font-bold leading-5 text-amber-950" role="status">
          الحالة الحالية غير معروفة. اختر حالة جديدة من القائمة لتحديثها.
        </p>
      )}
      {notice && (
        <p
          className={`mt-2 text-xs font-bold ${notice.startsWith('تم ') ? 'text-emerald-800' : 'text-red-800'}`}
          role="status"
          aria-live="polite"
        >
          {notice}
        </p>
      )}
    </section>
  )
}
