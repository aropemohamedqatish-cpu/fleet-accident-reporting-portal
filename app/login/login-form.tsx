'use client'

import { useActionState } from 'react'
import Image from 'next/image'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { LoginFeedback } from '@/components/admin/login-feedback'
import { loginAction } from './actions'

export function LoginForm() {
  const [state, formAction, pending] = useActionState(loginAction, null)

  return (
    <Card className="w-full max-w-md border-0 shadow-lg ring-1 ring-slate-200">
      <CardHeader className="space-y-2 pb-6 text-center">
        <Image
          src="/images/arope-logo.png"
          alt="آروب سورية"
          width={200}
          height={64}
          priority
          className="mx-auto mb-2 h-14 w-auto"
        />
        <CardTitle className="text-2xl font-bold text-slate-900">بوابة الحوادث</CardTitle>
        <CardDescription className="text-slate-600">سجّل الدخول للوصول إلى لوحة متابعة البلاغات.</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-5">
          {state?.error && <LoginFeedback kind={state.kind} message={state.error} />}
          <div className="space-y-2">
            <Label htmlFor="email">البريد الإلكتروني</Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="username"
              required
              maxLength={254}
              dir="ltr"
              className="text-left"
              disabled={pending}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">كلمة المرور</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              maxLength={128}
              dir="ltr"
              className="text-left"
              disabled={pending}
            />
          </div>
          <Button
            type="submit"
            className="h-12 w-full gap-2 bg-[#003366] text-base font-semibold hover:bg-[#00264d]"
            disabled={pending}
          >
            {pending && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
            {pending ? 'جارٍ تسجيل الدخول...' : 'تسجيل الدخول'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
