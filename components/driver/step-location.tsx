'use client'

import { useId, useState } from 'react'
import { MapPin, Loader2, LocateFixed, AlertTriangle, PencilLine } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { LocationData } from '@/lib/report-types'
import { StepShell } from './step-shell'

type GeoState = 'idle' | 'locating' | 'failed'

type Props = {
  location: LocationData | null
  manualText: string
  onManualTextChange: (v: string) => void
  onLocation: (loc: LocationData | null) => void
  onBack: () => void
  onNext: () => void
}

const FAILURE_MESSAGES: Record<number, string> = {
  1: 'تم رفض إذن الوصول إلى الموقع.',
  2: 'تعذّر تحديد الموقع بسبب ضعف الإشارة أو الشبكة.',
  3: 'انتهت مهلة تحديد الموقع.',
}

export function StepLocation({ location, manualText, onManualTextChange, onLocation, onBack, onNext }: Props) {
  const textId = useId()
  const [geoState, setGeoState] = useState<GeoState>('idle')
  const [failure, setFailure] = useState<string | null>(null)
  const [manualMode, setManualMode] = useState(location?.mode === 'manual')

  const gps = location?.mode === 'gps' ? location : null
  const manualValid = manualText.trim().length >= 5
  const canContinue = Boolean(gps) || (manualMode && manualValid)

  function requestLocation() {
    if (!('geolocation' in navigator)) {
      setFailure('جهازك لا يدعم تحديد الموقع.')
      setGeoState('failed')
      setManualMode(true)
      return
    }
    setGeoState('locating')
    setFailure(null)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGeoState('idle')
        setManualMode(false)
        onLocation({ mode: 'gps', lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy })
      },
      (err) => {
        setGeoState('failed')
        setFailure(FAILURE_MESSAGES[err.code] ?? 'تعذّر تحديد الموقع.')
        setManualMode(true)
        onLocation(null)
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 30000 },
    )
  }

  function handleNext() {
    if (!gps && manualMode) onLocation({ mode: 'manual', description: manualText.trim() })
    onNext()
  }

  return (
    <StepShell
      title="موقع الحادث"
      description="نحتاج إلى موقع الحادث لإرسال المساعدة وتوثيق المطالبة بدقة."
      onBack={onBack}
      onNext={handleNext}
      nextDisabled={!canContinue}
    >
      {gps ? (
        <div className="flex flex-col gap-3 rounded-xl border border-success/40 bg-success/5 p-4" role="status">
          <div className="flex items-center gap-2 font-semibold text-success">
            <MapPin className="size-5" aria-hidden="true" />
            تم تحديد موقعك بنجاح
          </div>
          <dl className="grid grid-cols-2 gap-2 text-sm">
            <div className="rounded-lg bg-card p-3">
              <dt className="text-muted-foreground">خط العرض</dt>
              <dd className="font-mono font-semibold" dir="ltr">{gps.lat.toFixed(6)}</dd>
            </div>
            <div className="rounded-lg bg-card p-3">
              <dt className="text-muted-foreground">خط الطول</dt>
              <dd className="font-mono font-semibold" dir="ltr">{gps.lng.toFixed(6)}</dd>
            </div>
          </dl>
          <p className="text-xs text-muted-foreground">{`دقة التحديد: ±${Math.round(gps.accuracy)} متر`}</p>
          <Button variant="outline" onClick={requestLocation} className="gap-2">
            <LocateFixed className="size-4" aria-hidden="true" />
            إعادة تحديد الموقع
          </Button>
        </div>
      ) : (
        <Button
          size="lg"
          variant={manualMode ? 'outline' : 'default'}
          className="h-14 gap-2 text-base font-semibold"
          onClick={requestLocation}
          disabled={geoState === 'locating'}
        >
          {geoState === 'locating' ? (
            <Loader2 className="size-5 animate-spin" aria-hidden="true" />
          ) : (
            <LocateFixed className="size-5" aria-hidden="true" />
          )}
          {geoState === 'locating' ? 'جارٍ تحديد موقعك...' : 'تحديد موقعي تلقائياً (GPS)'}
        </Button>
      )}

      {failure && (
        <div role="alert" className="flex items-start gap-2 rounded-xl border border-warning/40 bg-warning/10 p-4 text-sm text-foreground">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden="true" />
          <p>
            <span className="font-semibold">{failure}</span> لا تقلق، يمكنك وصف مكان الحادث يدوياً أدناه.
          </p>
        </div>
      )}

      {!gps && !manualMode && (
        <Button variant="link" className="gap-1.5 self-start px-0" onClick={() => setManualMode(true)}>
          <PencilLine className="size-4" aria-hidden="true" />
          أفضّل وصف الموقع يدوياً
        </Button>
      )}

      {!gps && manualMode && (
        <div className="flex flex-col gap-2">
          <Label htmlFor={textId} className="text-base">
            وصف مكان الحادث يدوياً
          </Label>
          <Textarea
            id={textId}
            rows={4}
            maxLength={500}
            value={manualText}
            onChange={(e) => onManualTextChange(e.target.value)}
            placeholder="مثال: أوتوستراد المزة، قرب جسر الرئيس، الاتجاه نحو ساحة الأمويين"
            className="text-base"
          />
          <p className="text-xs text-muted-foreground">اذكر اسم الشارع وأقرب معلم واضح والاتجاه.</p>
        </div>
      )}
    </StepShell>
  )
}
