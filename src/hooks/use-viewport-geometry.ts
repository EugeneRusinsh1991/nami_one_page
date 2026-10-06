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
let lastAppliedWidth = -1;

/**
 * Pure synchronization helper writing custom properties to documentElement.
 * Locks `--app-screen-h` strictly to physical screen height on mobile.
 */
export function syncViewportCustomProperties(force = false): void {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return;
  }

  const root = document.documentElement;
  const currentWidth = window.innerWidth;
  const isTouch = window.matchMedia("(pointer: coarse)").matches || /iPhone|iPad|Android/i.test(navigator.userAgent);

  // On touch/mobile devices, lock strictly to physical screen height to prevent URL-bar jitter
  const rawHeight = isTouch && window.screen?.height
    ? window.screen.height
    : window.innerHeight;
  const heightPx = Math.round(rawHeight);

  // Only update height if never applied, forced, or width changed (orientation change)
  if (force || lastAppliedHeight === -1 || Math.abs(currentWidth - lastAppliedWidth) >= 4) {
    lastAppliedHeight = heightPx;
    lastAppliedWidth = currentWidth;
    root.style.setProperty("--app-screen-h", `${heightPx}px`);
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

    const update = (force = false) => {
      syncViewportCustomProperties(force);
      setGeometry(readCurrentGeometry());
    };

    update();

    const handleOrientationChange = () => {
      if (rafId !== null) return;
      rafId = window.requestAnimationFrame(() => {
        rafId = null;
        update(true);
      });
    };

    const handleResize = () => {
      // Ignore vertical browser bar collapse/expand; only update when width changes
      if (Math.abs(window.innerWidth - lastAppliedWidth) >= 4) {
        handleOrientationChange();
      }
    };

    window.addEventListener("resize", handleResize, { passive: true });
    window.addEventListener("orientationchange", handleOrientationChange, { passive: true });

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("orientationchange", handleOrientationChange);
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
