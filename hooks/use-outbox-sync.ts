'use client'

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { toast } from 'sonner'
import {
  flushOutbox,
  listStaged,
  removeStaged,
  type StagedReport,
} from '@/lib/offline-queue'

function subscribe(callback: () => void) {
  window.addEventListener('online', callback)
  window.addEventListener('offline', callback)
  return () => {
    window.removeEventListener('online', callback)
    window.removeEventListener('offline', callback)
  }
}

export function useOnlineStatus() {
  return useSyncExternalStore(
    subscribe,
    () => navigator.onLine,
    () => true,
  )
}

/** Tracks saved reports, retries eligible entries on reconnect, and exposes failed entries for driver action. */
export function useOutboxSync() {
  const online = useOnlineStatus()
  const [reports, setReports] = useState<StagedReport[]>([])
  const [syncing, setSyncing] = useState(false)
  const [storageError, setStorageError] = useState<string | null>(null)
  const syncInFlight = useRef(false)

  const refresh = useCallback(async () => {
    try {
      setReports(await listStaged())
      setStorageError(null)
    } catch (error) {
      console.error('Could not read saved incident reports.', error)
      setStorageError('تعذّر قراءة البلاغات المحفوظة على هذا الجهاز.')
    }
  }, [])

  const sync = useCallback(async (retryKeys: readonly string[] = []) => {
    if (!online || syncInFlight.current) return
    syncInFlight.current = true
    setSyncing(true)
    try {
      const result = await flushOutbox(retryKeys)
      await refresh()
      if (result.sent.length > 0) {
        toast.success('تمت مزامنة البلاغات المحفوظة', {
          description: `تم إرسال ${result.sent.length} بلاغ بنجاح.`,
        })
      }
      if (result.failed.length > 0) {
        toast.error('تعذّرت مزامنة بعض البلاغات', {
          description: `هناك ${result.failed.length} بلاغ يحتاج إلى مراجعتك. يظهر سبب التعذّر أسفل الصفحة.`,
        })
      }
      return result
    } catch (error) {
      console.error('Could not synchronize saved incident reports.', error)
      toast.error('تعذّرت مزامنة البلاغات المحفوظة', {
        description: error instanceof Error ? error.message : 'تحقق من الاتصال ثم أعد المحاولة.',
      })
      await refresh()
      return null
    } finally {
      syncInFlight.current = false
      setSyncing(false)
    }
  }, [online, refresh])

  useEffect(() => {
    void refresh()
  }, [refresh])

  useEffect(() => {
    if (!online) return
    let cancelled = false
    void (async () => {
      try {
        const staged = await listStaged()
        if (cancelled || !staged.some((report) => !report.syncError)) return
        await sync()
      } catch (error) {
        console.error('Could not inspect saved incident reports for synchronization.', error)
        if (!cancelled) setStorageError('تعذّر الوصول إلى البلاغات المحفوظة على هذا الجهاز.')
      }
    })()
    return () => {
      cancelled = true
    }
  }, [online, sync])

  const retry = useCallback(async (key: string) => {
    await sync([key])
  }, [sync])

  const discard = useCallback(async (key: string) => {
    try {
      await removeStaged(key)
      await refresh()
      toast.success('تم حذف البلاغ المحفوظ من هذا الجهاز')
    } catch (error) {
      console.error('Could not remove saved incident report.', error)
      toast.error('تعذّر حذف البلاغ المحفوظ')
    }
  }, [refresh])

  const pending = reports.filter((report) => !report.syncError).length
  const failed = reports.filter((report) => report.syncError)

  return { online, pending, failed, syncing, storageError, refresh, retry, discard }
}
