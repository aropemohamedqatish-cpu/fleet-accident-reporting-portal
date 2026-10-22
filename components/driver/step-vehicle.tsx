'use client'

import { useEffect, useId, useState } from 'react'
import { AlertCircle, CheckCircle2, LoaderCircle, XCircle } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Segmented, type SegmentedOption } from '@/components/ui/segmented'
import type { Vehicle } from '@/lib/report-types'
import {
  isSyrianGovernorate,
  SYRIAN_GOVERNORATES,
  type SyrianGovernorate,
} from '@/lib/syrian-governorates'
import {
  getPlateDigitCount,
  getPlateSearchCandidates,
  isCompleteModernPlate,
  normalizeDigits,
} from '@/lib/plate'
import { StepShell } from './step-shell'
import { cn } from '@/lib/utils'

export type VehicleStepMode = 'legacy' | 'modern'

type Props = {
  plate: string
  governorate: string
  mode: VehicleStepMode
  onModeChange: (mode: VehicleStepMode) => void
  onPlateChange: (value: string) => void
  onGovernorateChange: (value: SyrianGovernorate | '') => void
  onVehicleVerified: (vehicle: Vehicle | null) => void
  onBack: () => void
  onNext: () => void
}

type VerificationState = 'idle' | 'incomplete' | 'checking' | 'valid' | 'invalid' | 'error'

const MODE_OPTIONS: readonly SegmentedOption<VehicleStepMode>[] = [
  { value: 'legacy', label: 'لوحة قديمة' },
  { value: 'modern', label: 'لوحة حديثة' },
]

function digitsOnly(value: string): string {
  return normalizeDigits(value).replace(/\D/g, '')
}

function GovernorateSelect({
  value,
  onChange,
}: {
  value: string
  onChange: (value: SyrianGovernorate | '') => void
}) {
  const id = useId()

  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id} className="text-base font-medium">
        المحافظة <span className="text-destructive" aria-hidden="true">*</span>
      </Label>
      <select
        id={id}
        required
        value={value}
        onChange={(event) => {
          const selected = event.target.value
          onChange(isSyrianGovernorate(selected) ? selected : '')
        }}
        className="h-12 rounded-xl border border-input bg-white px-3 text-base text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <option value="">اختر المحافظة</option>
        {SYRIAN_GOVERNORATES.map(({ value: governorate, label }) => (
          <option key={governorate} value={governorate}>
            {label}
          </option>
        ))}
      </select>
    </div>
  )
}

function LegacyPlateInput({
  value,
  onChange,
  isVerified,
  showError,
}: {
  value: string
  onChange: (value: string) => void
  isVerified: boolean
  showError: boolean
}) {
  const id = useId()

  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id} className="text-base font-medium">
        رقم لوحة المركبة
      </Label>
      <div
        className={cn(
          'flex h-[4.5rem] items-stretch overflow-hidden rounded-xl border-[3px] border-[#003366] bg-white shadow-inner transition-colors',
          isVerified && 'border-emerald-500',
          showError && 'border-red-500',
        )}
        dir="ltr"
      >
        <span className="flex w-20 shrink-0 items-center justify-center bg-[#003366] text-sm font-bold text-white">
          سورية
        </span>
        <Input
          id={id}
          inputMode="numeric"
          autoComplete="off"
          dir="ltr"
          placeholder="120145"
          value={value}
          onChange={(event) => onChange(digitsOnly(event.target.value).slice(0, 6))}
          className={cn(
            'h-full rounded-none border-0 bg-transparent text-center text-3xl font-bold tracking-[0.3em] text-[#003366] placeholder:text-[#003366]/20 tabular-nums shadow-none focus-visible:ring-0',
            isVerified && 'bg-emerald-50',
            showError && 'bg-red-50',
          )}
          aria-label="رقم اللوحة القديمة - 6 أرقام"
        />
      </div>
    </div>
  )
}

