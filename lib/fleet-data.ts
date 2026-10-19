export type Vehicle = {
  plate: string
  make: string
  model: string
  year: number
  category: string
  department: string
  policyNumber: string
}

const MAKES: Array<[string, string]> = [
  ['Toyota', 'Hilux'],
  ['Hyundai', 'Accent'],
  ['Kia', 'Cerato'],
  ['Nissan', 'Sunny'],
  ['Mitsubishi', 'L200'],
  ['Hyundai', 'H-1'],
  ['Toyota', 'Corolla'],
  ['Kia', 'Sportage'],
]

const DEPARTMENTS = ['التوزيع', 'الصيانة', 'المبيعات', 'الإدارة', 'الخدمات اللوجستية']

export const FLEET_PLATE_START = 1200001
export const FLEET_SIZE = 400
const PLATES_PER_PREFIX = FLEET_SIZE / 2

/**
 * Embedded fleet cache: shipped with the bundle so plate lookups resolve
 * instantly and keep working offline without any network round-trip.
 */
export const FLEET: readonly Vehicle[] = Array.from({ length: FLEET_SIZE }, (_, i) => {
  const [make, model] = MAKES[i % MAKES.length]
  const prefix = i < PLATES_PER_PREFIX ? '12' : '61'
  const serial = (i % PLATES_PER_PREFIX) + 1
  const plate = `${prefix}${String(serial).padStart(5, '0')}`
  return {
    plate,
    make,
    model,
    year: 2016 + (i % 9),
    category: plate.startsWith('12') ? 'سياحية خاصة' : 'نقل خاص / شاحنة',
    department: DEPARTMENTS[i % DEPARTMENTS.length],
    policyNumber: `ARP-FL-${String(i + 1).padStart(4, '0')}`,
  }
})

const FLEET_INDEX = new Map(FLEET.map((v) => [v.plate, v]))

const DIGIT_MAP: Record<string, string> = {
  '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4', '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9',
  '۰': '0', '۱': '1', '۲': '2', '۳': '3', '۴': '4', '۵': '5', '۶': '6', '۷': '7', '۸': '8', '۹': '9',
}

export function normalizeDigits(value: string): string {
  return value.replace(/[٠-٩۰-۹]/g, (d) => DIGIT_MAP[d] ?? d)
}

export function normalizePlate(value: string): string {
  return normalizeDigits(value).replace(/[^0-9]/g, '')
}

export function findVehicle(input: string): Vehicle | undefined {
  return FLEET_INDEX.get(normalizePlate(input))
}
