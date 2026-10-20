import { SlidersHorizontal } from 'lucide-react'
import { ClaimsSearchInput } from './claims-search-input'
import { ClaimsSelectFilters } from './claims-select-filters'

export function ClaimsFilters() {
  return (
    <section aria-label="فلاتر البحث والتصفية" className="surface animate-fade-up space-y-5 p-5 sm:p-6" style={{ animationDelay: '240ms' }}>
      <header className="flex items-center gap-2.5">
        <span className="flex size-9 items-center justify-center rounded-xl bg-brand-soft text-brand">
          <SlidersHorizontal className="size-[18px]" aria-hidden="true" />
        </span>
        <div>
          <h2 className="text-lg leading-tight font-bold text-ink">البحث والتصفية</h2>
          <p className="text-sm font-medium text-muted-foreground">تُحدَّث النتائج تلقائياً عند أي تغيير.</p>
        </div>
      </header>
      <ClaimsSearchInput />
      <ClaimsSelectFilters />
    </section>
  )
}
