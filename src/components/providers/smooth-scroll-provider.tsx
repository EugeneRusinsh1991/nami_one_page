"use client";

import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import Lenis from "lenis";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { useLanguage } from "@/components/providers/language-provider";
import { getScrollZones, resolveScrollTarget } from "@/lib/scroll-breakpoints";

const LenisContext = createContext<Lenis | null>(null);

export const useLenis = () => useContext(LenisContext);

interface SmoothScrollProviderProps {
  children: React.ReactNode;
}

const STEP_DURATION_1_MS = 900;
const STEP_DURATION_2_MS = 1250;
const STEP_DURATION_3_MS = 1500;
const STEP_TAIL_MS = 500;
const GESTURE_QUIET_MS = 140;
const STEP_EASING = (t: number) => 1 - Math.pow(1 - t, 4);

export interface StepThresholdConfig {
  twoStepDeltaThreshold: number;
  threeStepDeltaThreshold?: number;
}

export const DEFAULT_STEP_THRESHOLDS: StepThresholdConfig = {
  twoStepDeltaThreshold: 140,
  // threeStepDeltaThreshold: 300, // available for 3-step expansion
};

export function calculateStepCount(magnitude: number, config = DEFAULT_STEP_THRESHOLDS): number {
  if (config.threeStepDeltaThreshold && magnitude >= config.threeStepDeltaThreshold) {
    return 3;
  }
  if (magnitude >= config.twoStepDeltaThreshold) {
    return 2;
  }
  return 1;
}

const INTENT_LOCK_THRESHOLD = 5;
const INTENT_RATIO = 1.0;
const INTENTIONAL_VERTICAL_THRESHOLD = 20;
const GESTURE_RESET_TIMEOUT_MS = 160;

export function SmoothScrollProvider({ children }: SmoothScrollProviderProps) {
  const [lenis, setLenis] = useState<Lenis | null>(null);
  const { locale } = useLanguage();

  useEffect(() => {
    const gesture = {
      lockedDirection: null as "horizontal" | "vertical" | null,
      accumX: 0,
      accumY: 0,
      resetTimer: null as ReturnType<typeof setTimeout> | null,
    };

    const resetGesture = () => {
      gesture.lockedDirection = null;
      gesture.accumX = 0;
      gesture.accumY = 0;
      if (performance.now() >= gateUntil) {
        activeDirection = null;
      }
    };

    const scheduleReset = () => {
      if (gesture.resetTimer) clearTimeout(gesture.resetTimer);
      gesture.resetTimer = setTimeout(resetGesture, GESTURE_RESET_TIMEOUT_MS);
    };

    window.addEventListener("touchstart", resetGesture, { passive: true });
    window.addEventListener("touchend", resetGesture, { passive: true });
    window.addEventListener("touchcancel", resetGesture, { passive: true });

    const lenisInstance = new Lenis({
      duration: 1.0,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: "vertical",
      gestureOrientation: "vertical",
      smoothWheel: true,
      wheelMultiplier: 1,
      syncTouch: true,
      syncTouchLerp: 0.10,
      touchMultiplier: 1.25,
      touchInertiaExponent: 1.02,
      virtualScroll: (data) => {
        scheduleReset();

        const { deltaX, deltaY } = data;
        const absX = Math.abs(deltaX);
        const absY = Math.abs(deltaY);

        gesture.accumX += deltaX;
        gesture.accumY += deltaY;

        if (gesture.lockedDirection === null) {
          const totalDist = Math.hypot(gesture.accumX, gesture.accumY);
          if (totalDist >= INTENT_LOCK_THRESHOLD) {
            gesture.lockedDirection =
              Math.abs(gesture.accumX) >= Math.abs(gesture.accumY) * INTENT_RATIO
                ? "horizontal"
                : "vertical";
          } else if (absX > absY) {
            return false;
          }
        }

        if (gesture.lockedDirection === "horizontal") {
          return false;
        }

        return true;
      },
    });

    // Intercept user-initiated gestures and clamp target to the next immediate breakpoint
    const origScrollTo = lenisInstance.scrollTo.bind(lenisInstance);
    let lastEvent = 0;
    let gateUntil = 0;
    let activeDirection: "down" | "up" | null = null;

    lenisInstance.scrollTo = (target: any, opts: any = {}) => {
      if (opts.programmatic !== false || typeof target !== "number") {
        return origScrollTo(target, opts);
      }

      const now = performance.now();
      const current = lenisInstance.scroll;
      const isGated = now < gateUntil;

      const rawDelta = Math.abs(target - current);
      const gestureDelta = Math.abs(gesture.accumY);
      const stepCount = calculateStepCount(Math.max(rawDelta, gestureDelta));

      const { target: resolved, discrete } = resolveScrollTarget(
        current,
        target,
        getScrollZones(),
        isGated ? activeDirection : null,
        stepCount
      );

      // Non-discrete scroll targets (e.g. beyond bounds or micro-deltas): bypass discrete step gating
      if (!discrete) {
        activeDirection = null;
        return origScrollTo(resolved, opts);
      }

      const quiet = now - lastEvent;
      lastEvent = now;

      // During active step transition, suppress contrary or redundant micro-deltas
      if (isGated) {
        if (now < gateUntil - STEP_TAIL_MS || quiet < GESTURE_QUIET_MS) return;
      } else if (quiet < GESTURE_QUIET_MS) {
        return;
      }

      const durationMs = stepCount >= 3 ? STEP_DURATION_3_MS : stepCount === 2 ? STEP_DURATION_2_MS : STEP_DURATION_1_MS;
      activeDirection = resolved > current ? "down" : "up";
      gateUntil = now + durationMs + STEP_TAIL_MS;

      return origScrollTo(resolved, {
        ...opts,
        lerp: undefined,
        duration: durationMs / 1000,
        easing: STEP_EASING,
      });
    };

    setLenis(lenisInstance);

    // Synchronize Lenis scroll with GSAP ScrollTrigger
    lenisInstance.on("scroll", ScrollTrigger.update);

    const updateTicker = (time: number) => {
      lenisInstance.raf(time * 1000);
    };

    gsap.ticker.add(updateTicker);
    gsap.ticker.lagSmoothing(0);

    return () => {
      window.removeEventListener("touchstart", resetGesture);
      window.removeEventListener("touchend", resetGesture);
      window.removeEventListener("touchcancel", resetGesture);
      if (gesture.resetTimer) clearTimeout(gesture.resetTimer);
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
        ScrollTrigger.refresh();
        lenis.resize();
      });
    });

    return () => {
      cancelAnimationFrame(outer);
      cancelAnimationFrame(inner);
    };
  }, [locale, lenis]);

  return (
    <LenisContext.Provider value={lenis}>
      {children}
    </LenisContext.Provider>
  );
}
