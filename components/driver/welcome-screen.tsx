import Image from 'next/image'
import { ShieldCheck, Database, ListChecks, Phone, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

const POINTS = [
  { icon: ListChecks, title: 'خطوات بسيطة وواضحة', text: 'أربع خطوات فقط لإتمام البلاغ خلال دقائق.' },
  { icon: Database, title: 'تحقق مباشر من المركبة', text: 'نتحقق من تسجيل المركبة وحالتها مباشرة قبل قبول البلاغ.' },
  { icon: ShieldCheck, title: 'بياناتك محمية', text: 'تُرسل المعلومات بشكل مشفّر إلى فريق الحوادث فقط.' },
]

export function WelcomeScreen({ onStart }: { onStart: () => void }) {
  return (
    <div className="flex flex-1 flex-col bg-slate-50">
      <div className="bg-slate-50 px-6 pt-8 pb-6">
        <Image
          src="/images/arope-logo.png"
          alt="آروب سورية - الشركة السورية الدولية للتأمين"
          width={2576}
          height={826}
          priority
          className="mx-auto h-auto w-56"
        />
      </div>

      <div className="flex flex-1 flex-col gap-6 bg-slate-50 px-6 py-8 text-slate-900">
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium text-slate-600">بوابة حوادث الأسطول</p>
          <h1 className="text-balance text-3xl font-bold leading-tight">الإبلاغ عن حادث مركبة</h1>
          <p className="text-pretty leading-relaxed text-slate-600">
            حافظ على هدوئك. سنرشدك خطوة بخطوة لتوثيق الحادث وإرساله مباشرة إلى فريق الحوادث.
          </p>
        </div>

        <ul className="flex flex-col gap-3">
          {POINTS.map(({ icon: Icon, title, text }) => (
            <li key={title} className="flex items-start gap-3 rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
              <Icon className="mt-0.5 size-5 shrink-0 text-[#003366]" aria-hidden="true" />
              <div>
                <p className="font-semibold text-slate-900">{title}</p>
                <p className="text-sm text-slate-600">{text}</p>
              </div>
            </li>
          ))}
        </ul>

        <div className="mt-auto flex flex-col gap-4">
          <Button
            size="lg"
            onClick={onStart}
            className="h-14 w-full gap-2 bg-[#003366] text-lg font-bold text-white hover:bg-[#003366]/90"
          >
            ابدأ البلاغ
            <ArrowLeft className="size-5" aria-hidden="true" />
          </Button>
          <div className="flex flex-wrap items-center justify-center gap-x-1.5 gap-y-2 text-center text-sm text-slate-700">
            <Phone className="size-4 shrink-0 text-[#003366]" aria-hidden="true" />
            <span>في حال وجود إصابات اتصل فوراً بالإسعاف</span>
            <a href="tel:110" className="font-bold text-[#003366] underline underline-offset-2">
              110
            </a>
            <span>أو الشرطة</span>
            <a href="tel:112" className="font-bold text-[#003366] underline underline-offset-2">
              112
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
