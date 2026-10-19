'use client'

import { useCallback, useEffect, useState, useSyncExternalStore } from 'react'
import { toast } from 'sonner'
import { flushOutbox, listStaged } from '@/lib/offline-queue'

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

/** Keeps the IndexedDB outbox count fresh and auto-syncs staged reports whenever connectivity returns. */
export function useOutboxSync() {
  const online = useOnlineStatus()
  const [pending, setPending] = useState(0)
  const [syncing, setSyncing] = useState(false)

  const refresh = useCallback(async () => {
    try {
      setPending((await listStaged()).length)
    } catch {
      setPending(0)
    }
  }, [])

  useEffect(() => {
    if (!online) {
      void refresh()
      return
    }
    let cancelled = false
    void (async () => {
      const staged = await listStaged().catch(() => [])
      if (staged.length === 0 || cancelled) return setPending(0)
      setSyncing(true)
      const results = await flushOutbox()
      if (cancelled) return
      setSyncing(false)
      await refresh()
      if (results.length > 0) {
        toast.success('تمت مزامنة البلاغات المحفوظة', {
          description: `تم إرسال ${results.length} بلاغ بنجاح بعد عودة الاتصال.`,
        })
      }
    })()
    return () => {
      cancelled = true
    }
  }, [online, refresh])

  return { online, pending, syncing, refresh }
}