function ModernPlateInput({
  value,
  onChange,
  isVerified,
  showError,
}: {
  value: string
  onChange: (value: string) => void
  isVerified: boolean
  showError: boolean
}) {
  const [storedPrefix, storedSerial = ''] = value.split('/')
  const prefix = digitsOnly(storedPrefix).slice(0, 3)
  const serial = digitsOnly(storedSerial).slice(0, Math.max(0, 7 - prefix.length))
  const prefixId = useId()
  const serialId = useId()

  return (
    <div className="flex flex-col gap-2">
      <Label className="text-base font-medium">رقم لوحة المركبة</Label>
      <div
        className={cn(
          'flex h-[4.5rem] items-stretch overflow-hidden rounded-xl border-[3px] border-[#003366] bg-white shadow-inner transition-colors',
          isVerified && 'border-emerald-500',
          showError && 'border-red-500',
        )}
        dir="ltr"
      >
        <span className="flex w-20 shrink-0 items-center justify-center bg-[#003366] text-sm font-bold text-white">
          سورية
        </span>
        <Input
          id={prefixId}
          autoComplete="off"
          inputMode="numeric"
          value={prefix}
          placeholder="12"
          onChange={(event) => {
            const nextPrefix = digitsOnly(event.target.value).slice(0, 3)
            const nextSerial = serial.slice(0, Math.max(0, 7 - nextPrefix.length))
            onChange(`${nextPrefix}/${nextSerial}`)
          }}
          className={cn(
            'h-full min-w-0 flex-1 rounded-none border-0 bg-transparent px-1 text-center text-2xl font-bold tracking-[0.12em] text-[#003366] placeholder:text-[#003366]/20 tabular-nums shadow-none focus-visible:ring-0 sm:text-3xl',
            isVerified && 'bg-emerald-50',
            showError && 'bg-red-50',
          )}
          aria-label="الجزء الأول من اللوحة - رقمان أو 3 أرقام"
          aria-describedby={`${prefixId}-hint`}
        />
        <span className="flex items-center justify-center px-1 text-3xl font-bold text-[#003366]" aria-hidden="true">
          /
        </span>
        <Input
          id={serialId}
          autoComplete="off"
          inputMode="numeric"
          value={serial}
          placeholder={prefix.length === 2 ? '34567' : '3456'}
          disabled={prefix.length < 2}
          onChange={(event) => {
            if (prefix.length < 2) return
            const nextSerial = digitsOnly(event.target.value).slice(0, Math.max(0, 7 - prefix.length))
            onChange(`${prefix}/${nextSerial}`)
          }}
          className={cn(
            'h-full min-w-0 flex-[1.5] rounded-none border-0 bg-transparent px-1 text-center text-2xl font-bold tracking-[0.12em] text-[#003366] placeholder:text-[#003366]/20 tabular-nums shadow-none focus-visible:ring-0 disabled:cursor-not-allowed disabled:opacity-50 sm:text-3xl',
            isVerified && 'bg-emerald-50',
            showError && 'bg-red-50',
          )}
          aria-label="بقية أرقام اللوحة حتى يصبح المجموع 7 أرقام"
        />
      </div>
      <p id={`${prefixId}-hint`} className="text-xs text-muted-foreground">
        أدخل رقمين أو 3 أرقام في الخانة الأولى، ثم أكمل إلى 7 أرقام.
      </p>
    </div>
  )
}

