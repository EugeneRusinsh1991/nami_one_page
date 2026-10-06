"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Lenis from "lenis";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { useLanguage } from "@/components/providers/language-provider";
import { invalidateScrollZonesCache } from "@/lib/scroll-topology";
import {
  createTouchGestureState,
  ScrollGateState,
  attachTouchGestureTracker,
} from "./smooth-scroll-gestures";
import {
  detectDeviceScrollMode,
  createVirtualScrollHandler,
  attachDiscreteScroll,
} from "./smooth-scroll-controller";

export * from "./smooth-scroll-gestures";
export * from "./smooth-scroll-controller";

const LenisContext = createContext<Lenis | null>(null);

export const useLenis = () => useContext(LenisContext);

interface SmoothScrollProviderProps {
  children: React.ReactNode;
}

export function SmoothScrollProvider({ children }: SmoothScrollProviderProps) {
  const [lenis, setLenis] = useState<Lenis | null>(null);
  const { locale } = useLanguage();
  const pathname = usePathname();

  useEffect(() => {
    const deviceMode = detectDeviceScrollMode();
    const gesture = createTouchGestureState();
    const gateState: ScrollGateState = {
      gateUntil: 0,
      activeDirection: null,
    };

    const { cleanup: cleanupGestures, scheduleReset } = attachTouchGestureTracker(
      gesture,
      gateState
    );

    const lenisInstance = new Lenis({
      duration: 1.0,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: "vertical",
      gestureOrientation: "vertical",
      smoothWheel: true,
      wheelMultiplier: 1,
      syncTouch: true,
      syncTouchLerp: 0.075,
      touchMultiplier: 1,
      touchInertiaExponent: 1.7,
      allowNestedScroll: true,
      virtualScroll: createVirtualScrollHandler(gesture, scheduleReset),
    });

    attachDiscreteScroll(lenisInstance, deviceMode.enableDiscreteScroll, gesture, gateState);

    setLenis(lenisInstance);

    // Synchronize Lenis scroll with GSAP ScrollTrigger
    lenisInstance.on("scroll", ScrollTrigger.update);

    const updateTicker = (time: number) => {
      lenisInstance.raf(time * 1000);
    };

    gsap.ticker.add(updateTicker);
    gsap.ticker.lagSmoothing(500, 33);

    return () => {
      cleanupGestures();
      gsap.ticker.remove(updateTicker);
      lenisInstance.destroy();
      setLenis(null);
    };
  }, []);

  useEffect(() => {
    if (!lenis) return;

    let inner = 0;
    const outer = requestAnimationFrame(() => {
      inner = requestAnimationFrame(() => {
        invalidateScrollZonesCache();
        ScrollTrigger.refresh();
        lenis.resize();
      });
    });

    const onResize = () => {
      lenis.resize();
    };
    window.addEventListener("resize", onResize, { passive: true });
    window.addEventListener("orientationchange", onResize, { passive: true });

    return () => {
      cancelAnimationFrame(outer);
      cancelAnimationFrame(inner);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("orientationchange", onResize);
    };
  }, [locale, pathname, lenis]);

  return (
    <LenisContext.Provider value={lenis}>
      {children}
    </LenisContext.Provider>
  );
}
