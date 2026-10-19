import type { IncidentPayload } from './validation'

export type StagedReport = {
  idempotencyKey: string
  payload: IncidentPayload
  stagedAt: string
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
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
    tx.oncomplete = () => db.close()
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

export async function submitIncident(payload: IncidentPayload, idempotencyKey: string): Promise<SubmitResult> {
  const res = await fetch('/api/incidents', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Idempotency-Key': idempotencyKey },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(`Submission failed (${res.status})`)
  return res.json()
}

/** Replays every staged report; the idempotency key guarantees no duplicates server-side. */
export async function flushOutbox(): Promise<SubmitResult[]> {
  const staged = await listStaged()
  const results: SubmitResult[] = []
  for (const item of staged) {
    try {
      results.push(await submitIncident(item.payload, item.idempotencyKey))
      await removeStaged(item.idempotencyKey)
    } catch {
      break
    }
  }
  return results
}
