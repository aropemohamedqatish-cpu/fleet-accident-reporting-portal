'use client'

import { useActionState } from 'react'
import { KeyRound, Loader2 } from 'lucide-react'
import { changePasswordAction } from '@/app/admin/change-password/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function ChangePasswordForm({ forced }: { forced: boolean }) {
  const [state, action, pending] = useActionState(changePasswordAction, null)

  return (
    <form action={action} className="space-y-5">
      {forced && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold leading-7 text-amber-950" role="status">
          كلمة المرور الحالية مؤقتة. يجب اختيار كلمة مرور جديدة قبل متابعة استخدام لوحة التحكم.
        </div>
      )}
      {state?.error && (
        <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-900">
          {state.error}
        </p>
      )}
      <div className="space-y-2">
        <Label htmlFor="current-password">كلمة المرور الحالية</Label>
        <Input id="current-password" name="currentPassword" type="password" autoComplete="current-password" required maxLength={128} disabled={pending} dir="ltr" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="new-password">كلمة المرور الجديدة</Label>
        <Input id="new-password" name="newPassword" type="password" autoComplete="new-password" required minLength={12} maxLength={128} disabled={pending} dir="ltr" />
        <p className="text-xs font-medium text-slate-600">يجب أن تتكون من 12 محرفاً على الأقل.</p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirm-password">تأكيد كلمة المرور الجديدة</Label>
        <Input id="confirm-password" name="confirmPassword" type="password" autoComplete="new-password" required maxLength={128} disabled={pending} dir="ltr" />
      </div>
      <Button type="submit" disabled={pending} className="h-11 gap-2 bg-[#003366] px-5 font-bold text-white hover:bg-[#00264d]">
        {pending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <KeyRound className="size-4" aria-hidden="true" />}
        {pending ? 'جارٍ تحديث كلمة المرور...' : 'حفظ كلمة المرور الجديدة'}
      </Button>
    </form>
  )
}
