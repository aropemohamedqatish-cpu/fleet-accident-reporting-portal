'use client'

import { useId } from 'react'
import { CheckCircle2, XCircle, Car } from 'lucide-react'
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
            <p className="flex items-center gap-1.5 font-medium text-success">
              <CheckCircle2 className="size-4" aria-hidden="true" />
              تم التحقق من المركبة ضمن الأسطول
            </p>
          )}
          {showError && (
            <p className="flex items-center gap-1.5 font-medium text-destructive">
              <XCircle className="size-4" aria-hidden="true" />
              رقم اللوحة غير مسجّل ضمن أسطول الشركة. تحقق من الرقم وأعد المحاولة.
            </p>
          )}
          {!vehicle && !showError && (
            <p className="text-muted-foreground">أرقام اللوحات المسجّلة تتكون من 7 خانات.</p>
          )}
        </div>
      </div>

      {vehicle && (
        <div className="flex items-center gap-4 rounded-xl border bg-card p-4">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-secondary text-primary">
            <Car className="size-6" aria-hidden="true" />
          </div>
          <dl className="grid flex-1 grid-cols-2 gap-x-4 gap-y-1 text-sm">
            <dt className="text-muted-foreground">المركبة</dt>
            <dd className="font-semibold" dir="ltr">{`${vehicle.make} ${vehicle.model} ${vehicle.year}`}</dd>
            <dt className="text-muted-foreground">الفئة</dt>
            <dd className="font-semibold">{vehicle.category}</dd>
            <dt className="text-muted-foreground">رقم الوثيقة</dt>
            <dd className="font-semibold" dir="ltr">{vehicle.policyNumber}</dd>
          </dl>
        </div>
      )}
    </StepShell>
  )
}
