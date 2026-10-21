'use client'

import { useEffect, useId, useState } from 'react'
import { AlertCircle, CheckCircle2, LoaderCircle, XCircle } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { sanitizePlateInput } from '@/lib/plate'
import type { Vehicle } from '@/lib/report-types'
import { StepShell } from './step-shell'
import { cn } from '@/lib/utils'

type Props = {
  plate: string
  onPlateChange: (value: string) => void
  onVehicleVerified: (vehicle: Vehicle | null) => void
  onBack: () => void
  onNext: () => void
}

type VerificationState = 'idle' | 'incomplete' | 'checking' | 'valid' | 'invalid' | 'error'

export function StepVehicle({ plate, onPlateChange, onVehicleVerified, onBack, onNext }: Props) {
  const inputId = useId()
  const feedbackId = useId()
  const digits = sanitizePlateInput(plate)
  const [verification, setVerification] = useState<VerificationState>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const [verifiedPlate, setVerifiedPlate] = useState<string | null>(null)

  useEffect(() => {
    onVehicleVerified(null)
    setErrorMessage('')
    setVerifiedPlate(null)
    if (digits.length !== 7) {
      setVerification(digits.length > 0 ? 'incomplete' : 'idle')
      return
    }

    const controller = new AbortController()
    setVerification('checking')
    const timeout = window.setTimeout(async () => {
      try {
        const response = await fetch(`/api/vehicles?plate=${encodeURIComponent(digits)}`, {
          signal: controller.signal,
          cache: 'no-store',
        })
        const result: unknown = await response.json()
        if (
          response.ok &&
          typeof result === 'object' &&
          result !== null &&
          'plate' in result &&
          result.plate === digits
        ) {
          onVehicleVerified({ plate: digits })
          setVerifiedPlate(digits)
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
  }, [digits, onVehicleVerified])

  const isVerified = verification === 'valid' && verifiedPlate === digits
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
        <Label htmlFor={inputId} className="text-base">
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
            inputMode="numeric"
            autoComplete="off"
            autoFocus
            dir="ltr"
            maxLength={10}
            placeholder="1200145"
            value={plate}
            onChange={(e) => onPlateChange(e.target.value)}
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
              أدخل رقم اللوحة المكوّن من 7 أرقام للتحقق من تسجيله ضمن أسطول الشركة.
            </p>
          )}
          {verification === 'idle' && (
            <p className="text-sm font-medium leading-6 text-slate-700">
              أدخل رقم اللوحة المكوّن من 7 أرقام للتحقق من تسجيله ضمن أسطول الشركة.
            </p>
          )}
        </div>
      </div>
    </StepShell>
  )
}
