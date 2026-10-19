import Image from 'next/image'
import { ShieldCheck, WifiOff, ListChecks, Phone, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

const POINTS = [
  { icon: ListChecks, title: 'خطوات بسيطة وواضحة', text: 'أربع خطوات فقط لإتمام البلاغ خلال دقائق.' },
  { icon: WifiOff, title: 'يعمل دون إنترنت', text: 'يُحفظ البلاغ على جهازك ويُرسل عند عودة الاتصال.' },
  { icon: ShieldCheck, title: 'بياناتك محمية', text: 'تُرسل المعلومات بشكل مشفّر إلى فريق المطالبات فقط.' },
]

export function WelcomeScreen({ onStart }: { onStart: () => void }) {
  return (
    <div className="flex flex-1 flex-col">
      <div className="bg-card px-6 pt-8 pb-6">
        <Image
          src="/images/arope-logo.png"
          alt="آروب سورية - الشركة السورية الدولية للتأمين"
          width={2576}
          height={826}
          priority
          className="mx-auto h-auto w-56"
        />
      </div>

      <div className="flex flex-1 flex-col gap-6 bg-primary px-6 py-8 text-primary-foreground">
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium text-primary-foreground/75">بوابة حوادث الأسطول</p>
          <h1 className="text-balance text-3xl font-bold leading-tight">الإبلاغ عن حادث مركبة</h1>
          <p className="text-pretty leading-relaxed text-primary-foreground/85">
            حافظ على هدوئك. سنرشدك خطوة بخطوة لتوثيق الحادث وإرساله مباشرة إلى فريق المطالبات.
          </p>
        </div>

        <ul className="flex flex-col gap-3">
          {POINTS.map(({ icon: Icon, title, text }) => (
            <li key={title} className="flex items-start gap-3 rounded-xl bg-primary-foreground/10 p-4">
              <Icon className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
              <div>
                <p className="font-semibold">{title}</p>
                <p className="text-sm text-primary-foreground/80">{text}</p>
              </div>
            </li>
          ))}
        </ul>

        <div className="mt-auto flex flex-col gap-4">
          <Button
            size="lg"
            onClick={onStart}
            className="h-14 w-full gap-2 bg-card text-lg font-bold text-primary hover:bg-card/90"
          >
            ابدأ البلاغ
            <ArrowLeft className="size-5" aria-hidden="true" />
          </Button>
          <div className="flex items-center justify-center gap-2 text-sm text-primary-foreground/85">
            <Phone className="size-4" aria-hidden="true" />
            <span>
              في حال وجود إصابات اتصل فوراً بالإسعاف <a href="tel:110" className="font-bold underline">110</a> أو الشرطة{' '}
              <a href="tel:112" className="font-bold underline">112</a>
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
