'use client'

import { useFormStatus } from 'react-dom'
import { Loader2, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type LogoutButtonProps = {
  variant?: 'sidebar' | 'icon'
  className?: string
}

/** Must be rendered inside a <form action={logoutAction}>. */
export function LogoutButton({ variant = 'sidebar', className }: LogoutButtonProps) {
  const { pending } = useFormStatus()
  const icon = pending ? (
    <Loader2 className="size-4 animate-spin" aria-hidden="true" />
  ) : (
    <LogOut className="size-4" aria-hidden="true" />
  )

  if (variant === 'icon') {
    return (
      <Button type="submit" variant="outline" size="icon" aria-label="تسجيل الخروج" disabled={pending} className={className}>
        {icon}
      </Button>
    )
  }

  return (
    <Button
      type="submit"
      disabled={pending}
      className={cn(
        'h-12 w-full justify-center gap-2.5 rounded-2xl border border-white/20 bg-white/10 from-transparent to-transparent text-[15px] text-white shadow-none hover:bg-white/20 hover:from-transparent hover:to-transparent hover:shadow-none',
        className,
      )}
    >
      {icon}
      {pending ? 'جارٍ تسجيل الخروج…' : 'تسجيل الخروج'}
    </Button>
  )
}
