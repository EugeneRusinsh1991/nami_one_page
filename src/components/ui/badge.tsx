import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "border-border text-foreground",
        "brand-outline":
          "border-brand-border/50 text-brand-border bg-transparent font-mono uppercase tracking-[0.25em]",
        glass:
          "border-brand-border/40 bg-white/90 md:bg-white/60 text-brand-text font-mono uppercase tracking-[0.25em] backdrop-blur-none md:backdrop-blur-md hover:bg-white/90 md:hover:bg-white/60",
        "glass-subtle":
          "border-transparent bg-white/90 md:bg-white/70 text-brand-text font-mono uppercase tracking-widest backdrop-blur-none md:backdrop-blur-md hover:bg-white/90 md:hover:bg-white/70",
        "pill-dark":
          "border-transparent bg-brand-text text-white font-mono uppercase tracking-widest hover:bg-brand-text/85",
      },
      size: {
        default: "px-2.5 py-0.5 text-xs font-semibold",
        sm: "px-2 py-0.5 text-[10px] font-normal tracking-wider",
        md: "px-2.5 py-0.5 md:py-1 text-[10px] md:text-[11px] font-normal tracking-[0.25em]",
        lg: "px-4 py-1.5 text-[11px] font-normal tracking-[0.25em]",
      },
    },
    compoundVariants: [
      {
        variant: "brand-outline",
        size: "default",
        className: "px-2.5 py-0.5 md:py-1 text-[10px] md:text-[11px] font-normal",
      },
      {
        variant: "glass",
        size: "default",
        className: "px-4 py-1.5 text-[11px] font-normal",
      },
      {
        variant: "glass-subtle",
        size: "default",
        className: "px-2.5 py-0.5 text-[10px] font-normal",
      },
      {
        variant: "pill-dark",
        size: "default",
        className: "px-2.5 py-0.5 text-[10px] font-normal",
      },
    ],
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(badgeVariants({ variant, size }), className)}
        {...props}
      />
    )
  }
)
Badge.displayName = "Badge"

export { Badge, badgeVariants }
