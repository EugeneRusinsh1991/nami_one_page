import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const inputVariants = cva(
  "flex w-full rounded-md border ring-offset-background transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:focus-visible:ring-destructive/30",
  {
    variants: {
      variant: {
        default:
          "border-input bg-background text-foreground placeholder:text-muted-foreground",
        brand:
          "border-brand-border/30 bg-white/80 text-brand-text placeholder:text-brand-text/50 focus-visible:border-brand-border focus-visible:ring-brand-accent/50",
        pill:
          "rounded-full border-brand-border/30 bg-white/80 text-brand-text placeholder:text-brand-text/50 focus-visible:border-brand-border focus-visible:ring-brand-accent/50",
        glass:
          "border-brand-border/40 bg-white/60 backdrop-blur-md text-brand-text placeholder:text-brand-text/50 focus-visible:border-brand-border focus-visible:ring-brand-accent/50",
      },
      size: {
        default: "h-10 px-3 py-2 text-base md:text-sm",
        sm: "h-9 px-2.5 py-1.5 text-sm",
        lg: "h-11 sm:h-12 px-4 sm:px-5 text-base",
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
        className: "px-4 sm:px-5",
      },
    ],
    defaultVariants: {
      variant: "default",
      size: "default",
      error: false,
    },
  }
)

export interface InputProps
  extends Omit<React.ComponentProps<"input">, "size">,
    VariantProps<typeof inputVariants> {
  error?: boolean
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      type,
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
      <input
        type={type}
        aria-invalid={isError ? true : undefined}
        className={cn(
          inputVariants({ variant, size, error: isError }),
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input, inputVariants }
