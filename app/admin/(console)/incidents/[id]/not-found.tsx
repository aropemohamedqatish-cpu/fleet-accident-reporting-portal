import Link from 'next/link'
import { FileSearch } from 'lucide-react'

export default function IncidentNotFoundPage() {
  return (
    <div className="mx-auto flex w-full max-w-lg flex-col items-center gap-4 rounded-[24px] border border-slate-100 bg-white px-8 py-16 text-center shadow-sm" dir="rtl">
      <FileSearch className="size-12 text-slate-300" aria-hidden="true" />
      <h1 className="text-xl font-bold text-slate-950">البلاغ غير موجود</h1>
      <p className="text-sm leading-7 text-slate-600">قد يكون البلاغ محذوفاً أو أن الرابط غير صحيح. تحقق من المرجع وحاول مجدداً.</p>
      <Link href="/admin/dashboard" className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[#003366] px-6 py-2.5 text-sm font-bold text-white transition hover:bg-[#00264d]">
        العودة إلى سجل البلاغات
      </Link>
    </div>
  )
}
