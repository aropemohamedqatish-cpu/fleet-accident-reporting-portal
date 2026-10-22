import { splitPlate } from '@/lib/plate'
import { cn } from '@/lib/utils'

type PlateSize = 'sm' | 'md' | 'lg'

const SIZES: Record<PlateSize, { box: string; strip: string; text: string }> = {
  sm: { box: 'h-8 rounded-md border-[1.5px]', strip: 'px-1.5 text-[10px]', text: 'px-2.5 text-[15px]' },
  md: { box: 'h-10 rounded-lg border-2', strip: 'px-2 text-[11px]', text: 'px-3 text-lg' },
  lg: { box: 'h-16 rounded-xl border-[3px]', strip: 'px-3.5 text-sm', text: 'px-6 text-4xl' },
}

type PlateBadgeProps = {
  /** Formatted or legacy unformatted fleet plate. */
  plate: string
  size?: PlateSize
  className?: string
}

/** Renders a Syrian fleet plate with its stored prefix and serial, left-to-right. */
export function PlateBadge({ plate, size = 'md', className }: PlateBadgeProps) {
  const { prefix, serial } = splitPlate(plate)
  const s = SIZES[size]
  return (
    <span
      dir="ltr"
      role="img"
      aria-label={`لوحة رقم ${plate}`}
      className={cn(
        'inline-flex items-stretch overflow-hidden border-ink bg-white font-mono font-bold text-ink shadow-[inset_0_1px_0_#fff,0_2px_6px_-2px_rgba(11,18,32,0.4)] select-none',
        s.box,
        className,
      )}
    >
      <span className={cn('flex items-center justify-center bg-brand font-sans font-bold tracking-wide text-white', s.strip)}>
        سورية
      </span>
      <span className={cn('flex items-center gap-[0.4em] tabular-nums', s.text)}>
        <span className="text-brand">{prefix}</span>
        <span aria-hidden="true" className="h-[0.85em] w-0.5 rounded-full bg-ink/35" />
        <span>{serial}</span>
      </span>
    </span>
  )
}
