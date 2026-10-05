import * as React from "react";
import { cn } from "@/lib/utils";

export interface EyebrowProps extends React.HTMLAttributes<HTMLElement> {
  as?: "span" | "p" | "div";
  accent?: boolean;
}

export interface HeadingProps extends React.HTMLAttributes<HTMLHeadingElement> {
  as?: "h1" | "h2" | "h3" | "h4";
  size?: "display" | "h1" | "h2" | "h3" | "h4";
}

export interface TextProps extends React.HTMLAttributes<HTMLElement> {
  as?: "p" | "span" | "div";
  variant?: "body" | "subtle" | "caption" | "code";
}

const headingSizes: Record<NonNullable<HeadingProps["size"]>, string> = {
  display: "text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl",
  h1: "text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl lg:text-6xl leading-tight",
  h2: "text-2xl font-bold tracking-tight sm:text-3xl md:text-4xl lg:text-5xl leading-tight",
  h3: "text-xl font-semibold tracking-tight sm:text-2xl leading-snug",
  h4: "text-lg font-semibold tracking-tight sm:text-xl leading-snug",
};

const textVariants: Record<NonNullable<TextProps["variant"]>, string> = {
  body: "text-base text-brand-text/70 leading-relaxed",
  subtle: "text-sm text-brand-text/70 leading-normal",
  caption: "text-xs text-brand-text/60 leading-normal",
  code: "font-mono text-xs text-brand-accent tracking-wide",
};

export const Eyebrow = React.forwardRef<HTMLElement, EyebrowProps>(
  ({ as: Tag = "span", accent = false, className, children, ...props }, ref) => {
    const Component = Tag as any;
    return (
      <Component
        ref={ref}
        className={cn(
          "font-mono text-[10px] md:text-[11px] uppercase tracking-[0.25em]",
          accent ? "text-brand-accent" : "text-brand-border",
          className
        )}
        {...props}
      >
        {children}
      </Component>
    );
  }
);
Eyebrow.displayName = "Eyebrow";

export const Heading = React.forwardRef<HTMLHeadingElement, HeadingProps>(
  ({ as: Tag = "h2", size = "h2", className, children, ...props }, ref) => {
    const Component = Tag as any;
    return (
      <Component
        ref={ref}
        className={cn(
          "font-heading text-brand-text",
          headingSizes[size],
          className
        )}
        {...props}
      >
        {children}
      </Component>
    );
  }
);
Heading.displayName = "Heading";

export const Text = React.forwardRef<HTMLElement, TextProps>(
  ({ as: Tag = "p", variant = "body", className, children, ...props }, ref) => {
    const Component = Tag as any;
    return (
      <Component
        ref={ref}
        className={cn(textVariants[variant], className)}
        {...props}
      >
        {children}
      </Component>
    );
  }
);
Text.displayName = "Text";
