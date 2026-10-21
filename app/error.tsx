'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { AlertTriangle, RefreshCw } from 'lucide-react'

export default function ApplicationErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Application route error boundary captured an error.', {
      digest: error.digest,
      name: error.name,
    })
  }, [error])

  return (
    <main dir="rtl" className="flex min-h-dvh items-center justify-center bg-slate-50 px-5 py-12">
      <section className="w-full max-w-lg rounded-[28px] border border-red-100 bg-white p-8 text-center shadow-sm sm:p-12">
        <span className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-red-50 text-red-800">
          <AlertTriangle className="size-8" aria-hidden="true" />
        </span>
        <p className="mt-6 text-sm font-extrabold text-red-800">حدث خطأ غير متوقع</p>
        <h1 className="mt-2 text-2xl font-extrabold text-slate-950">لم نتمكن من إكمال عرض الصفحة</h1>
        <p className="mt-3 text-sm font-medium leading-7 text-slate-600">
          لم تُفقد بياناتك المحفوظة. حاول تحديث الصفحة، وإذا تكرر الخطأ تواصل مع الدعم وأرسل رمز المرجع الظاهر أدناه.
        </p>
        {error.digest && (
          <p dir="ltr" className="mt-4 break-all rounded-lg bg-slate-100 px-3 py-2 font-mono text-xs text-slate-700">
            مرجع الخطأ: {error.digest}
          </p>
        )}
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={() => reset()}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#003366] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#00264d] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#003366]/25"
          >
            <RefreshCw className="size-4" aria-hidden="true" />
            إعادة المحاولة
          </button>
          <Link
            href="/"
            className="inline-flex min-h-12 items-center justify-center rounded-xl border border-slate-300 px-6 py-3 text-sm font-bold text-slate-800 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-300"
          >
            الصفحة الرئيسية
          </Link>
        </div>
      </section>
    </main>
  )
}
