'use client'

import { useActionState } from 'react'
import Image from 'next/image'
import { Loader2, Lock, Mail, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { LoginFeedback } from '@/components/admin/login-feedback'
import { adminLoginAction } from './actions'

export function AdminLoginForm() {
  const [state, formAction, pending] = useActionState(adminLoginAction, null)

  return (
    <Card className="w-full max-w-md rounded-[28px] border border-slate-100 bg-white shadow-xl">
      <CardHeader className="space-y-3 pb-10 pt-8 text-center">
        <Image
          src="/images/arope-logo.png"
          alt="آروب سورية"
          width={220}
          height={70}
          priority
          className="mx-auto mb-2 h-12 w-auto"
        />
        <div className="mx-auto inline-flex items-center gap-1.5 rounded-full border border-[#003366]/15 bg-[#003366]/5 px-3 py-1 text-[10px] font-bold tracking-wider text-[#003366]">
          <ShieldCheck className="size-3.5" aria-hidden="true" />
          بوابة المشرفين — دخول آمن
        </div>
        <CardTitle className="text-2xl font-bold tracking-tight text-slate-950">تسجيل دخول الإدارة</CardTitle>
        <CardDescription className="text-slate-600 text-sm leading-relaxed">
          مخصصة لمشرفي التأمين والأسطول لمراجعة بلاغات الحوادث ومعالجتها بأمان وكفاءة.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-8">
        <form action={formAction} className="space-y-6">
          {state?.error && <LoginFeedback kind={state.kind} message={state.error} />}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-xs font-semibold tracking-wide text-slate-900">
              <Mail className="mr-1.5 size-4 text-[#003366]" aria-hidden="true" />
              البريد الإلكتروني
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="username"
              required
              maxLength={254}
              dir="ltr"
              placeholder="admin@arope.com"
              disabled={pending}
              className="h-11 border-slate-300 text-left pl-10"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="text-xs font-semibold tracking-wide text-slate-900">
              <Lock className="mr-1.5 size-4 text-[#003366]" aria-hidden="true" />
              كلمة المرور
            </Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              maxLength={128}
              dir="ltr"
              placeholder="••••••••••••"
              disabled={pending}
              className="h-11 border-slate-300 text-left pl-10"
            />
          </div>
          <Button
            type="submit"
            className="h-12 w-full gap-2 bg-[#003366] text-base font-semibold text-white shadow-lg shadow-[#003366]/25 hover:bg-[#00264d] transition"
            disabled={pending}
          >
            {pending && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
            {pending ? 'جارٍ التحقق من الصلاحيات...' : 'تسجيل الدخول الآمن'}
          </Button>
          <p className="text-center text-xs leading-6 text-slate-600">
            هذه المنطقة محمية ومخصصة للمشرفين المخوّلين فقط.
          </p>
        </form>
      </CardContent>
    </Card>
  )
}
