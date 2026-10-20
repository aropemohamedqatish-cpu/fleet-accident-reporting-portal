'use client'

import { useLayoutEffect, useRef, useState } from 'react'
import { formatNumber } from '@/lib/brand'

type AnimatedNumberProps = {
  value: number
  durationMs?: number
  className?: string
}

/** Counts up once on mount. Server markup already contains the final value, so no-JS/SEO output stays correct. */
export function AnimatedNumber({ value, durationMs = 900, className }: AnimatedNumberProps) {
  const [display, setDisplay] = useState(value)
  const frame = useRef<number | null>(null)

  useLayoutEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced || value === 0) {
      setDisplay(value)
      return
    }
    const start = performance.now()
    setDisplay(0)
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / durationMs)
      const eased = 1 - Math.pow(1 - progress, 4)
      setDisplay(Math.round(value * eased))
      if (progress < 1) frame.current = requestAnimationFrame(tick)
    }
    frame.current = requestAnimationFrame(tick)
    return () => {
      if (frame.current !== null) cancelAnimationFrame(frame.current)
    }
  }, [value, durationMs])

  return (
    <span className={className} aria-label={formatNumber(value)}>
      <span aria-hidden="true">{formatNumber(display)}</span>
    </span>
  )
}
