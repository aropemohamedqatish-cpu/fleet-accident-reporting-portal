'use client'

import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export type SegmentedOption<T extends string> = {
  value: T
  label: string
  /** Optional trailing count badge. */
  count?: number
  icon?: ReactNode
}

type SegmentedProps<T extends string> = {
  options: readonly SegmentedOption<T>[]
  value: T
  onChange: (value: T) => void
  label: string
  disabled?: boolean
  className?: string
}

/** Pill-style single-choice control (radiogroup semantics, arrow-key friendly via native radios). */
export function Segmented<T extends string>({ options, value, onChange, label, disabled, className }: SegmentedProps<T>) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={cn(
        'scroll-thin inline-flex max-w-full gap-1 overflow-x-auto rounded-2xl border border-border bg-secondary/70 p-1',
        className,
      )}
    >
      {options.map((option) => {
        const active = option.value === value
        return (
          <label
            key={option.value}
            className={cn(
              'relative flex min-h-10 shrink-0 cursor-pointer items-center gap-2 rounded-xl px-3.5 text-sm font-bold transition-all duration-200 has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-ring/30',
              active
                ? 'bg-white text-brand-strong shadow-[0_1px_2px_rgba(11,18,32,0.12),0_4px_10px_-4px_rgba(0,51,102,0.35)]'
                : 'text-ink-soft hover:bg-white/70 hover:text-ink',
              disabled && 'pointer-events-none opacity-60',
            )}
          >
            <input
              type="radio"
              className="sr-only"
              name={label}
              value={option.value}
              checked={active}
              disabled={disabled}
              onChange={() => onChange(option.value)}
            />
            {option.icon}
            <span>{option.label}</span>
            {typeof option.count === 'number' && (
              <span
                className={cn(
                  'rounded-full px-2 py-0.5 text-xs font-bold tabular-nums',
                  active ? 'bg-brand text-white' : 'bg-white text-ink-soft',
                )}
              >
                {option.count}
              </span>
            )}
          </label>
        )
      })}
    </div>
  )
}
