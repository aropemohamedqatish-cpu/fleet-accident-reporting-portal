'use client'

import { cn } from '@/lib/utils'

type SwitchProps = {
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  label: string
  disabled?: boolean
  className?: string
}

/** Accessible, RTL-safe toggle. Thumb travels along the logical inline axis. */
export function Switch({ checked, onCheckedChange, label, disabled, className }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        'relative inline-flex h-8 w-14 shrink-0 cursor-pointer items-center rounded-full border-2 transition-colors duration-200 outline-none focus-visible:ring-4 focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-55',
        checked ? 'border-success bg-success' : 'border-[#8fa1bd] bg-[#dfe6f2]',
        className,
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          'absolute top-0.5 size-6 rounded-full bg-white shadow-[0_2px_6px_rgba(11,18,32,0.35)] transition-[inset-inline-start] duration-200 ease-[cubic-bezier(0.3,1.4,0.5,1)]',
          checked ? 'start-[1.625rem]' : 'start-0.5',
        )}
      />
    </button>
  )
}
