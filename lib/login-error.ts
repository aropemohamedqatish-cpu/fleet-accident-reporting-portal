type ErrorDetails = {
  code?: string
  message?: string
  cause?: unknown
  metaCode?: string
}

function getErrorDetails(error: unknown): ErrorDetails {
  if (typeof error !== 'object' || error === null) return {}
  const candidate = error as Record<string, unknown>
  return {
    code: typeof candidate.code === 'string' ? candidate.code : undefined,
    message: typeof candidate.message === 'string' ? candidate.message : undefined,
    cause: candidate.cause,
    metaCode:
      typeof candidate.meta === 'object' &&
      candidate.meta !== null &&
      'code' in candidate.meta &&
      typeof candidate.meta.code === 'string'
        ? candidate.meta.code
        : undefined,
  }
}

function collectErrorDetails(error: unknown): ErrorDetails[] {
  const details: ErrorDetails[] = []
  const seen = new Set<unknown>()
  let current = error
  while (current && details.length < 5 && !seen.has(current)) {
    seen.add(current)
    const detail = getErrorDetails(current)
    details.push(detail)
    current = detail.cause
  }
  return details
}

export type LoginFailureCategory = 'schema' | 'database_unavailable' | 'configuration' | 'unexpected'

export function classifyLoginFailure(error: unknown): LoginFailureCategory {
  const details = collectErrorDetails(error)
  if (
    details.some(({ message }) =>
      /JWT_SECRET is missing or invalid|DATABASE_URL is missing|DATABASE_URL is invalid/i.test(message ?? ''),
    )
  ) {
    return 'configuration'
  }

  if (
    details.some(({ code, metaCode }) =>
      ['P2021', 'P2022', '42P01', '42703'].includes(code ?? '') ||
      ['42P01', '42703'].includes(metaCode ?? ''),
    ) ||
    details.some(({ message }) =>
      /relation .* does not exist|column .* does not exist|table .* does not exist/i.test(message ?? ''),
    )
  ) {
    return 'schema'
  }

  if (
    details.some(({ code }) =>
      ['P1001', 'P1002', 'P1008', 'P1017', 'ECONNREFUSED', 'ETIMEDOUT'].includes(code ?? ''),
    ) ||
    details.some(({ message }) =>
      /can't reach database server|connection terminated|connection refused|timed out/i.test(message ?? ''),
    )
  ) {
    return 'database_unavailable'
  }

  return 'unexpected'
}

export function getLoginFailureMessage(category: LoginFailureCategory): string {
  if (category === 'schema') {
    return 'تحتاج قاعدة البيانات إلى تطبيق تحديثات النظام. يرجى التواصل مع مسؤول التشغيل لتطبيق ترحيلات Prisma.'
  }
  if (category === 'database_unavailable') {
    return 'قاعدة البيانات غير متاحة حالياً. يرجى المحاولة لاحقاً أو التواصل مع مسؤول التشغيل.'
  }
  if (category === 'configuration') {
    return 'إعدادات أمان تسجيل الدخول غير مكتملة على الخادم. يرجى التواصل مع مسؤول التشغيل.'
  }
  return 'تعذّر تسجيل الدخول حالياً. يرجى المحاولة لاحقاً.'
}

export function getSafeLoginErrorLog(error: unknown): { name: string; code?: string; message?: string } {
  const details = collectErrorDetails(error)
  const name =
    typeof error === 'object' && error !== null && 'name' in error && typeof error.name === 'string'
      ? error.name
      : 'UnknownError'
  const code = details.find((detail) => detail.code || detail.metaCode)
  const message = details.find((detail) => detail.message)?.message
  const safeMessage = message
    ? redactSensitiveErrorText(message).slice(0, 300)
    : undefined
  return {
    name,
    ...((code?.code ?? code?.metaCode) ? { code: code?.code ?? code?.metaCode } : {}),
    ...(safeMessage ? { message: safeMessage } : {}),
  }
}

function redactSensitiveErrorText(message: string): string {
  let safeMessage = message

  for (const secret of [process.env.DATABASE_URL, process.env.JWT_SECRET, process.env.ADMIN_PASSWORD]) {
    if (secret) safeMessage = safeMessage.replaceAll(secret, '[redacted]')
  }

  return safeMessage
    .replace(/\bpostgres(?:ql)?:\/\/[^\s"'`]+/gi, '[database URL]')
    .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, '[email]')
}
