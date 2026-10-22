'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { toast } from 'sonner'
import { IncidentSubmissionError, submitIncident } from '@/lib/incident-submission'
import type { LocationData, MediaItem, SubmissionOutcome, Vehicle } from '@/lib/report-types'
import type { IncidentPayload, ReporterData, ReporterInput } from '@/lib/validation'
import type { SyrianGovernorate } from '@/lib/syrian-governorates'
import { WelcomeScreen } from './welcome-screen'
import { StepIndicator } from './step-indicator'
import { StepVehicle, type VehicleStepMode } from './step-vehicle'
import { StepLocation } from './step-location'
import { StepMedia } from './step-media'
import { StepDetails } from './step-details'
import { SuccessScreen } from './success-screen'

type Step = 0 | 1 | 2 | 3 | 4 | 5
const EMPTY_REPORTER: ReporterInput = { fullName: '', mobile: '', notes: '' }

export function DriverPortal() {
  const [step, setStep] = useState<Step>(0)
  const [plate, setPlate] = useState('')
  const [plateMode, setPlateMode] = useState<VehicleStepMode>('legacy')
  const [governorate, setGovernorate] = useState<SyrianGovernorate | ''>('')
  const [vehicle, setVehicle] = useState<Vehicle | null>(null)
  const [location, setLocation] = useState<LocationData | null>(null)
  const [manualText, setManualText] = useState('')
  const [photos, setPhotos] = useState<MediaItem[]>([])
  const [reporter, setReporter] = useState<ReporterInput>(EMPTY_REPORTER)
  const [submitted, setSubmitted] = useState<{ outcome: SubmissionOutcome; data: ReporterData } | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const idempotencyKey = useRef<string | null>(null)
  const inFlight = useRef(false)
  const photosRef = useRef(photos)
  photosRef.current = photos

  useEffect(
    () => () => photosRef.current.forEach((item) => URL.revokeObjectURL(item.previewUrl)),
    [],
  )

  const go = (s: Step) => {
    setStep(s)
    window.scrollTo({ top: 0 })
  }

  function removeMedia(id: string) {
    const item = photos.find((media) => media.id === id)
    if (item) URL.revokeObjectURL(item.previewUrl)
    setPhotos((prev) => prev.filter((media) => media.id !== id))
  }

  function resetReport() {
    photos.forEach((item) => URL.revokeObjectURL(item.previewUrl))
    setPlate('')
    setPlateMode('legacy')
    setGovernorate('')
    setVehicle(null)
    setLocation(null)
    setManualText('')
    setPhotos([])
    setReporter(EMPTY_REPORTER)
    setSubmitted(null)
    idempotencyKey.current = null
    go(1)
  }

  async function handleSubmit(data: ReporterData) {
    if (inFlight.current || !vehicle || !location) return
    inFlight.current = true
    setSubmitting(true)

    idempotencyKey.current ??= crypto.randomUUID()
    const key = idempotencyKey.current
    const payload: IncidentPayload = {
      plate: vehicle.plate,
      governorate: vehicle.governorate,
      location,
      reporter: data,
      photos: photos.map((photo) => ({ name: photo.file.name, size: photo.file.size, type: photo.mime })),
      createdAt: new Date().toISOString(),
    }
    const files = photos.map((photo) => photo.file)

    try {
      const res = await submitIncident(payload, key, files)
      const outcome: SubmissionOutcome = { ticketId: res.incidentId, status: 'submitted', submittedAt: payload.createdAt }
      setSubmitted({ outcome, data })
      go(5)
    } catch (err) {
      if (err instanceof IncidentSubmissionError) {
        toast.error('تعذّر إرسال البلاغ', { description: err.message })
      } else {
        toast.error('تعذّر إرسال البلاغ', {
          description: err instanceof Error ? err.message : 'حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.',
        })
      }
    } finally {
      inFlight.current = false
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-dvh justify-center bg-muted md:py-8">
      <main className="flex w-full max-w-md flex-col overflow-hidden bg-background md:rounded-3xl md:border md:shadow-xl">
        {step > 0 && (
          <header className="flex items-center justify-between border-b bg-card px-5 py-3">
            <Image src="/images/arope-logo.png" alt="آروب سورية" width={2576} height={826} className="h-8 w-auto" />
            <span className="text-xs font-medium text-muted-foreground">بلاغ حادث أسطول</span>
          </header>
        )}

        {step >= 1 && step <= 4 && <StepIndicator current={step} />}

        {step === 0 && <WelcomeScreen onStart={() => go(1)} />}
        {step === 1 && (
          <StepVehicle
            plate={plate}
            governorate={governorate}
            mode={plateMode}
            onModeChange={setPlateMode}
            onPlateChange={(value) => {
              setPlate(value)
              setVehicle(null)
            }}
            onGovernorateChange={(value) => {
              setGovernorate(value)
              setVehicle(null)
            }}
            onVehicleVerified={setVehicle}
            onBack={() => go(0)}
            onNext={() => go(2)}
          />
        )}
        {step === 2 && (
          <StepLocation
            location={location}
            manualText={manualText}
            onManualTextChange={setManualText}
            onLocation={setLocation}
            onBack={() => go(1)}
            onNext={() => go(3)}
          />
        )}
        {step === 3 && (
          <StepMedia
            photos={photos}
            onAdd={(items) => setPhotos((prev) => [...prev, ...items])}
            onRemove={removeMedia}
            onBack={() => go(2)}
            onNext={() => go(4)}
          />
        )}
        {step === 4 && (
          <StepDetails
            values={reporter}
            onChange={setReporter}
            onBack={() => go(3)}
            onSubmit={handleSubmit}
            submitting={submitting}
          />
        )}
        {step === 5 && submitted && vehicle && location && (
          <SuccessScreen
            outcome={submitted.outcome}
            vehicle={vehicle}
            location={location}
            reporter={submitted.data}
            photoCount={photos.length}
            onNewReport={resetReport}
          />
        )}
      </main>
    </div>
  )
}
