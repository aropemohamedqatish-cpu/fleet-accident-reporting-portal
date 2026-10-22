export const MIN_PLATE_DIGITS = 6
export const MAX_PLATE_DIGITS = 7

const DIGIT_MAP: Record<string, string> = {
  '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4', '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9',
  '۰': '0', '۱': '1', '۲': '2', '۳': '3', '۴': '4', '۵': '5', '۶': '6', '۷': '7', '۸': '8', '۹': '9',
}

/** Converts Arabic-Indic and Persian digits to Latin digits. */
export function normalizeDigits(value: string): string {
  return value.replace(/[٠-٩۰-۹]/g, (d) => DIGIT_MAP[d] ?? d)
}

/** Normalizes Arabic digits and converts any non-digit separator to a single slash. */
export function normalizePlateInput(value: string): string {
  return normalizeDigits(value).replace(/[^\d]+/g, '/')
}

export function getPlateDigitCount(value: string): number {
  return normalizeDigits(value).replace(/\D/g, '').length
}

/** Returns slash-formatted plate variants and the legacy unformatted database value. */
export function getPlateSearchCandidates(value: string): string[] {
  const normalized = normalizePlateInput(value)
  const digits = normalized.replace(/\D/g, '')
  if (digits.length < MIN_PLATE_DIGITS || digits.length > MAX_PLATE_DIGITS) return []

  const candidates = new Set<string>()
  if (normalized.includes('/')) {
    const parts = normalized.split('/')
    if (parts.length === 2 && [2, 3].includes(parts[0].length)) {
      candidates.add(`${parts[0]}/${parts[1]}`)
    }
  }
  candidates.add(`${digits.slice(0, 2)}/${digits.slice(2)}`)
  candidates.add(`${digits.slice(0, 3)}/${digits.slice(3)}`)
  candidates.add(digits)
  return [...candidates]
}

/** Splits a formatted plate for visual grouping. */
export function splitPlate(plate: string): { prefix: string; serial: string } {
  const parts = plate.split('/')
  if (parts.length === 2) return { prefix: parts[0], serial: parts[1] }
  return { prefix: plate.slice(0, 2), serial: plate.slice(2) }
}

export function isCompletePlate(plate: string): boolean {
  return getPlateSearchCandidates(plate).length > 0
}

/** Legacy plates are 6 digits grouped as a 2-digit prefix + 4-digit serial. */
export const LEGACY_PREFIX_LENGTH = 2
export const LEGACY_DIGIT_COUNT = LEGACY_PREFIX_LENGTH + 4

/** Modern plates contain 7 digits split into two groups: 2 or 3 + 4 or 5. */
export const MODERN_DIGIT_COUNT = 7

/** How many digits go into the FIRST modern input cell. */
export const MODERN_CELL1_MIN_DIGITS = 2
export const MODERN_CELL1_MAX_DIGITS = 3
export const MODERN_CELL2_MIN_DIGITS = MODERN_DIGIT_COUNT - MODERN_CELL1_MAX_DIGITS
export const MODERN_CELL2_MAX_DIGITS = MODERN_DIGIT_COUNT - MODERN_CELL1_MIN_DIGITS

/** Returns the modern-grouped plate `12/34567` for a raw 7-digit string. */
export function formatModernPlate(digits: string): string {
  if (digits.length !== MODERN_DIGIT_COUNT) return digits
  return `${digits.slice(0, 2)}/${digits.slice(2)}`
}

/** Returns the modern input cell lengths for the current digit count (2-3 / remainder). */
export function getModernCellLengths(totalDigits: number): [number, number] {
  if (totalDigits <= 0) return [0, 0]
  const cell1 = Math.min(totalDigits, MODERN_CELL1_MAX_DIGITS)
  return [cell1, totalDigits - cell1]
}

/** Returns whether a modern plate has a 2- or 3-digit prefix and exactly 7 digits. */
export function isCompleteModernPlate(value: string): boolean {
  const parts = normalizePlateInput(value).split('/')
  if (parts.length !== 2) return false
  const [prefix, serial] = parts
  return (
    [MODERN_CELL1_MIN_DIGITS, MODERN_CELL1_MAX_DIGITS].includes(prefix.length) &&
    serial.length === MODERN_DIGIT_COUNT - prefix.length
  )
}

/** Returns whether an input value is a complete legacy plate (6 digits). */
export function isCompleteLegacyPlate(value: string): boolean {
  return getPlateDigitCount(value) === LEGACY_DIGIT_COUNT
}
