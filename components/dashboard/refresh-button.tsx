'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function RefreshButton() {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  return (
    <Button
      type="button"
      variant="outline"
      className="h-11 gap-2.5 px-5"
      disabled={pending}
      onClick={() => startTransition(() => router.refresh())}
    >
      <RefreshCw className={cn('size-4 text-brand', pending && 'animate-spin')} aria-hidden="true" />
      {pending ? 'جارٍ التحديث…' : 'تحديث القائمة'}
    </Button>
  )
}
