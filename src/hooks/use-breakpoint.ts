"use client";

import { useEffect, useState } from "react";

export const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
} as const;

export type BreakpointKey = keyof typeof BREAKPOINTS;

export interface UseBreakpointReturn {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  activeBreakpoint: BreakpointKey | "base";
  isAbove: (key: BreakpointKey) => boolean;
  isBelow: (key: BreakpointKey) => boolean;
}

export function isMobileWidth(width?: number): boolean {
  if (typeof width === "number") {
    return width < BREAKPOINTS.md;
  }
  if (typeof window !== "undefined") {
    return window.innerWidth < BREAKPOINTS.md;
  }
  return false;
}

function resolveBreakpointState(width: number): UseBreakpointReturn {
  const isMobile = width < BREAKPOINTS.md;
  const isTablet = width >= BREAKPOINTS.md && width < BREAKPOINTS.lg;
  const isDesktop = width >= BREAKPOINTS.lg;

  let activeBreakpoint: BreakpointKey | "base" = "base";
  if (width >= BREAKPOINTS.xl) {
    activeBreakpoint = "xl";
  } else if (width >= BREAKPOINTS.lg) {
    activeBreakpoint = "lg";
  } else if (width >= BREAKPOINTS.md) {
    activeBreakpoint = "md";
  } else if (width >= BREAKPOINTS.sm) {
    activeBreakpoint = "sm";
  }

  return {
    isMobile,
    isTablet,
    isDesktop,
    activeBreakpoint,
    isAbove: (key: BreakpointKey) => width >= BREAKPOINTS[key],
    isBelow: (key: BreakpointKey) => width < BREAKPOINTS[key],
  };
}

const SSR_DEFAULT: UseBreakpointReturn = {
  isMobile: false,
  isTablet: false,
  isDesktop: false,
  activeBreakpoint: "base",
  isAbove: () => false,
  isBelow: () => true,
};

export function useBreakpoint(): UseBreakpointReturn {
  const [breakpoint, setBreakpoint] = useState<UseBreakpointReturn>(SSR_DEFAULT);

  useEffect(() => {
    let rafId: number | null = null;

    const update = () => {
      setBreakpoint(resolveBreakpointState(window.innerWidth));
    };

    update();

    const handleResize = () => {
      if (rafId !== null) return;
      rafId = window.requestAnimationFrame(() => {
        rafId = null;
        update();
      });
    };

    window.addEventListener("resize", handleResize, { passive: true });
    return () => {
      window.removeEventListener("resize", handleResize);
      if (rafId !== null) {
        window.cancelAnimationFrame(rafId);
      }
    };
  }, []);

  return breakpoint;
}
