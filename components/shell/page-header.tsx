import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

type PageHeaderProps = {
  eyebrow: string
  title: string
  description?: string
  icon?: LucideIcon
  actions?: ReactNode
  className?: string
}

/** In-canvas page header — part of the page flow, never an isolated bar. */
export function PageHeader({ eyebrow, title, description, icon: Icon, actions, className }: PageHeaderProps) {
  return (
    <header className={cn('flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between', className)}>
      <div className="animate-fade-up">
        <div className="inline-flex items-center gap-2 rounded-full border border-brand/20 bg-white/80 px-3.5 py-1.5 text-xs font-bold text-brand shadow-sm backdrop-blur">
          {Icon && <Icon className="size-4" aria-hidden="true" />}
          {eyebrow}
        </div>
        <h1 className="mt-4 text-balance text-3xl font-bold tracking-tight text-ink sm:text-4xl">{title}</h1>
        {description && <p className="mt-2.5 max-w-2xl text-pretty text-base leading-7 text-ink-soft">{description}</p>}
      </div>
      {actions && (
        <div className="animate-fade-up flex flex-wrap items-center gap-3" style={{ animationDelay: '80ms' }}>
          {actions}
        </div>
      )}
    </header>
  )
}
