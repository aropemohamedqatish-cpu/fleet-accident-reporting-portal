import type { IncidentPayload } from './validation'

export type SubmitResult = { incidentId: string; replayed: boolean }

export class IncidentSubmissionError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message)
    this.name = 'IncidentSubmissionError'
  }
}

export async function submitIncident(
  payload: IncidentPayload,
  idempotencyKey: string,
  files: File[],
): Promise<SubmitResult> {
  const formData = new FormData()
  formData.set('payload', JSON.stringify(payload))
  files.forEach((file) => formData.append('files', file, file.name))

  const response = await fetch('/api/incidents', {
    method: 'POST',
    headers: { 'Idempotency-Key': idempotencyKey },
    body: formData,
  })
  const result: unknown = await response.json().catch(() => null)
  if (!response.ok) {
    const message =
      typeof result === 'object' &&
      result !== null &&
      'error' in result &&
      typeof result.error === 'string'
        ? result.error
        : 'تعذّر إرسال البلاغ. يرجى المحاولة مرة أخرى.'
    throw new IncidentSubmissionError(message, response.status)
  }

  if (
    typeof result !== 'object' ||
    result === null ||
    !('incidentId' in result) ||
    typeof result.incidentId !== 'string' ||
    !('replayed' in result) ||
    typeof result.replayed !== 'boolean'
  ) {
    throw new Error('استجابة غير صالحة من خادم البلاغات.')
  }
  return { incidentId: result.incidentId, replayed: result.replayed }
}
