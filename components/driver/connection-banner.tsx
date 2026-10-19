'use client'

import { CloudOff, RefreshCw, Database } from 'lucide-react'

type Props = { online: boolean; pending: number; syncing: boolean }

export function ConnectionBanner({ online, pending, syncing }: Props) {
  if (online && pending === 0 && !syncing) return null

  if (!online) {
    return (
      <div role="status" aria-live="polite" className="flex items-start gap-3 bg-warning px-4 py-3 text-sm text-white">
        <CloudOff className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
        <p className="leading-relaxed">
          <span className="font-semibold">لا يوجد اتصال بالإنترنت.</span>{' '}
          يمكنك متابعة البلاغ، وسيتم حفظه بأمان على جهازك وإرساله تلقائياً عند عودة الاتصال.
          {pending > 0 && <span className="font-semibold">{` (${pending} بلاغ بانتظار المزامنة)`}</span>}
        </p>
      </div>
    )
  }

  return (
    <div role="status" aria-live="polite" className="flex items-center gap-3 bg-secondary px-4 py-3 text-sm text-secondary-foreground">
      {syncing ? (
        <RefreshCw className="size-5 shrink-0 animate-spin" aria-hidden="true" />
      ) : (
        <Database className="size-5 shrink-0" aria-hidden="true" />
      )}
      <p>{syncing ? 'جارٍ مزامنة البلاغات المحفوظة...' : `${pending} بلاغ محفوظ بانتظار المزامنة`}</p>
    </div>
  )
}
