import Image from 'next/image'
import { cn } from '@/lib/utils'

type LogoProps = {
  className?: string
  priority?: boolean
  /** Renders the logo on a white plate so it stays crisp on dark surfaces. */
  plated?: boolean
}

export function Logo({ className, priority, plated }: LogoProps) {
  const image = (
    <Image
      src="/images/arope-logo.png"
      alt="آروب سورية للتأمين"
      width={2576}
      height={826}
      priority={priority}
      className={cn('h-auto w-auto', className)}
    />
  )
  if (!plated) return image
  return <span className="inline-flex items-center rounded-2xl bg-white px-4 py-2.5 shadow-sm">{image}</span>
}
