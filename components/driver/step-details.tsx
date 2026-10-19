'use client'

import { useId, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { reporterSchema, type ReporterData, type ReporterInput } from '@/lib/validation'
import { StepShell } from './step-shell'

type Field = keyof ReporterInput
type Props = {
  values: ReporterInput
  onChange: (values: ReporterInput) => void
  onBack: () => void
  onSubmit: (data: ReporterData) => void
  submitting: boolean
  online: boolean
}

function fieldErrors(values: ReporterInput) {
  const result = reporterSchema.safeParse(values)
  const errors: Partial<Record<Field, string>> = {}
  if (!result.success) {
    for (const issue of result.error.issues) {
      const key = issue.path[0] as Field
      errors[key] ??= issue.message
    }
  }
  return { result, errors }
}

export function StepDetails({ values, onChange, onBack, onSubmit, submitting, online }: Props) {
  const ids = { fullName: useId(), mobile: useId(), notes: useId() }
  const [touched, setTouched] = useState<Partial<Record<Field, boolean>>>({})
  const { result, errors } = fieldErrors(values)

  const visibleError = (f: Field) => (touched[f] ? errors[f] : undefined)
  const set = (f: Field, v: string) => onChange({ ...values, [f]: v })
  const blur = (f: Field) => setTouched((t) => ({ ...t, [f]: true }))

  function handleSubmit() {
    setTouched({ fullName: true, mobile: true, notes: true })
    if (result.success) onSubmit(result.data)
  }

  const fieldProps = (f: Field) => ({
    id: ids[f],
    value: values[f],
    onBlur: () => blur(f),
    'aria-invalid': Boolean(visibleError(f)) || undefined,
    'aria-describedby': `${ids[f]}-msg`,
  })

  return (
    <StepShell
      title="بيانات السائق"
      description="راجع بياناتك قبل الإرسال. سيتواصل معك فريق المطالبات على الرقم المدخل."
      onBack={onBack}
      onNext={handleSubmit}
      nextLabel={online ? 'إرسال البلاغ' : 'حفظ البلاغ للإرسال لاحقاً'}
      loading={submitting}
    >
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <Label htmlFor={ids.fullName} className="text-base">
            الاسم الثلاثي
          </Label>
          <Input
            {...fieldProps('fullName')}
            autoComplete="name"
            placeholder="مثال: أحمد محمد الخطيب"
            className="h-12 text-base"
            onChange={(e) => set('fullName', e.target.value)}
          />
          <FieldMessage id={`${ids.fullName}-msg`} error={visibleError('fullName')} hint="الاسم، اسم الأب، الكنية" />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor={ids.mobile} className="text-base">
            رقم الجوال
          </Label>
          <Input
            {...fieldProps('mobile')}
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            dir="ltr"
            maxLength={14}
            placeholder="09XXXXXXXX"
            className="h-12 text-right text-base tabular-nums"
            onChange={(e) => set('mobile', e.target.value)}
          />
          <FieldMessage id={`${ids.mobile}-msg`} error={visibleError('mobile')} hint="رقم سوري مكوّن من 10 خانات يبدأ بـ 09" />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor={ids.notes} className="text-base">
            وصف الحادث
          </Label>
          <Textarea
            {...fieldProps('notes')}
            rows={5}
            maxLength={1000}
            placeholder="صف ما حدث باختصار: كيف وقع الحادث، الأضرار الظاهرة، وجود طرف آخر أو إصابات."
            className="text-base"
            onChange={(e) => set('notes', e.target.value)}
          />
          <FieldMessage
            id={`${ids.notes}-msg`}
            error={visibleError('notes')}
            hint={`${values.notes.length}/1000 حرف`}
          />
        </div>
      </div>
    </StepShell>
  )
}

function FieldMessage({ id, error, hint }: { id: string; error?: string; hint: string }) {
  return (
    <p id={id} className={error ? 'text-sm font-medium text-destructive' : 'text-sm text-muted-foreground'} aria-live="polite">
      {error ?? hint}
    </p>
  )
}
