'use client'

import { useActionState } from 'react'
import { UserPlus } from 'lucide-react'
import { createUserAction, type CreateUserState } from '@/app/admin/(console)/users/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const INITIAL_STATE: CreateUserState = null

export function UserCreateForm() {
  const [state, action, pending] = useActionState(createUserAction, INITIAL_STATE)

  return (
    <form action={action} className="space-y-5" autoComplete="off">
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="employee-name" className="font-bold text-slate-900">الاسم الكامل</Label>
          <Input id="employee-name" name="name" autoComplete="name" required minLength={2} maxLength={120} className="h-12 border-slate-300 bg-white text-slate-950" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="employee-email" className="font-bold text-slate-900">البريد الإلكتروني</Label>
          <Input id="employee-email" name="email" type="email" dir="ltr" autoComplete="email" required maxLength={254} className="h-12 border-slate-300 bg-white text-left text-slate-950" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="employee-password" className="font-bold text-slate-900">كلمة مرور مؤقتة</Label>
          <Input id="employee-password" name="password" type="password" dir="ltr" autoComplete="new-password" required minLength={12} maxLength={128} className="h-12 border-slate-300 bg-white text-left text-slate-950" />
          <p className="text-xs font-medium text-slate-700">12 محرفاً على الأقل. تُخزّن بصمة مشفرة فقط.</p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="employee-role" className="font-bold text-slate-900">الصلاحية</Label>
          <select id="employee-role" name="role" defaultValue="AGENT" className="h-12 w-full rounded-md border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-950 outline-none focus-visible:ring-2 focus-visible:ring-[#003366]" required>
            <option value="AGENT">موظف حوادث</option>
            <option value="ADMIN">مدير نظام</option>
          </select>
        </div>
      </div>

      {state?.error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-900">{state.error}</p>}
      {state?.success && <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-900">{state.success}</p>}

      <div className="flex justify-start border-t border-slate-200 pt-5">
        <Button type="submit" disabled={pending} className="h-12 min-w-44 gap-2 bg-[#003366] px-6 font-bold text-white hover:bg-[#00264d]">
          <UserPlus className="size-4" aria-hidden="true" />
          {pending ? 'جارٍ إنشاء الحساب...' : 'إنشاء حساب الموظف'}
        </Button>
      </div>
    </form>
  )
}
