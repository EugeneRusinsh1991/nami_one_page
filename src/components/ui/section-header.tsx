import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { Heading, type HeadingProps, Eyebrow, Text } from "@/components/ui/typography";

export const sectionHeaderVariants = cva("flex flex-col shrink-0", {
  variants: {
    align: {
      left: "items-start text-left",
      center: "items-center text-center",
      right: "items-end text-right",
    },
    color: {
      default: "text-brand-text",
      muted: "text-brand-text/70",
      inverted: "text-white",
    },
    line: {
      none: "",
      bottom: "border-b border-brand-border/30 pb-3",
      accent: "relative after:mt-3 after:block after:h-0.5 after:w-12 after:bg-brand-accent after:content-['']",
      divider: "relative after:mt-3 after:block after:h-px after:w-12 after:bg-brand-border/40 after:content-['']",
    },
  },
  compoundVariants: [
    {
      align: "center",
      line: "accent",
      className: "after:mx-auto",
    },
    {
      align: "right",
      line: "accent",
      className: "after:ml-auto",
    },
    {
      align: "center",
      line: "divider",
      className: "after:mx-auto",
    },
    {
      align: "right",
      line: "divider",
      className: "after:ml-auto",
    },
  ],
  defaultVariants: {
    align: "left",
    color: "default",
    line: "none",
  },
});

export interface SectionHeaderProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "title" | "color">,
    VariantProps<typeof sectionHeaderVariants> {
  title: React.ReactNode;
  badge?: React.ReactNode;
  eyebrow?: React.ReactNode;
  description?: React.ReactNode;
  decoration?: VariantProps<typeof sectionHeaderVariants>["line"];
  badgeVariant?: BadgeProps["variant"];
  headingAs?: HeadingProps["as"];
  headingSize?: HeadingProps["size"];
  titleClassName?: string;
  badgeClassName?: string;
  descriptionClassName?: string;
}

export const SectionHeader = React.forwardRef<HTMLDivElement, SectionHeaderProps>(
  (
    {
      badge,
      eyebrow,
      title,
      description,
      badgeVariant = "brand-outline",
      align = "left",
      color = "default",
      line = "none",
      decoration,
      headingAs = "h2",
      headingSize = "h2",
      titleClassName,
      badgeClassName,
      descriptionClassName,
      className,
      ...props
    },
    ref
  ) => {
    const effectiveLine = decoration || line;

    return (
      <div
        ref={ref}
        className={cn(
          sectionHeaderVariants({ align, color, line: effectiveLine }),
          className
        )}
        {...props}
      >
        {badge ? (
          <Badge
            variant={badgeVariant}
            className={cn("mb-2 sm:mb-3", badgeClassName)}
          >
            {badge}
          </Badge>
        ) : eyebrow ? (
          <Eyebrow className={cn("mb-2 sm:mb-3", badgeClassName)}>
            {eyebrow}
          </Eyebrow>
        ) : null}
        <Heading
          as={headingAs}
          size={headingSize}
          className={cn(
            color === "inverted"
              ? "text-white"
              : color === "muted"
              ? "text-brand-text/70"
              : undefined,
            titleClassName
          )}
        >
          {title}
        </Heading>
        {description && (
          <Text
            variant="body"
            className={cn("mt-2 max-w-prose", descriptionClassName)}
          >
            {description}
          </Text>
        )}
      </div>
    );
  }
);
SectionHeader.displayName = "SectionHeader";
