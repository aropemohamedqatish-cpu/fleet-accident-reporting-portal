import { normalizeDigits } from './plate'

export { normalizeDigits }

export type Vehicle = {
  plate: string
  make: string
  model: string
  year: number
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

/**
 * Embedded fleet cache: shipped with the bundle so plate lookups resolve
 * instantly and keep working offline without any network round-trip.
 * Must mirror prisma/seed.ts (prefix 12 and 61, serials 00001–00200).
 */
export const FLEET: readonly Vehicle[] = Array.from({ length: FLEET_SIZE }, (_, i) => {
  const [make, model] = MAKES[i % MAKES.length]
  const prefix = i < FLEET_SIZE / 2 ? '12' : '61'
  const serial = (i % (FLEET_SIZE / 2)) + 1
  const plate = `${prefix}${String(serial).padStart(5, '0')}`
  return {
    plate,
    make,
    model,
    year: 2016 + (i % 9),
    department: DEPARTMENTS[i % DEPARTMENTS.length],
    policyNumber: `ARP-FL-${String(i + 1).padStart(4, '0')}`,
  }
})

const FLEET_INDEX = new Map(FLEET.map((v) => [v.plate, v]))

export function normalizePlate(value: string): string {
  return normalizeDigits(value).replace(/[^0-9]/g, '')
}

export function findVehicle(input: string): Vehicle | undefined {
  return FLEET_INDEX.get(normalizePlate(input))
}
