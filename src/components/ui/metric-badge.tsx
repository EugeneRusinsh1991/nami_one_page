import * as React from "react";
import { cn } from "@/lib/utils";

export interface MetricBadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  value: React.ReactNode;
  label: React.ReactNode;
  valueClassName?: string;
  labelClassName?: string;
}

export function MetricBadge({
  value,
  label,
  valueClassName,
  labelClassName,
  className,
  ...props
}: MetricBadgeProps): React.JSX.Element {
  return (
    <div
      className={cn(
        "rounded-2xl border border-white bg-white/90 px-3 py-1.5 sm:px-3.5 sm:py-2 md:px-3.5 md:py-2 lg:px-5 lg:py-3 shadow-[0_18px_40px_-12px_rgba(26,31,37,0.35)] ring-1 ring-brand-border/20 backdrop-blur-2xl transition-transform duration-300 hover:scale-105",
        className
      )}
      {...props}
    >
      <div className={cn("font-heading text-base font-bold text-brand-text sm:text-lg lg:text-xl", valueClassName)}>
        {value}
      </div>
      <div className={cn("font-mono text-[10px] uppercase tracking-wider text-brand-text/60 sm:text-[11px] lg:text-xs", labelClassName)}>
        {label}
      </div>
    </div>
  );
}
