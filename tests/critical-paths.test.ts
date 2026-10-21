import assert from 'node:assert/strict'
import test from 'node:test'
import { canTransitionIncidentStatus, requiresStatusTransitionConfirmation } from '../lib/admin-claims'
import { resolveIdempotency } from '../lib/idempotency'
import {
  isAccountLoginAllowed,
  isLoginRateLimited,
  loginCredentialsSchema,
  shouldRedirectForForcedPasswordChange,
} from '../lib/login-validation'
import { incidentPayloadSchema } from '../lib/validation'
import { classifyLoginFailure, getLoginFailureMessage, getSafeLoginErrorLog } from '../lib/login-error'
import { verifySessionToken } from '../lib/session-token'

test('incident validation accepts a valid payload and rejects invalid plate and empty media', () => {
  const validPayload = {
    plate: '1200145',
    location: { mode: 'manual', description: 'تقاطع شارع رئيسي' },
    reporter: {
      fullName: 'محمد خالد قطيش',
      mobile: '0992576455',
      notes: 'وقع اصطدام أثناء السير قرب التقاطع.',
    },
    photos: [{ name: 'incident.webp', size: 1024, type: 'image/webp' }],
    createdAt: '2026-10-21T07:00:00.000Z',
  }

  assert.equal(incidentPayloadSchema.safeParse(validPayload).success, true)
  assert.equal(incidentPayloadSchema.safeParse({ ...validPayload, plate: 'ABC' }).success, false)
  assert.equal(incidentPayloadSchema.safeParse({ ...validPayload, photos: [] }).success, false)
  assert.equal(
    incidentPayloadSchema.safeParse({
      ...validPayload,
      videos: [
        { name: 'one.mp4', size: 1024, type: 'video/mp4' },
        { name: 'two.webm', size: 1024, type: 'video/webm' },
      ],
    }).success,
    false,
  )
})

test('idempotency replays the same request and rejects a changed payload', () => {
  const existing = { id: 'incident-1', requestHash: 'hash-a' }
  assert.deepEqual(resolveIdempotency(existing, 'hash-a'), { kind: 'replay', incidentId: 'incident-1' })
  assert.deepEqual(resolveIdempotency(existing, 'hash-b'), { kind: 'conflict' })
  assert.deepEqual(resolveIdempotency(null, 'hash-a'), { kind: 'new' })
})

test('login validates credentials and rate limits repeated failures', () => {
  const valid = loginCredentialsSchema.safeParse({
    email: '  ADMIN@EXAMPLE.COM ',
    password: 'a-valid-password',
  })
  assert.equal(valid.success, true)
  if (valid.success) assert.equal(valid.data.email, 'admin@example.com')

  assert.equal(loginCredentialsSchema.safeParse({ email: 'bad', password: 'password' }).success, false)
  assert.equal(isLoginRateLimited(4, 19), false)
  assert.equal(isLoginRateLimited(5, 0), true)
  assert.equal(isLoginRateLimited(0, 20), true)
  assert.equal(isAccountLoginAllowed(true, true), true)
  assert.equal(isAccountLoginAllowed(false, true), false)
  assert.equal(isAccountLoginAllowed(true, false), false)
  assert.equal(shouldRedirectForForcedPasswordChange('/admin/dashboard', true), true)
  assert.equal(shouldRedirectForForcedPasswordChange('/admin/change-password', true), false)
  assert.equal(shouldRedirectForForcedPasswordChange('/admin/login', true), false)
})

test('login failures distinguish unapplied migrations from database outages without exposing raw errors', () => {
  assert.equal(classifyLoginFailure({ code: 'P2022', message: 'column AdminUser.sessionVersion does not exist' }), 'schema')
  assert.equal(classifyLoginFailure({ code: 'P1001', message: 'database unavailable' }), 'database_unavailable')
  assert.equal(classifyLoginFailure(new Error('JWT_SECRET is missing or invalid.')), 'configuration')
  assert.equal(classifyLoginFailure(new Error('unexpected')), 'unexpected')
  assert.match(getLoginFailureMessage('schema'), /ترحيلات Prisma/)
  assert.doesNotMatch(getLoginFailureMessage('database_unavailable'), /DATABASE_URL|postgres:\/\//)
  assert.match(getLoginFailureMessage('configuration'), /إعدادات أمان تسجيل الدخول/)

  const safeLog = getSafeLoginErrorLog(new TypeError('Failed for postgres://user:password@db.example.test/app as admin@example.test'))
  assert.match(safeLog.message ?? '', /Failed for \[database URL\] as \[email\]/)
  assert.doesNotMatch(safeLog.message ?? '', /password|admin@example\.test/)
})

test('invalid session tokens are rejected when the signing secret is unavailable', async () => {
  const originalSecret = process.env.JWT_SECRET
  delete process.env.JWT_SECRET
  try {
    assert.equal(await verifySessionToken('invalid-token'), null)
  } finally {
    if (originalSecret === undefined) delete process.env.JWT_SECRET
    else process.env.JWT_SECRET = originalSecret
  }
})

test('incident status transitions are sequential and important transitions require confirmation', () => {
  assert.equal(canTransitionIncidentStatus('SUBMITTED', 'UNDER_REVIEW'), true)
  assert.equal(canTransitionIncidentStatus('SUBMITTED', 'CLOSED'), false)
  assert.equal(canTransitionIncidentStatus('CLOSED', 'UNDER_REVIEW'), false)
  assert.equal(requiresStatusTransitionConfirmation('SENT_TO_INSURER'), true)
  assert.equal(requiresStatusTransitionConfirmation('CLOSED'), true)
  assert.equal(requiresStatusTransitionConfirmation('UNDER_REVIEW'), false)
})
