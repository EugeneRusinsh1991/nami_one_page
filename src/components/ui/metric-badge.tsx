import * as React from "react";
import { Card } from "@/components/ui/card";
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
    <Card
      variant="glass"
      className={cn(
        "px-4 py-2.5 sm:px-5 sm:py-3 lg:px-6 lg:py-3.5 transition-transform duration-300 hover:scale-105",
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
    </Card>
  );
}
