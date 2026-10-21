'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { KeyRound, Power, ShieldCheck } from 'lucide-react'
import { resetUserPasswordAction, toggleUserActiveAction, type UserAccountState } from '@/app/admin/(console)/users/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const INITIAL_STATE: UserAccountState = null

export function UserAccountActions({
  userId,
  isActive,
  isCurrentUser,
}: {
  userId: string
  isActive: boolean
  isCurrentUser: boolean
}) {
  const [toggleState, toggleAction, togglePending] = useActionState(toggleUserActiveAction, INITIAL_STATE)
  const [resetState, resetAction, resetPending] = useActionState(resetUserPasswordAction, INITIAL_STATE)

  if (isCurrentUser) {
    return (
      <Link href="/admin/change-password" className="text-sm font-bold text-[#003366] underline-offset-4 hover:underline">
        تغيير كلمة مروري
      </Link>
    )
  }

  return (
    <div className="w-full space-y-3 lg:w-auto lg:min-w-72">
      <form action={toggleAction} className="flex items-center gap-2">
        <input type="hidden" name="userId" value={userId} />
        <input type="hidden" name="isActive" value={String(!isActive)} />
        <Button
          type="submit"
          variant="outline"
          disabled={togglePending}
          className={isActive
            ? 'h-9 gap-2 border-amber-300 px-3 text-amber-900 hover:bg-amber-50'
            : 'h-9 gap-2 border-emerald-300 px-3 text-emerald-900 hover:bg-emerald-50'}
        >
          {isActive ? <Power className="size-4" aria-hidden="true" /> : <ShieldCheck className="size-4" aria-hidden="true" />}
          {togglePending ? 'جارٍ التحديث...' : isActive ? 'تعطيل الحساب' : 'تفعيل الحساب'}
        </Button>
        <span className={isActive
          ? 'rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-800'
          : 'rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700'}>
          {isActive ? 'نشط' : 'معطّل'}
        </span>
      </form>
      {toggleState?.error && <p role="alert" className="text-xs font-semibold text-red-800">{toggleState.error}</p>}
      {toggleState?.success && <p role="status" className="text-xs font-semibold text-emerald-800">{toggleState.success}</p>}

      <form action={resetAction} className="flex flex-wrap items-center gap-2">
        <input type="hidden" name="userId" value={userId} />
        <Input
          name="password"
          type="password"
          required
          minLength={12}
          maxLength={128}
          autoComplete="new-password"
          aria-label="كلمة المرور المؤقتة الجديدة"
          placeholder="كلمة مرور مؤقتة (12 محرفاً على الأقل)"
          className="h-9 min-w-48 flex-1 text-left"
          dir="ltr"
          disabled={resetPending}
        />
        <Button type="submit" variant="outline" disabled={resetPending} className="h-9 gap-2 border-slate-300 px-3 text-slate-800">
          <KeyRound className="size-4" aria-hidden="true" />
          {resetPending ? 'جارٍ الحفظ...' : 'استعادة كلمة المرور'}
        </Button>
      </form>
      {resetState?.error && <p role="alert" className="text-xs font-semibold text-red-800">{resetState.error}</p>}
      {resetState?.success && <p role="status" className="text-xs font-semibold text-emerald-800">{resetState.success}</p>}
    </div>
  )
}
