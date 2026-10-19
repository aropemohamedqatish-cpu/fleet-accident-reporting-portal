import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { LoginForm } from './login-form'

export default async function LoginPage() {
  if (await getSession()) redirect('/dashboard')

  return (
    <main className="flex min-h-dvh items-center justify-center bg-slate-50 p-4" dir="rtl">
      <LoginForm />
    </main>
  )
}
