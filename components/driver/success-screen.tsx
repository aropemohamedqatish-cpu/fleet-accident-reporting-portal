'use client'

import { useState } from 'react'
import { CheckCircle2, Clock, Copy, Check, MessageCircle, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { Button, buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { Vehicle } from '@/lib/fleet-data'
import type { LocationData, SubmissionOutcome } from '@/lib/report-types'
import type { ReporterData } from '@/lib/validation'

type Props = {
  outcome: SubmissionOutcome
  vehicle: Vehicle
  location: LocationData
  reporter: ReporterData
  photoCount: number
  videoCount: number
  onNewReport: () => void
}

function buildWhatsAppText({ outcome, vehicle, location, reporter, photoCount, videoCount }: Omit<Props, 'onNewReport'>) {
  const locationText =
    location.mode === 'gps'
      ? `https://maps.google.com/?q=${location.lat.toFixed(6)},${location.lng.toFixed(6)}`
      : location.description
  return [
    '*بلاغ حادث مركبة — آروب سورية*',
    `رقم البلاغ: ${outcome.ticketId}`,
    `رقم اللوحة: ${vehicle.plate}`,
    `المركبة: ${vehicle.make} ${vehicle.model} ${vehicle.year}`,
    `رقم الوثيقة: ${vehicle.policyNumber}`,
    `اسم السائق: ${reporter.fullName}`,
    `رقم الجوال: ${reporter.mobile}`,
    `موقع الحادث: ${locationText}`,
    `عدد الصور المرفقة: ${photoCount}`,
    `عدد مقاطع الفيديو المرفقة: ${videoCount}`,
    `وصف الحادث: ${reporter.notes}`,
    `تاريخ البلاغ: ${new Date(outcome.submittedAt).toLocaleString('ar-SY')}`,
  ].join('\n')
}

export function SuccessScreen(props: Props) {
  const { outcome, vehicle, onNewReport } = props
  const [copied, setCopied] = useState(false)
  const staged = outcome.status === 'staged'
  const shortId = outcome.ticketId.slice(0, 8).toUpperCase()
  const submissionHour = new Date(outcome.submittedAt).getHours()
  const isLateNight = submissionHour >= 20 || submissionHour < 8
  const whatsappHref = `https://wa.me/?text=${encodeURIComponent(buildWhatsAppText(props))}`

  async function copyId() {
    try {
      await navigator.clipboard.writeText(outcome.ticketId)
      setCopied(true)
      toast.success('تم نسخ رقم البلاغ')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('تعذّر النسخ، يرجى نسخ الرقم يدوياً')
    }
  }

  return (
    <section className="flex flex-1 flex-col gap-6 px-5 py-8" aria-labelledby="success-title">
      <div className="flex flex-col items-center gap-4 text-center">
        <div
          className={
            staged
              ? 'flex size-20 items-center justify-center rounded-full bg-warning/15 text-warning'
              : 'flex size-20 items-center justify-center rounded-full bg-success/15 text-success'
          }
        >
          {staged ? <Clock className="size-10" aria-hidden="true" /> : <CheckCircle2 className="size-10" aria-hidden="true" />}
        </div>
        <div className="flex flex-col gap-2">
          <h2 id="success-title" className="text-balance text-2xl font-bold">
            {staged ? 'تم حفظ البلاغ على جهازك' : 'تم إرسال البلاغ بنجاح'}
          </h2>
          <p className="text-pretty leading-relaxed text-muted-foreground">
            {staged
              ? 'لا يوجد اتصال حالياً. سيتم إرسال البلاغ تلقائياً فور عودة الإنترنت، دون الحاجة لإعادة إدخال أي بيانات.'
              : 'استلم فريق المطالبات بلاغك وسيتواصل معك قريباً. احتفظ برقم البلاغ للمتابعة.'}
          </p>
        </div>
      </div>

      {isLateNight && (
        <aside className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-amber-950" role="note">
          <p className="mb-3 text-sm font-medium leading-relaxed">
            تنبيه للمساندة الفورية: نظراً لوقوع الحادث في وقت متأخر، إذا لم يتم الرد عليك عبر واتساب خلال 10 دقائق وتطلب الأمر تدخلاً ميدانياً عاجلاً، يرجى الاتصال مباشرة بمشرف الطوارئ المناوب على الرقم التالي: [0999999999]
          </p>
          <a
            href="tel:0999999999"
            className="inline-flex min-h-11 items-center justify-center rounded-lg bg-amber-700 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-amber-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-800"
          >
            اتصل بمشرف الطوارئ: 0999999999
          </a>
        </aside>
      )}

      <div className="rounded-2xl border bg-card p-5">
        <p className="text-sm text-muted-foreground">رقم البلاغ</p>
        <div className="mt-1 flex items-center justify-between gap-3">
          <p className="font-mono text-3xl font-bold tracking-wider text-primary" dir="ltr">
            {shortId}
          </p>
          <Button variant="outline" size="icon" onClick={copyId} aria-label="نسخ رقم البلاغ الكامل">
            {copied ? <Check className="size-4" aria-hidden="true" /> : <Copy className="size-4" aria-hidden="true" />}
          </Button>
        </div>
        <p className="mt-2 break-all font-mono text-xs text-muted-foreground" dir="ltr">
          {outcome.ticketId}
        </p>
        <dl className="mt-4 grid grid-cols-2 gap-3 border-t pt-4 text-sm">
          <div>
            <dt className="text-muted-foreground">رقم اللوحة</dt>
            <dd className="font-semibold tabular-nums">{vehicle.plate}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">الحالة</dt>
            <dd className={staged ? 'font-semibold text-warning' : 'font-semibold text-success'}>
              {staged ? 'بانتظار المزامنة' : 'قيد المراجعة'}
            </dd>
          </div>
        </dl>
      </div>

      <div className="mt-auto flex flex-col gap-3">
        {!staged && (
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              buttonVariants({ size: 'lg' }),
              'h-14 gap-2 bg-[#25D366] text-base font-semibold text-[#0b3d1f] hover:bg-[#25D366]/90',
            )}
          >
            <MessageCircle className="size-5" aria-hidden="true" />
            مشاركة البلاغ عبر واتساب
          </a>
        )}
        <Button variant="outline" size="lg" className="h-12 gap-2" onClick={onNewReport}>
          <Plus className="size-4" aria-hidden="true" />
          بلاغ جديد
        </Button>
      </div>
    </section>
  )
}
