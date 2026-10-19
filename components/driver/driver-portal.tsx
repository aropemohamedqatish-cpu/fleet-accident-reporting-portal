'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { toast } from 'sonner'
import { findVehicle, normalizePlate } from '@/lib/fleet-data'
import { stageReport, submitIncident } from '@/lib/offline-queue'
import type { LocationData, PhotoItem, SubmissionOutcome } from '@/lib/report-types'
import type { IncidentPayload, ReporterData, ReporterInput } from '@/lib/validation'
import { useOutboxSync } from '@/hooks/use-outbox-sync'
import { ConnectionBanner } from './connection-banner'
import { WelcomeScreen } from './welcome-screen'
import { StepIndicator } from './step-indicator'
import { StepVehicle } from './step-vehicle'
import { StepLocation } from './step-location'
import { StepMedia } from './step-media'
import { StepDetails } from './step-details'
import { SuccessScreen } from './success-screen'

type Step = 0 | 1 | 2 | 3 | 4 | 5
const EMPTY_REPORTER: ReporterInput = { fullName: '', mobile: '', notes: '' }

export function DriverPortal() {
  const { online, pending, syncing, refresh } = useOutboxSync()
  const [step, setStep] = useState<Step>(0)
  const [plate, setPlate] = useState('')
  const [location, setLocation] = useState<LocationData | null>(null)
  const [manualText, setManualText] = useState('')
  const [photos, setPhotos] = useState<PhotoItem[]>([])
  const [reporter, setReporter] = useState<ReporterInput>(EMPTY_REPORTER)
  const [submitted, setSubmitted] = useState<{ outcome: SubmissionOutcome; data: ReporterData } | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const idempotencyKey = useRef<string | null>(null)
  const inFlight = useRef(false)
  const photosRef = useRef(photos)
  photosRef.current = photos

  useEffect(() => () => photosRef.current.forEach((p) => URL.revokeObjectURL(p.previewUrl)), [])

  const vehicle = findVehicle(plate)
  const go = (s: Step) => {
    setStep(s)
    window.scrollTo({ top: 0 })
  }

  function removePhoto(id: string) {
    setPhotos((prev) => {
      const target = prev.find((p) => p.id === id)
      if (target) URL.revokeObjectURL(target.previewUrl)
      return prev.filter((p) => p.id !== id)
    })
  }

  function resetReport() {
    photos.forEach((p) => URL.revokeObjectURL(p.previewUrl))
    setPlate('')
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
      plate: normalizePlate(plate),
      location,
      reporter: data,
      photos: photos.map((p) => ({ name: p.file.name, size: p.file.size, type: p.mime })),
      createdAt: new Date().toISOString(),
    }

    const stageLocally = async () => {
      await stageReport({ idempotencyKey: key, payload, stagedAt: payload.createdAt })
      await refresh()
      setSubmitted({ outcome: { ticketId: key, status: 'staged', submittedAt: payload.createdAt }, data })
      go(5)
    }

    try {
      if (!navigator.onLine) {
        await stageLocally()
        return
      }
      const res = await submitIncident(payload, key)
      setSubmitted({ outcome: { ticketId: res.incidentId, status: 'submitted', submittedAt: payload.createdAt }, data })
      go(5)
    } catch (err) {
      if (err instanceof TypeError) {
        await stageLocally()
      } else {
        toast.error('تعذّر إرسال البلاغ', { description: 'يرجى المحاولة مرة أخرى. لن يتم تكرار البلاغ.' })
      }
    } finally {
      inFlight.current = false
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-dvh justify-center bg-muted md:py-8">
      <main className="flex w-full max-w-md flex-col overflow-hidden bg-background md:rounded-3xl md:border md:shadow-xl">
        <ConnectionBanner online={online} pending={pending} syncing={syncing} />

        {step > 0 && (
          <header className="flex items-center justify-between border-b bg-card px-5 py-3">
            <Image src="/images/arope-logo.png" alt="آروب سورية" width={2576} height={826} className="h-8 w-auto" />
            <span className="text-xs font-medium text-muted-foreground">بلاغ حادث أسطول</span>
          </header>
        )}

        {step >= 1 && step <= 4 && <StepIndicator current={step} />}

        {step === 0 && <WelcomeScreen onStart={() => go(1)} />}
        {step === 1 && <StepVehicle plate={plate} onPlateChange={setPlate} onBack={() => go(0)} onNext={() => go(2)} />}
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
            onRemove={removePhoto}
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
            online={online}
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
