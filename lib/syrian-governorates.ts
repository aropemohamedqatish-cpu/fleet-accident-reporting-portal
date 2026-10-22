export const SYRIAN_GOVERNORATES = [
  { value: 'DAMASCUS', label: 'دمشق' },
  { value: 'RIF_DIMASHQ', label: 'ريف دمشق' },
  { value: 'ALEPPO', label: 'حلب' },
  { value: 'HOMS', label: 'حمص' },
  { value: 'HAMA', label: 'حماة' },
  { value: 'LATTAKIA', label: 'اللاذقية' },
  { value: 'TARTUS', label: 'طرطوس' },
  { value: 'IDLIB', label: 'إدلب' },
  { value: 'DEIR_EZ_ZOR', label: 'دير الزور' },
  { value: 'RAQQA', label: 'الرقة' },
  { value: 'HASAKAH', label: 'الحسكة' },
  { value: 'DARAA', label: 'درعا' },
  { value: 'SUWAYDA', label: 'السويداء' },
  { value: 'QUNEITRA', label: 'القنيطرة' },
] as const

export type SyrianGovernorate = (typeof SYRIAN_GOVERNORATES)[number]['value']

export const SYRIAN_GOVERNORATE_VALUES = SYRIAN_GOVERNORATES.map(({ value }) => value) as [
  SyrianGovernorate,
  ...SyrianGovernorate[],
]

export function isSyrianGovernorate(value: string): value is SyrianGovernorate {
  return SYRIAN_GOVERNORATES.some((governorate) => governorate.value === value)
}

export function getGovernorateLabel(value: string | null | undefined): string {
  return SYRIAN_GOVERNORATES.find((governorate) => governorate.value === value)?.label ?? 'غير محددة'
}
