'use client'

import { Fragment, useRef, useState } from 'react'
import { PLATE_LENGTH, sanitizePlateInput } from '@/lib/plate'
import { cn } from '@/lib/utils'

type PlateInputProps = {
  id: string
  value: string
  onChange: (digits: string) => void
  status: 'idle' | 'valid' | 'invalid'
  describedBy?: string
  autoFocus?: boolean
}

/**
 * The plate IS the input: seven digit cells (2 leading + 5 serial) fed by one
 * invisible native input, so paste, IME, Arabic-Indic digits and mobile numeric keypads all work.
 */
export function PlateInput({ id, value, onChange, status, describedBy, autoFocus }: PlateInputProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [focused, setFocused] = useState(false)
  const cells = Array.from({ length: PLATE_LENGTH }, (_, index) => value[index] ?? '')
  const activeIndex = Math.min(value.length, PLATE_LENGTH - 1)

  return (
    <div className="relative" onClick={() => inputRef.current?.focus()}>
      <div
        dir="ltr"
        className={cn(
          'flex h-24 items-stretch overflow-hidden rounded-2xl border-[3px] bg-white transition-all duration-300',
          status === 'idle' && (focused ? 'border-brand shadow-[0_0_0_5px_rgba(37,99,235,0.18)]' : 'border-ink'),
          status === 'valid' && 'border-success shadow-[0_0_0_5px_rgba(15,122,70,0.18)]',
          status === 'invalid' && 'animate-shake border-destructive shadow-[0_0_0_5px_rgba(180,35,24,0.16)]',
        )}
      >
        <div className="flex w-14 shrink-0 flex-col items-center justify-center gap-1 bg-brand text-white">
          <span className="text-[13px] leading-none font-bold">سورية</span>
          <span className="font-mono text-[10px] leading-none font-semibold tracking-widest text-[#bcd2f2]">SYR</span>
        </div>
        <div className="flex flex-1 items-center justify-center gap-1 px-2 sm:gap-1.5">
          {cells.map((digit, index) => (
            <Fragment key={index}>
              {index === 2 && <span aria-hidden="true" className="mx-1.5 h-12 w-0.5 rounded-full bg-ink/35" />}
              <span
                className={cn(
                  'relative flex h-14 w-8 items-center justify-center rounded-lg font-mono text-[2rem] leading-none font-bold tabular-nums transition-colors sm:w-9',
                  index < 2 ? 'text-brand' : 'text-ink',
                  focused && index === activeIndex && value.length < PLATE_LENGTH && 'bg-secondary',
                )}
              >
                {digit}
                <span
                  aria-hidden="true"
                  className={cn(
                    'absolute inset-x-1 bottom-0 h-[3px] rounded-full transition-colors',
                    digit ? 'bg-ink/0' : focused && index === activeIndex ? 'bg-brand' : 'bg-ink/30',
                  )}
                />
                {focused && index === activeIndex && value.length < PLATE_LENGTH && (
                  <span aria-hidden="true" className="absolute h-8 w-0.5 animate-caret rounded-full bg-brand" />
                )}
              </span>
            </Fragment>
          ))}
        </div>
      </div>
      <input
        ref={inputRef}
        id={id}
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        dir="ltr"
        autoFocus={autoFocus}
        maxLength={24}
        value={value}
        aria-label="رقم لوحة المركبة المكوّن من 7 أرقام"
        aria-invalid={status === 'invalid' || undefined}
        aria-describedby={describedBy}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onChange={(event) => onChange(sanitizePlateInput(event.target.value))}
        className="absolute inset-0 h-full w-full cursor-text rounded-2xl text-[16px] opacity-0"
      />
    </div>
  )
}
