export type ExistingIdempotentIncident = {
  id: string
  requestHash: string
}

export type IdempotencyResult =
  | { kind: 'replay'; incidentId: string }
  | { kind: 'conflict' }
  | { kind: 'new' }

export function resolveIdempotency(
  existing: ExistingIdempotentIncident | null,
  requestHash: string,
): IdempotencyResult {
  if (!existing) return { kind: 'new' }
  if (existing.requestHash !== requestHash) return { kind: 'conflict' }
  return { kind: 'replay', incidentId: existing.id }
}
