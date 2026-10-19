import type { ReactNode } from 'react'
import { ArrowLeft, ArrowRight, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

type Props = {
  title: string
  description: string
  children: ReactNode
  onBack: () => void
  onNext: () => void
  nextLabel?: string
  nextDisabled?: boolean
  loading?: boolean
}

export function StepShell({ title, description, children, onBack, onNext, nextLabel = 'التالي', nextDisabled, loading }: Props) {
  return (
    <section className="flex flex-1 flex-col" aria-labelledby="step-title">
      <div className="flex flex-1 flex-col gap-5 px-5 py-4">
        <header className="flex flex-col gap-1">
          <h2 id="step-title" className="text-balance text-2xl font-bold text-foreground">
            {title}
          </h2>
          <p className="text-pretty leading-relaxed text-muted-foreground">{description}</p>
        </header>
        {children}
      </div>
      <div className="sticky bottom-0 flex gap-3 border-t bg-card/95 px-5 py-4 backdrop-blur">
        <Button variant="outline" size="lg" className="h-12 gap-1.5 px-5" onClick={onBack} disabled={loading}>
          <ArrowRight className="size-4" aria-hidden="true" />
          رجوع
        </Button>
        <Button size="lg" className="h-12 flex-1 gap-2 text-base font-semibold" onClick={onNext} disabled={nextDisabled || loading}>
          {loading ? (
            <>
              <Loader2 className="size-5 animate-spin" aria-hidden="true" />
              جارٍ الإرسال...
            </>
          ) : (
            <>
              {nextLabel}
              <ArrowLeft className="size-4" aria-hidden="true" />
            </>
          )}
        </Button>
      </div>
    </section>
  )
}
