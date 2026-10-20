export const PLATE_LENGTH = 7 as const

/** A fleet plate is exactly 7 digits. */

const DIGIT_MAP: Record<string, string> = {
  '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4', '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9',
  '۰': '0', '۱': '1', '۲': '2', '۳': '3', '۴': '4', '۵': '5', '۶': '6', '۷': '7', '۸': '8', '۹': '9',
}

/** Converts Arabic-Indic and Persian digits to Latin digits. */
export function normalizeDigits(value: string): string {
  return value.replace(/[٠-٩۰-۹]/g, (d) => DIGIT_MAP[d] ?? d)
}

/** Keeps digits only, normalised to Latin, capped to the plate length. */
export function sanitizePlateInput(value: string): string {
  return normalizeDigits(value).replace(/\D/g, '').slice(0, PLATE_LENGTH)
}

/** Splits a plate for visual grouping: first 2 digits + remaining 5. */
export function splitPlate(plate: string): { prefix: string; serial: string } {
  return { prefix: plate.slice(0, 2), serial: plate.slice(2) }
}

export function isCompletePlate(plate: string): boolean {
  return plate.length === PLATE_LENGTH
}

/** فئات لوحات الأسطول المستخدمة في التصفح وعرض الجداول الإدارية. */
export type PlateCategory = { prefix: string; label: string }

export const PLATE_CATEGORIES: readonly PlateCategory[] = [
  { prefix: '12', label: 'النقل الخفيف' },
  { prefix: '61', label: 'النقل الثقيل' },
]
