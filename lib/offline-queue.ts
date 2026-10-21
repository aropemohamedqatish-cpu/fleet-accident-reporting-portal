import type { IncidentPayload } from './validation'

export type StagedReport = {
  idempotencyKey: string
  payload: IncidentPayload
  files: File[]
  stagedAt: string
  syncError?: {
    message: string
    status: number | null
    failedAt: string
  }
}

const DB_NAME = 'arope-fleet-reports'
const STORE = 'outbox'

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1)
    req.onupgradeneeded = () => {
      req.result.createObjectStore(STORE, { keyPath: 'idempotencyKey' })
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

async function withStore<T>(mode: IDBTransactionMode, run: (store: IDBObjectStore) => IDBRequest<T>) {
  const db = await openDb()
  return new Promise<T>((resolve, reject) => {
    const tx = db.transaction(STORE, mode)
    const req = run(tx.objectStore(STORE))
    let result!: T
    req.onsuccess = () => {
      result = req.result
    }
    req.onerror = () => reject(req.error ?? new Error('تعذّر الوصول إلى البلاغات المحفوظة.'))
    tx.oncomplete = () => {
      db.close()
      resolve(result)
    }
    tx.onerror = () => {
      db.close()
      reject(tx.error ?? new Error('تعذّر إتمام عملية حفظ البلاغات.'))
    }
    tx.onabort = () => {
      db.close()
      reject(tx.error ?? new Error('تم إلغاء عملية حفظ البلاغات.'))
    }
  })
}

export function stageReport(report: StagedReport) {
  return withStore('readwrite', (s) => s.put(report))
}

export function listStaged() {
  return withStore<StagedReport[]>('readonly', (s) => s.getAll() as IDBRequest<StagedReport[]>)
}

export function removeStaged(key: string) {
  return withStore('readwrite', (s) => s.delete(key))
}

export type SubmitResult = { incidentId: string; replayed: boolean }
export type OutboxSyncResult = {
  sent: SubmitResult[]
  failed: Array<{ idempotencyKey: string; message: string; status: number | null }>
}

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

  const res = await fetch('/api/incidents', {
    method: 'POST',
    headers: { 'Idempotency-Key': idempotencyKey },
    body: formData,
  })
  const result: unknown = await res.json().catch(() => null)
  if (!res.ok) {
    const message =
      typeof result === 'object' &&
      result !== null &&
      'error' in result &&
      typeof result.error === 'string'
        ? result.error
        : 'تعذّر إرسال البلاغ. يرجى المحاولة مرة أخرى.'
    throw new IncidentSubmissionError(message, res.status)
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

/** Sends each eligible report independently; rejected reports remain visible and do not block later reports. */
export async function flushOutbox(retryKeys: readonly string[] = []): Promise<OutboxSyncResult> {
  const staged = await listStaged()
  const retryKeySet = new Set(retryKeys)
  const result: OutboxSyncResult = { sent: [], failed: [] }
  for (const item of staged) {
    if (item.syncError && !retryKeySet.has(item.idempotencyKey)) continue
    try {
      result.sent.push(await submitIncident(item.payload, item.idempotencyKey, item.files))
      await removeStaged(item.idempotencyKey)
    } catch (error) {
      const message = error instanceof Error
        ? error.message
        : 'تعذّر إرسال البلاغ. يرجى المحاولة مرة أخرى.'
      const status = error instanceof IncidentSubmissionError ? error.status : null
      await stageReport({
        ...item,
        syncError: { message, status, failedAt: new Date().toISOString() },
      })
      result.failed.push({ idempotencyKey: item.idempotencyKey, message, status })

      if (
        !(error instanceof IncidentSubmissionError) ||
        error.status >= 500 ||
        [408, 425, 429].includes(error.status)
      ) {
        break
      }
    }
  }
  return result
}
