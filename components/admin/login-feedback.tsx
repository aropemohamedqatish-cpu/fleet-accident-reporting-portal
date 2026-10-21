import { AlertCircle, Clock3, DatabaseZap, KeyRound, ShieldAlert, Wrench } from 'lucide-react'
import type { LoginFeedbackKind } from '@/lib/login-validation'

const FEEDBACK: Record<
  LoginFeedbackKind,
  { title: string; icon: typeof AlertCircle; className: string; iconClassName: string }
> = {
  validation: {
    title: 'تحقق من البيانات',
    icon: AlertCircle,
    className: 'border-amber-200 bg-amber-50 text-amber-950',
    iconClassName: 'bg-amber-100 text-amber-800',
  },
  credentials: {
    title: 'تعذر التحقق من الدخول',
    icon: KeyRound,
    className: 'border-red-200 bg-red-50 text-red-950',
    iconClassName: 'bg-red-100 text-red-800',
  },
  rate_limited: {
    title: 'الدخول موقوف مؤقتاً',
    icon: Clock3,
    className: 'border-amber-300 bg-amber-50 text-amber-950',
    iconClassName: 'bg-amber-100 text-amber-900',
  },
  schema: {
    title: 'قاعدة البيانات تحتاج تحديثاً',
    icon: Wrench,
    className: 'border-orange-200 bg-orange-50 text-orange-950',
    iconClassName: 'bg-orange-100 text-orange-800',
  },
  database_unavailable: {
    title: 'الخدمة غير متاحة حالياً',
    icon: DatabaseZap,
    className: 'border-slate-300 bg-slate-50 text-slate-950',
    iconClassName: 'bg-slate-200 text-slate-800',
  },
  configuration: {
    title: 'إعدادات الدخول تحتاج مراجعة',
    icon: Wrench,
    className: 'border-orange-200 bg-orange-50 text-orange-950',
    iconClassName: 'bg-orange-100 text-orange-800',
  },
  unexpected: {
    title: 'تعذر إكمال تسجيل الدخول',
    icon: ShieldAlert,
    className: 'border-red-200 bg-red-50 text-red-950',
    iconClassName: 'bg-red-100 text-red-800',
  },
}

export function LoginFeedback({ kind, message }: { kind: LoginFeedbackKind; message: string }) {
  const feedback = FEEDBACK[kind]
  const Icon = feedback.icon

  return (
    <div className={`flex items-start gap-3 rounded-2xl border p-4 ${feedback.className}`} role="alert" aria-live="assertive">
      <span className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${feedback.iconClassName}`}>
        <Icon className="size-5" aria-hidden="true" />
      </span>
      <div className="min-w-0 pt-0.5">
        <p className="font-extrabold">{feedback.title}</p>
        <p className="mt-1 text-sm font-medium leading-6">{message}</p>
      </div>
    </div>
  )
}