export function StepVehicle({
  plate,
  governorate,
  mode,
  onModeChange,
  onPlateChange,
  onGovernorateChange,
  onVehicleVerified,
  onBack,
  onNext,
}: Props) {
  const digitCount = getPlateDigitCount(plate)
  const [verification, setVerification] = useState<VerificationState>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const feedbackId = useId()
  const expectedDigits = mode === 'legacy' ? 6 : 7
  const isComplete =
    mode === 'legacy'
      ? digitCount === expectedDigits && Boolean(governorate)
      : isCompleteModernPlate(plate)
  const isVerified = verification === 'valid'
  const showError = verification === 'invalid' || verification === 'error'

  useEffect(() => {
    if (!isComplete) {
      setVerification(digitCount > 0 ? 'incomplete' : 'idle')
      setErrorMessage('')
      onVehicleVerified(null)
      return
    }

    const controller = new AbortController()
    const verify = async () => {
      setVerification('checking')
      setErrorMessage('')

      try {
        const candidates = getPlateSearchCandidates(plate)
        if (candidates.length === 0) {
          setVerification('invalid')
          setErrorMessage('صيغة رقم اللوحة غير صالحة.')
          onVehicleVerified(null)
          return
        }

        const params = new URLSearchParams({ plate })
        if (mode === 'legacy') params.set('governorate', governorate)
        const response = await fetch(`/api/vehicles?${params.toString()}`, {
          cache: 'no-store',
          signal: controller.signal,
        })
        const result: unknown = await response.json().catch(() => null)
        if (!response.ok) {
          const message =
            typeof result === 'object' &&
            result !== null &&
            'error' in result &&
            typeof result.error === 'string'
              ? result.error
              : 'المركبة غير مسجلة أو غير مفعّلة.'
          setVerification('invalid')
          setErrorMessage(message)
          onVehicleVerified(null)
          return
        }

        if (
          typeof result !== 'object' ||
          result === null ||
          !('plate' in result) ||
          typeof result.plate !== 'string' ||
          !('governorate' in result) ||
          (typeof result.governorate !== 'string' && result.governorate !== null) ||
          (typeof result.governorate === 'string' && !isSyrianGovernorate(result.governorate))
        ) {
          throw new Error('استجابة غير صالحة من خدمة التحقق.')
        }

        setVerification('valid')
        onVehicleVerified({ plate: result.plate, governorate: result.governorate })
      } catch (error) {
        if (controller.signal.aborted) return
        setVerification('error')
        setErrorMessage(error instanceof Error ? error.message : 'تعذّر التحقق من المركبة حالياً.')
        onVehicleVerified(null)
      }
    }

    void verify()
    return () => controller.abort()
  }, [digitCount, governorate, isComplete, mode, onVehicleVerified, plate])

  function changeMode(nextMode: VehicleStepMode) {
    if (nextMode === mode) return
    onVehicleVerified(null)
    onPlateChange('')
    onGovernorateChange('')
    onModeChange(nextMode)
  }

  return (
    <StepShell
      title="معلومات المركبة"
      description="اختر نوع اللوحة، ثم أدخل رقمها للتحقق من تسجيل المركبة ضمن الأسطول."
      onBack={onBack}
      onNext={onNext}
      nextDisabled={!isVerified}
    >
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <Label className="text-base font-medium">نوع لوحة المركبة</Label>
          <Segmented
            label="نوع لوحة المركبة"
            options={MODE_OPTIONS}
            value={mode}
            onChange={changeMode}
            className="w-full justify-center"
          />
        </div>

        {mode === 'legacy' ? (
          <>
            <GovernorateSelect value={governorate} onChange={onGovernorateChange} />
            <LegacyPlateInput
              value={digitsOnly(plate).slice(0, 6)}
              onChange={onPlateChange}
              isVerified={isVerified}
              showError={showError}
            />
          </>
        ) : (
          <ModernPlateInput
            value={plate}
            onChange={onPlateChange}
            isVerified={isVerified}
            showError={showError}
          />
        )}

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
              {mode === 'legacy'
                ? digitCount === 6 && !governorate
                  ? 'اختر المحافظة لإكمال التحقق.'
                  : 'أدخل 6 أرقام فقط للوحة القديمة.'
                : 'أكمل إدخال 7 أرقام للوحة الحديثة.'}
            </p>
          )}
          {verification === 'idle' && (
            <p className="text-sm font-medium leading-6 text-slate-700">
              {mode === 'legacy'
                ? 'اختر المحافظة وأدخل 6 أرقام للتحقق من المركبة.'
                : 'أدخل 7 أرقام في جزأي اللوحة للتحقق من المركبة.'}
            </p>
          )}
        </div>
      </div>
    </StepShell>
  )
}
