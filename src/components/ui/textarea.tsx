import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const textareaVariants = cva(
  "flex w-full rounded-md border ring-offset-background transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:focus-visible:ring-destructive/30",
  {
    variants: {
      variant: {
        default:
          "border-input bg-background text-foreground placeholder:text-muted-foreground",
        brand:
          "border-brand-border/30 bg-white/80 text-brand-text placeholder:text-brand-text/50 focus-visible:border-brand-border focus-visible:ring-brand-accent/50",
        pill:
          "rounded-2xl border-brand-border/30 bg-white/80 text-brand-text placeholder:text-brand-text/50 focus-visible:border-brand-border focus-visible:ring-brand-accent/50",
        glass:
          "border-brand-border/40 bg-white/60 backdrop-blur-md text-brand-text placeholder:text-brand-text/50 focus-visible:border-brand-border focus-visible:ring-brand-accent/50",
      },
      size: {
        default: "min-h-[80px] px-3 py-2 text-base md:text-sm",
        sm: "min-h-[60px] px-2.5 py-1.5 text-sm",
        lg: "min-h-[120px] px-4 py-3 text-base",
      },
      error: {
        true: "border-destructive text-destructive focus-visible:border-destructive focus-visible:ring-destructive/30",
        false: "",
      },
    },
    compoundVariants: [
      {
        variant: "pill",
        size: "default",
        className: "px-4 py-3",
      },
    ],
    defaultVariants: {
      variant: "default",
      size: "default",
      error: false,
    },
  }
)

export interface TextareaProps
  extends React.ComponentProps<"textarea">,
    VariantProps<typeof textareaVariants> {
  error?: boolean
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      className,
      variant,
      size,
      error,
      "aria-invalid": ariaInvalid,
      ...props
    },
    ref
  ) => {
    const isError = Boolean(error || ariaInvalid)
    return (
      <textarea
        aria-invalid={isError ? true : undefined}
        className={cn(
          textareaVariants({ variant, size, error: isError }),
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Textarea.displayName = "Textarea"

export { Textarea, textareaVariants }
