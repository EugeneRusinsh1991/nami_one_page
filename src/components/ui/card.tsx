import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

export const MASTER_CARD_CONFIG = {
  width: "w-[58vw] sm:w-[38vw] md:w-[28vw] lg:w-[22vw] max-w-[320px]",
  height: "h-full",
  container: "h-full w-[58vw] sm:w-[38vw] md:w-[28vw] lg:w-[22vw] max-w-[320px] shrink-0",
  shadow: "shadow-2xl",
  radius: "rounded-2xl md:rounded-3xl",
  sectionPadding: "pt-[calc(1.25rem+env(safe-area-inset-top,0px))] sm:pt-[calc(2rem+env(safe-area-inset-top,0px))] md:pt-20 lg:pt-24 pb-0 md:pb-6",
  headerMargin: "mb-2 sm:mb-3 md:mb-4",
  mediaPadding: "py-2.5 sm:py-2",
  bottomBarPadding: "pt-2 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] sm:pt-3 md:pb-0",
} as const;

const cardVariants = cva(
  "transition-[background-color,border-color,box-shadow] duration-300",
  {
    variants: {
      variant: {
        default: "rounded-lg border bg-card text-card-foreground shadow-sm",
        surface:
          "overflow-hidden rounded-2xl md:rounded-3xl border border-brand-border/20 bg-brand-surface text-brand-text duration-500 hover:bg-brand-elevated hover:shadow-xl",
        glass:
          "overflow-hidden rounded-3xl border border-white/60 bg-white/55 shadow-xl backdrop-blur-xl",
        elevated: "overflow-hidden rounded-2xl md:rounded-3xl bg-brand-elevated shadow-2xl",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(cardVariants({ variant }), className)}
      {...props}
    />
  )
)
Card.displayName = "Card"

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "text-2xl font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
))
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"

export { Card, cardVariants, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
