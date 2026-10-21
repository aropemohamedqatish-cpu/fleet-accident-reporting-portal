import Link from 'next/link'
import { ArrowRight, FileQuestion } from 'lucide-react'

export default function NotFoundPage() {
  return (
    <main dir="rtl" className="flex min-h-dvh items-center justify-center bg-slate-50 px-5 py-12">
      <section className="w-full max-w-lg rounded-[28px] border border-slate-200 bg-white p-8 text-center shadow-sm sm:p-12">
        <span className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-[#003366]/10 text-[#003366]">
          <FileQuestion className="size-8" aria-hidden="true" />
        </span>
        <p className="mt-6 text-sm font-extrabold text-[#003366]">الصفحة غير موجودة</p>
        <h1 className="mt-2 text-3xl font-extrabold text-slate-950">تعذّر العثور على هذه الصفحة</h1>
        <p className="mt-3 text-sm font-medium leading-7 text-slate-600">
          ربما نُقل الرابط أو كُتب بشكل غير صحيح. تحقق من العنوان أو ارجع إلى بوابة الإبلاغ.
        </p>
        <Link
          href="/"
          className="mt-7 inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#003366] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#00264d] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#003366]/25"
        >
          <ArrowRight className="size-4" aria-hidden="true" />
          العودة إلى الصفحة الرئيسية
        </Link>
      </section>
    </main>
  )
}
