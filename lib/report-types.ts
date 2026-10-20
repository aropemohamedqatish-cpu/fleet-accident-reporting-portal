import type { AllowedMime } from './validation'

export type LocationData =
  | { mode: 'gps'; lat: number; lng: number; accuracy: number }
  | { mode: 'manual'; description: string }

export type MediaItem = {
  id: string
  file: File
  mime: AllowedMime
  previewUrl: string
}

export type SubmissionOutcome = {
  ticketId: string
  status: 'submitted' | 'staged'
  submittedAt: string
}
