'use client'

import { AlertTriangle, CloudOff, Database, RefreshCw, RotateCw, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { StagedReport } from '@/lib/offline-queue'

type Props = {
  online: boolean
  pending: number
  failed: StagedReport[]
  syncing: boolean
  storageError: string | null
  onRetry: (key: string) => void
  onDiscard: (key: string) => void
}

export function ConnectionBanner({ online, pending, failed, syncing, storageError, onRetry, onDiscard }: Props) {
  if (online && pending === 0 && failed.length === 0 && !syncing && !storageError) return null

  return (
    <section className="space-y-2.5 p-3" aria-label="حالة البلاغات المحفوظة">
      {(syncing || !online || pending > 0) && (
        <div
          role="status"
          aria-live="polite"
          className={`flex items-start gap-3 rounded-xl px-4 py-3 text-sm ${!online ? 'bg-warning text-white' : 'bg-secondary text-secondary-foreground'}`}
        >
          {!online ? (
            <CloudOff className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
          ) : syncing ? (
            <RefreshCw className="mt-0.5 size-5 shrink-0 animate-spin" aria-hidden="true" />
          ) : (
            <Database className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
          )}
          <p className="leading-relaxed">
            {!online
              ? `لا يوجد اتصال بالإنترنت. سيُحفظ البلاغ على جهازك لإرساله عند عودة الاتصال${pending > 0 ? `، ويوجد ${pending} بلاغ بانتظار المزامنة.` : '.'}`
              : syncing
                ? 'جارٍ مزامنة البلاغات المحفوظة...'
                : `${pending} بلاغ محفوظ بانتظار المزامنة.`}
          </p>
        </div>
      )}

      {storageError && (
        <p role="alert" className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm font-semibold leading-relaxed text-red-900">
          {storageError}
        </p>
      )}

      {failed.length > 0 && (
        <div className="space-y-2 rounded-2xl border border-red-200 bg-red-50 p-3" role="alert">
          <div className="flex items-center gap-2 text-sm font-bold text-red-900">
            <AlertTriangle className="size-4 shrink-0" aria-hidden="true" />
            تعذّر إرسال {failed.length} بلاغ. راجع السبب وحاول مجدداً أو احذف البلاغ.
          </div>
          <ul className="space-y-2">
            {failed.map((report) => (
              <li key={report.idempotencyKey} className="rounded-xl border border-red-200 bg-white p-3">
                <p className="text-sm font-bold text-slate-900">
                  بلاغ المركبة <span dir="ltr" className="font-mono">{report.payload.plate}</span>
                </p>
                <p className="mt-1 text-sm leading-relaxed text-red-800">{report.syncError?.message}</p>
                <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                  <time className="text-xs text-slate-600" dateTime={report.syncError?.failedAt}>
                    {report.syncError ? new Intl.DateTimeFormat('ar-SY', {
                      dateStyle: 'short',
                      timeStyle: 'short',
                      timeZone: 'Asia/Damascus',
                    }).format(new Date(report.syncError.failedAt)) : ''}
                  </time>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-9 gap-1.5 border-[#003366] text-[#003366]"
                      disabled={!online || syncing}
                      onClick={() => onRetry(report.idempotencyKey)}
                    >
                      <RotateCw className="size-3.5" aria-hidden="true" />
                      إعادة المحاولة
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-9 gap-1.5 border-red-300 text-red-800 hover:bg-red-50"
                      disabled={syncing}
                      onClick={() => onDiscard(report.idempotencyKey)}
                    >
                      <Trash2 className="size-3.5" aria-hidden="true" />
                      حذف
                    </Button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}
