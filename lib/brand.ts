export const BRAND = {
  name: 'آروب سورية',
  fullName: 'آروب سورية للتأمين',
  driverProduct: 'بوابة حوادث الأسطول',
  consoleProduct: 'منصة إدارة الحوادث',
} as const

export const EMERGENCY = {
  ambulance: '110',
  police: '112',
  /** On-call emergency supervisor. Override per environment with NEXT_PUBLIC_EMERGENCY_PHONE. */
  supervisorPhone: process.env.NEXT_PUBLIC_EMERGENCY_PHONE ?? '0999999999',
} as const

const LATIN_DIGITS = 'ar-SY-u-nu-latn'
const TIME_ZONE = 'Asia/Damascus'

const dateTimeFormat = new Intl.DateTimeFormat(LATIN_DIGITS, {
  dateStyle: 'medium',
  timeStyle: 'short',
  timeZone: TIME_ZONE,
})
const dateFormat = new Intl.DateTimeFormat(LATIN_DIGITS, { dateStyle: 'medium', timeZone: TIME_ZONE })
const longDateFormat = new Intl.DateTimeFormat(LATIN_DIGITS, {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: TIME_ZONE,
})
const timeFormat = new Intl.DateTimeFormat(LATIN_DIGITS, { hour: '2-digit', minute: '2-digit', timeZone: TIME_ZONE })
const relativeFormat = new Intl.RelativeTimeFormat('ar-u-nu-latn', { numeric: 'auto' })
const numberFormat = new Intl.NumberFormat('en-US')

/** All operational dates are rendered in Damascus time with Latin digits for unambiguous reading. */
export const formatDateTime = (date: Date) => dateTimeFormat.format(date)
export const formatDate = (date: Date) => dateFormat.format(date)
export const formatLongDate = (date: Date) => longDateFormat.format(date)
export const formatTime = (date: Date) => timeFormat.format(date)
export const formatNumber = (value: number) => numberFormat.format(value)

export function formatRelative(date: Date, now: Date = new Date()): string {
  const seconds = Math.round((date.getTime() - now.getTime()) / 1000)
  const abs = Math.abs(seconds)
  if (abs < 45) return 'الآن'
  if (abs < 3600) return relativeFormat.format(Math.round(seconds / 60), 'minute')
  if (abs < 86400) return relativeFormat.format(Math.round(seconds / 3600), 'hour')
  if (abs < 2_592_000) return relativeFormat.format(Math.round(seconds / 86400), 'day')
  return relativeFormat.format(Math.round(seconds / 2_592_000), 'month')
}
