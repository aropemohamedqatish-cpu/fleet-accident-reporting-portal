import type { AllowedMime } from './validation'
import type { SyrianGovernorate } from './syrian-governorates'

export type LocationData =
  | { mode: 'gps'; lat: number; lng: number; accuracy: number }
  | { mode: 'manual'; description: string }

export type Vehicle = {
  plate: string
  governorate: SyrianGovernorate
}

export type MediaItem = {
  id: string
  file: File
  mime: AllowedMime
  previewUrl: string
}

export type SubmissionOutcome = {
  ticketId: string
  status: 'submitted'
  submittedAt: string
}
