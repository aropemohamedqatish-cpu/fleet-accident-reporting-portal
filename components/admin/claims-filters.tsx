import { ClaimsSearchInput } from './claims-search-input'
import { ClaimsSelectFilters } from './claims-select-filters'

export function ClaimsFilters() {
  return (
    <section
      aria-label="فلاتر البحث والتصفية"
      className="space-y-4 rounded-2xl border-0 bg-white p-4 shadow-sm ring-1 ring-slate-200/80 sm:p-5"
    >
      <ClaimsSearchInput />
      <ClaimsSelectFilters />
      <p className="text-xs text-slate-500">
        يتم تحديث النتائج تلقائياً من الخادم عند تغيير أي فلتر أو كتابة كلمة بحث.
      </p>
    </section>
  )
}
