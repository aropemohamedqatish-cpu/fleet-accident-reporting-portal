'use client'

import { useEffect, useId, useState } from 'react'
import { AlertCircle, CheckCircle2, LoaderCircle, XCircle } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { getPlateDigitCount, normalizePlateInput } from '@/lib/plate'
import type { Vehicle } from '@/lib/report-types'
import {
  isSyrianGovernorate,
  SYRIAN_GOVERNORATES,
  type SyrianGovernorate,
} from '@/lib/syrian-governorates'
import { StepShell } from './step-shell'
import { cn } from '@/lib/utils'

type Props = {
  plate: string
  governorate: string
  onPlateChange: (value: string) => void
  onGovernorateChange: (value: SyrianGovernorate | '') => void
  onVehicleVerified: (vehicle: Vehicle | null) => void
  onBack: () => void
  onNext: () => void
}

type VerificationState = 'idle' | 'incomplete' | 'checking' | 'valid' | 'invalid' | 'error'

export function StepVehicle({
  plate,
  governorate,
  onPlateChange,
  onGovernorateChange,
  onVehicleVerified,
  onBack,
  onNext,
}: Props) {
  const inputId = useId()
  const governorateId = useId()
  const feedbackId = useId()
  const normalizedPlate = normalizePlateInput(plate)
  const digitCount = getPlateDigitCount(plate)
  const [verification, setVerification] = useState<VerificationState>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const [verifiedPlate, setVerifiedPlate] = useState<string | null>(null)

  useEffect(() => {
    onVehicleVerified(null)
    setErrorMessage('')
    setVerifiedPlate(null)
    if (digitCount < 6 || digitCount > 7 || !governorate) {
      setVerification(digitCount > 7 ? 'invalid' : digitCount > 0 ? 'incomplete' : 'idle')
      if (digitCount > 7) setErrorMessage('رقم اللوحة يجب أن يحتوي على 6 أو 7 أرقام فقط.')
      else if (digitCount >= 6 && !governorate) setErrorMessage('يرجى اختيار المحافظة أولاً.')
      return
    }

    const controller = new AbortController()
    setVerification('checking')
    const timeout = window.setTimeout(async () => {
      try {
        const params = new URLSearchParams({ plate: normalizedPlate, governorate })
        const response = await fetch(`/api/vehicles?${params.toString()}`, {
          signal: controller.signal,
          cache: 'no-store',
        })
        const result: unknown = await response.json()
        if (
          response.ok &&
          typeof result === 'object' &&
          result !== null &&
          'plate' in result &&
          typeof result.plate === 'string' &&
          'governorate' in result &&
          result.governorate === governorate &&
          isSyrianGovernorate(governorate)
        ) {
          onVehicleVerified({ plate: result.plate, governorate })
          setVerifiedPlate(normalizedPlate)
          setVerification('valid')
          return
        }

        const message =
          typeof result === 'object' &&
          result !== null &&
          'error' in result &&
          typeof result.error === 'string'
            ? result.error
            : 'تعذّر التحقق من المركبة حالياً. يرجى المحاولة مجدداً.'
        setErrorMessage(message)
        setVerification(response.status === 404 ? 'invalid' : 'error')
      } catch (error) {
        if (controller.signal.aborted) return
        console.error('Vehicle verification request failed.', error)
        setErrorMessage('تعذّر الاتصال للتحقق من المركبة. تحقق من الشبكة وحاول مجدداً.')
        setVerification('error')
      }
    }, 250)

    return () => {
      window.clearTimeout(timeout)
      controller.abort()
    }
  }, [digitCount, governorate, normalizedPlate, onVehicleVerified])

  const isVerified = verification === 'valid' && verifiedPlate === normalizedPlate
  const showError = verification === 'invalid' || verification === 'error'

  return (
    <StepShell
      title="التحقق من المركبة"
      description="أدخل رقم لوحة المركبة المسجلة ضمن أسطول الشركة."
      onBack={onBack}
      onNext={onNext}
      nextDisabled={!isVerified}
    >
      <div className="flex flex-col gap-2">
        <Label htmlFor={governorateId} className="text-base">
          المحافظة
        </Label>
        <select
          id={governorateId}
          value={governorate}
          onChange={(event) => {
            const value = event.target.value
            onGovernorateChange(isSyrianGovernorate(value) ? value : '')
          }}
          aria-describedby={feedbackId}
          className="h-12 rounded-xl border border-input bg-white px-3 text-base text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="">اختر المحافظة</option>
          {SYRIAN_GOVERNORATES.map(({ value, label }) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>

        <Label htmlFor={inputId} className="mt-2 text-base">
          رقم لوحة المركبة
        </Label>
        <div
          className={cn(
            'rounded-xl border-[3px] border-[#003366] bg-white p-1 shadow-inner transition-colors',
            isVerified && 'border-success',
            showError && 'border-destructive',
          )}
        >
          <Input
            id={inputId}
            inputMode="text"
            autoComplete="off"
            autoFocus
            dir="ltr"
            placeholder="12/00145 أو 120/0145"
            value={plate}
            onChange={(e) => onPlateChange(normalizePlateInput(e.target.value))}
            aria-invalid={showError || undefined}
            aria-describedby={feedbackId}
            className="h-16 rounded-lg border-0 bg-transparent text-center text-3xl font-bold tracking-[0.3em] text-[#003366] placeholder:text-[#003366]/20 tabular-nums shadow-none focus-visible:ring-0"
          />
        </div>
        <div id={feedbackId} aria-live="polite" className="min-h-6 text-sm">
          {isVerified && (
            <p className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 font-bold text-emerald-900">
              <CheckCircle2 className="size-5 shrink-0" aria-hidden="true" />
              رقم اللوحة مسجّل ضمن أسطول الشركة. يمكنك المتابعة.
            </p>
          )}
          {verification === 'checking' && (
            <p role="status" className="flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 font-medium text-blue-900">
              <LoaderCircle className="size-5 shrink-0 animate-spin" aria-hidden="true" />
              جارٍ التحقق من رقم اللوحة...
            </p>
          )}
          {showError && (
            <p role="alert" className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 font-bold text-red-900">
              {verification === 'error' ? (
                <AlertCircle className="size-4 shrink-0" aria-hidden="true" />
              ) : (
                <XCircle className="size-4 shrink-0" aria-hidden="true" />
              )}
              {errorMessage}
            </p>
          )}
          {verification === 'incomplete' && (
            <p className="text-sm font-medium leading-6 text-slate-700">
                {digitCount >= 6 && !governorate
                  ? 'اختر المحافظة من القائمة لمتابعة التحقق.'
                  : 'أدخل 6 أو 7 أرقام، ويمكن الفصل بينها بشرطة أو أي رمز؛ سيُستخدم تنسيق الشرطة المائلة للبحث.'}
              </p>
          )}
          {verification === 'idle' && (
              <p className="text-sm font-medium leading-6 text-slate-700">
                اختر المحافظة وأدخل 6 أو 7 أرقام للتحقق من المركبة.
              </p>
          )}
        </div>
      </div>
    </StepShell>
  )
}
