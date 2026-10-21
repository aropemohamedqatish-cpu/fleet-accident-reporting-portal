'use client'

import { useEffect } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

export default function GlobalErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Root application error boundary captured an error.', {
      digest: error.digest,
      name: error.name,
    })
  }, [error])

  return (
    <html lang="ar" dir="rtl">
      <body className="min-h-dvh bg-slate-50 font-sans text-slate-950 antialiased">
        <main className="flex min-h-dvh items-center justify-center px-5 py-12">
          <section className="w-full max-w-lg rounded-[28px] border border-red-100 bg-white p-8 text-center shadow-sm sm:p-12">
            <span className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-red-50 text-red-800">
              <AlertTriangle className="size-8" aria-hidden="true" />
            </span>
            <p className="mt-6 text-sm font-extrabold text-red-800">تعذر تشغيل واجهة التطبيق</p>
            <h1 className="mt-2 text-2xl font-extrabold">حدث خطأ في مكونات الصفحة الأساسية</h1>
            <p className="mt-3 text-sm font-medium leading-7 text-slate-600">
              أعد المحاولة. إذا تكرر الخطأ، تواصل مع الدعم واذكر رمز المرجع التالي.
            </p>
            {error.digest && (
              <p dir="ltr" className="mt-4 break-all rounded-lg bg-slate-100 px-3 py-2 font-mono text-xs text-slate-700">
                مرجع الخطأ: {error.digest}
              </p>
            )}
            <button
              type="button"
              onClick={() => reset()}
              className="mt-7 inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#003366] px-6 py-3 text-sm font-bold text-white hover:bg-[#00264d] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#003366]/25"
            >
              <RefreshCw className="size-4" aria-hidden="true" />
              إعادة المحاولة
            </button>
          </section>
        </main>
      </body>
    </html>
  )
}
