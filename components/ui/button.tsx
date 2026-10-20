import { Button as ButtonPrimitive } from '@base-ui/react/button'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const buttonVariants = cva(
  "group/button pressable relative inline-flex shrink-0 items-center justify-center rounded-xl border border-transparent bg-clip-padding text-sm font-semibold whitespace-nowrap outline-none select-none focus-visible:ring-4 focus-visible:ring-ring/30 disabled:pointer-events-none disabled:opacity-55 disabled:saturate-50 aria-invalid:border-destructive aria-invalid:ring-4 aria-invalid:ring-destructive/20 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-[1.1em]",
  {
    variants: {
      variant: {
        default:
          'bg-gradient-to-b from-[#0a4a94] to-brand text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.2),0_8px_18px_-8px_rgba(0,51,102,0.75)] hover:from-[#0d58ae] hover:to-[#003d7a] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.25),0_12px_24px_-8px_rgba(0,51,102,0.8)]',
        success:
          'bg-gradient-to-b from-[#12945a] to-success text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.22),0_8px_18px_-8px_rgba(15,122,70,0.75)] hover:from-[#16a766]',
        outline:
          'border-[1.5px] border-input bg-white text-ink shadow-sm hover:border-brand hover:bg-secondary aria-expanded:bg-secondary',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-accent aria-expanded:bg-accent',
        ghost: 'text-ink hover:bg-secondary aria-expanded:bg-secondary',
        destructive:
          'bg-destructive text-white shadow-[0_8px_18px_-10px_rgba(180,35,24,0.8)] hover:bg-[#912018] focus-visible:ring-destructive/30',
        link: 'text-brand underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-11 gap-2 px-4',
        xs: 'h-8 gap-1.5 rounded-lg px-2.5 text-xs',
        sm: 'h-10 gap-1.5 rounded-lg px-3.5 text-sm',
        lg: 'h-12 gap-2 px-5 text-base',
        xl: 'h-14 gap-2.5 rounded-2xl px-6 text-lg font-bold',
        icon: 'size-11',
        'icon-xs': 'size-8 rounded-lg',
        'icon-sm': 'size-10 rounded-lg',
        'icon-lg': 'size-12 rounded-xl',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

function Button({
  className,
  variant = 'default',
  size = 'default',
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
