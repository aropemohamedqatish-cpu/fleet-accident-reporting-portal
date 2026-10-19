'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Activity, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function RefreshButton() {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  return (
    <Button
      type="button"
      variant="outline"
      className="h-10 gap-2 border-slate-300 bg-white"
      disabled={pending}
      onClick={() => startTransition(() => router.refresh())}
    >
      {pending ? (
        <Loader2 className="size-4 animate-spin text-[#003366]" aria-hidden="true" />
      ) : (
        <Activity className="size-4 text-[#003366]" aria-hidden="true" />
      )}
      تحديث القائمة
    </Button>
  )
}
