'use client'

import { useId } from 'react'
import { CheckCircle2, XCircle } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { findVehicle, normalizePlate, FLEET_PLATE_START } from '@/lib/fleet-data'
import { StepShell } from './step-shell'
import { cn } from '@/lib/utils'

type Props = {
  plate: string
  onPlateChange: (value: string) => void
  onBack: () => void
  onNext: () => void
}

export function StepVehicle({ plate, onPlateChange, onBack, onNext }: Props) {
  const inputId = useId()
  const feedbackId = useId()
  const digits = normalizePlate(plate)
  const vehicle = findVehicle(plate)
  const showError = digits.length >= 7 && !vehicle

  return (
    <StepShell
      title="التحقق من المركبة"
      description="أدخل رقم لوحة المركبة المسجلة ضمن أسطول الشركة."
      onBack={onBack}
      onNext={onNext}
      nextDisabled={!vehicle}
    >
      <div className="flex flex-col gap-2">
        <Label htmlFor={inputId} className="text-base">
          رقم لوحة المركبة
        </Label>
        <div
          className={cn(
            'rounded-xl border-[3px] border-[#003366] bg-white p-1 shadow-inner transition-colors',
            vehicle && 'border-success',
            showError && 'border-destructive',
          )}
        >
          <Input
            id={inputId}
            inputMode="numeric"
            autoComplete="off"
            autoFocus
            dir="ltr"
            maxLength={10}
            placeholder={String(FLEET_PLATE_START + 144)}
            value={plate}
            onChange={(e) => onPlateChange(e.target.value)}
            aria-invalid={showError || undefined}
            aria-describedby={feedbackId}
            className="h-16 rounded-lg border-0 bg-transparent text-center text-3xl font-bold tracking-[0.3em] text-[#003366] tabular-nums shadow-none focus-visible:ring-0"
          />
        </div>
        <div id={feedbackId} aria-live="polite" className="min-h-6 text-sm">
          {vehicle && (
            <p className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 font-bold text-emerald-900">
              <CheckCircle2 className="size-5 shrink-0" aria-hidden="true" />
              رقم اللوحة مسجّل ضمن أسطول الشركة. يمكنك المتابعة.
            </p>
          )}
          {showError && (
            <p className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 font-bold text-red-900">
              <XCircle className="size-4" aria-hidden="true" />
              لم يتم العثور على رقم اللوحة ضمن أسطول الشركة. تحقق من الرقم وحاول مجدداً.
            </p>
          )}
          {!vehicle && !showError && (
            <p className="text-sm font-medium leading-6 text-slate-700">
              أدخل رقم اللوحة المكوّن من 7 أرقام للتحقق من تسجيله ضمن أسطول الشركة.
            </p>
          )}
        </div>
      </div>
    </StepShell>
  )
}
