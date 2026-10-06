"use client";

import { useEffect, useState } from "react";

export interface ViewportGeometry {
  screenHeight: number;
  windowHeight: number;
  visualViewportHeight: number;
  safeAreaTop: number;
  safeAreaBottom: number;
}

const SSR_VIEWPORT_GEOMETRY: ViewportGeometry = {
  screenHeight: 0,
  windowHeight: 0,
  visualViewportHeight: 0,
  safeAreaTop: 0,
  safeAreaBottom: 0,
};

let lastAppliedHeight = -1;

/**
 * Pure synchronization helper writing custom properties to documentElement.
 * Writes `--app-screen-h`, `--app-safe-top`, and `--app-safe-bottom`.
 * Default height uses `100lvh` with fallback to physical height / innerHeight.
 */
export function syncViewportCustomProperties(): void {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return;
  }

  const root = document.documentElement;

  // Determine physical/large viewport height to avoid dynamic address bar jitter
  // 100lvh is preferred in modern browsers; we set CSS property to 100lvh if supported,
  // while synchronizing integer px values or 100lvh fallback.
  const heightPx = Math.round(
    window.visualViewport?.height && Math.abs(window.visualViewport.height - window.innerHeight) > 100
      ? window.innerHeight
      : window.innerHeight
  );

  // Prevent micro sub-pixel thrashing (only update if height change > 1px)
  if (Math.abs(heightPx - lastAppliedHeight) >= 2) {
    lastAppliedHeight = heightPx;
    // CSS fallback chain: modern browsers use 100lvh, with exact px fallback
    if (CSS.supports && CSS.supports("height", "100lvh")) {
      root.style.setProperty("--app-screen-h", "100lvh");
    } else {
      root.style.setProperty("--app-screen-h", `${heightPx}px`);
    }
  }

  // Ensure safe area CSS variables exist on root if not already defined
  if (!root.style.getPropertyValue("--app-safe-top")) {
    root.style.setProperty("--app-safe-top", "env(safe-area-inset-top, 0px)");
  }
  if (!root.style.getPropertyValue("--app-safe-bottom")) {
    root.style.setProperty("--app-safe-bottom", "env(safe-area-inset-bottom, 0px)");
  }
}

function parseComputedPx(value: string): number {
  const parsed = parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function readCurrentGeometry(): ViewportGeometry {
  if (typeof window === "undefined") {
    return SSR_VIEWPORT_GEOMETRY;
  }

  const screenHeight = window.screen?.height ?? window.innerHeight;
  const windowHeight = window.innerHeight;
  const visualViewportHeight = window.visualViewport?.height ?? window.innerHeight;

  let safeAreaTop = 0;
  let safeAreaBottom = 0;

  if (typeof document !== "undefined") {
    const computed = window.getComputedStyle(document.documentElement);
    safeAreaTop = parseComputedPx(computed.getPropertyValue("--app-safe-top"));
    safeAreaBottom = parseComputedPx(computed.getPropertyValue("--app-safe-bottom"));
  }

  return {
    screenHeight,
    windowHeight,
    visualViewportHeight,
    safeAreaTop,
    safeAreaBottom,
  };
}

/**
 * React lifecycle hook managing resize, orientation change and visualViewport.
 */
export function useViewportGeometry(): ViewportGeometry {
  const [geometry, setGeometry] = useState<ViewportGeometry>(SSR_VIEWPORT_GEOMETRY);

  useEffect(() => {
    let rafId: number | null = null;

    const update = () => {
      syncViewportCustomProperties();
      setGeometry(readCurrentGeometry());
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
    window.addEventListener("orientationchange", handleResize, { passive: true });

    const visualViewport = window.visualViewport;
    if (visualViewport) {
      visualViewport.addEventListener("resize", handleResize, { passive: true });
    }

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("orientationchange", handleResize);
      if (visualViewport) {
        visualViewport.removeEventListener("resize", handleResize);
      }
      if (rafId !== null) {
        window.cancelAnimationFrame(rafId);
      }
    };
  }, []);

  return geometry;
}

/**
 * Headless client component initializing viewport geometry synchronization in layout.
 */
export function ViewportInitializer(): null {
  useViewportGeometry();
  return null;
}
