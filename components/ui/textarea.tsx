import * as React from "react"
import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex field-sizing-content min-h-28 w-full rounded-xl border-[1.5px] border-input bg-white px-4 py-3 text-base leading-7 font-medium text-ink shadow-[inset_0_1px_2px_rgba(11,18,32,0.06)] transition-[border-color,box-shadow] outline-none placeholder:font-normal placeholder:text-[#566683] hover:border-[#6b83a8] focus-visible:border-brand focus-visible:ring-4 focus-visible:ring-ring/20 disabled:cursor-not-allowed disabled:bg-muted disabled:opacity-70 aria-invalid:border-destructive aria-invalid:ring-4 aria-invalid:ring-destructive/15",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
