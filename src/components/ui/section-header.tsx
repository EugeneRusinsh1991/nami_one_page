import * as React from "react";
import { cn } from "@/lib/utils";
import { Badge, type BadgeProps } from "@/components/ui/badge";

export interface SectionHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  badge: React.ReactNode;
  title: React.ReactNode;
  badgeVariant?: BadgeProps["variant"];
  align?: "left" | "center" | "right";
  headingAs?: "h1" | "h2" | "h3";
  titleClassName?: string;
  badgeClassName?: string;
}

export function SectionHeader({
  badge,
  title,
  badgeVariant = "brand-outline",
  align = "left",
  headingAs: HeadingTag = "h2",
  titleClassName,
  badgeClassName,
  className,
  ...props
}: SectionHeaderProps) {
  const alignmentClasses = {
    left: "items-start text-left",
    center: "items-center text-center",
    right: "items-end text-right",
  };

  return (
    <div
      className={cn("flex flex-col shrink-0", alignmentClasses[align], className)}
      {...props}
    >
      <Badge
        variant={badgeVariant}
        className={cn("mb-2 sm:mb-3", badgeClassName)}
      >
        {badge}
      </Badge>
      <HeadingTag
        className={cn(
          "font-heading text-2xl font-bold tracking-tight text-brand-text sm:text-3xl md:text-4xl lg:text-5xl leading-tight",
          titleClassName
        )}
      >
        {title}
      </HeadingTag>
    </div>
  );
}
