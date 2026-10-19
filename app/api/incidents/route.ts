import { NextResponse } from 'next/server'
import { findVehicle } from '@/lib/fleet-data'
import { incidentPayloadSchema } from '@/lib/validation'

// Demo-only in-memory idempotency ledger; production should persist this in a database.
const ledger = new Map<string, string>()

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export async function POST(request: Request) {
  const key = request.headers.get('Idempotency-Key')
  if (!key || !UUID_RE.test(key)) {
    return NextResponse.json({ error: 'Missing or invalid Idempotency-Key' }, { status: 400 })
  }

  const existing = ledger.get(key)
  if (existing) {
    return NextResponse.json({ incidentId: existing, replayed: true })
  }

  const body = await request.json().catch(() => null)
  const parsed = incidentPayloadSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', issues: parsed.error.issues }, { status: 422 })
  }
  if (!findVehicle(parsed.data.plate)) {
    return NextResponse.json({ error: 'Unknown fleet vehicle' }, { status: 422 })
  }

  await new Promise((r) => setTimeout(r, 1200))

  const incidentId = crypto.randomUUID()
  ledger.set(key, incidentId)
  return NextResponse.json({ incidentId, replayed: false }, { status: 201 })
}
