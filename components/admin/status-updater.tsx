'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, TriangleAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { updateStatusAction } from '@/app/admin/(console)/dashboard/detail-actions'
import { ALLOWED_STATUS_TRANSITIONS, canTransitionIncidentStatus, isIncidentStatus, requiresStatusTransitionConfirmation, STATUS_META } from '@/lib/admin-claims'

export function StatusUpdater({ id, current }: { id: string; current: string }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [status, setStatus] = useState(isIncidentStatus(current) ? current : '')
  const [notice, setNotice] = useState<string | null>(null)
  const [confirming, setConfirming] = useState(false)
  const currentIsKnown = isIncidentStatus(current)
  const allowedNextStatuses = currentIsKnown ? ALLOWED_STATUS_TRANSITIONS[current] : []

  function save() {
    if (!canTransitionIncidentStatus(current, status)) return
    if (requiresStatusTransitionConfirmation(status)) {
      setConfirming(true)
      return
    }
    submit()
  }

  function submit() {
    setConfirming(false)
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
          onChange={(event) => {
            setStatus(event.target.value)
            setConfirming(false)
          }}
          disabled={pending}
          dir="rtl"
          className="h-11 min-w-0 flex-1 rounded-xl border-[1.5px] border-slate-300 bg-white px-4 text-right text-sm font-bold text-slate-950 outline-none transition focus-visible:border-[#003366] focus-visible:ring-4 focus-visible:ring-[#003366]/15 disabled:cursor-not-allowed disabled:bg-slate-100"
        >
          <option value="" disabled>اختر الحالة</option>
          {[...(currentIsKnown ? [current] : []), ...allowedNextStatuses]
            .filter((incidentStatus, index, statuses) => statuses.indexOf(incidentStatus) === index)
            .map((incidentStatus) => (
            <option key={incidentStatus} value={incidentStatus}>
              {STATUS_META[incidentStatus].label}
            </option>
          ))}
        </select>
        <Button type="button" onClick={save} disabled={pending || !canTransitionIncidentStatus(current, status)} className="h-11 bg-[#003366] hover:bg-[#00264d]">
          {pending && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
          حفظ
        </Button>
      </div>
      {confirming && (
        <div className="mt-3 space-y-3 rounded-xl border border-amber-300 bg-amber-50 p-4" role="alert">
          <p className="flex items-start gap-2 text-sm font-bold leading-6 text-amber-950">
            <TriangleAlert className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
            {status === 'CLOSED'
              ? 'تأكيد إغلاق البلاغ؟ لن يمكن تغيير حالته بعد الإغلاق.'
              : 'تأكيد إحالة البلاغ إلى شركة التأمين؟'}
          </p>
          <div className="flex flex-wrap gap-2">
            <Button type="button" onClick={submit} disabled={pending} className="h-10 bg-amber-900 text-white hover:bg-amber-950">
              {pending && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
              نعم، تأكيد {status === 'CLOSED' ? 'الإغلاق' : 'الإحالة'}
            </Button>
            <Button type="button" variant="outline" onClick={() => setConfirming(false)} disabled={pending} className="h-10">
              إلغاء
            </Button>
          </div>
        </div>
      )}
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
