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

const STEP_DURATION_1_MS = 600;
const STEP_DURATION_2_MS = 850;
const STEP_DURATION_3_MS = 1050;
const STEP_TAIL_MS = 120;
const GESTURE_QUIET_MS = 120;
const STEP_EASING = (t: number) => 1 - Math.pow(1 - t, 3);

export interface DeviceScrollMode {
  isTouchDevice: boolean;
  allowNativeMomentum: boolean;
  enableDiscreteWheel: boolean;
}

export function detectDeviceScrollMode(): DeviceScrollMode {
  if (typeof window === "undefined") {
    return { isTouchDevice: false, allowNativeMomentum: false, enableDiscreteWheel: true };
  }
  const isTouchDevice =
    "ontouchstart" in window ||
    navigator.maxTouchPoints > 0 ||
    window.matchMedia("(pointer: coarse)").matches;

  return {
    isTouchDevice,
    allowNativeMomentum: isTouchDevice,
    enableDiscreteWheel: !isTouchDevice,
  };
}

export interface StepThresholdConfig {
  touchLargeDistanceThreshold: number; // large swipe across screen (px)
  touchFastVelocityThreshold: number;  // fast vigorous flick (px/ms)
  touchFastMinDistance: number;        // minimum displacement required for flick upgrade (px)
  wheelLargeDeltaThreshold: number;    // vigorous wheel spin or trackpad fling (px)
}

export function getDynamicStepThresholds(): StepThresholdConfig {
  if (typeof window === "undefined") {
    return DEFAULT_STEP_THRESHOLDS;
  }
  const vh = window.innerHeight;
  return {
    touchLargeDistanceThreshold: Math.max(520, Math.round(vh * 0.55)),
    touchFastVelocityThreshold: 3.5,
    touchFastMinDistance: Math.max(440, Math.round(vh * 0.45)),
    wheelLargeDeltaThreshold: Math.max(850, Math.round(vh * 0.75)),
  };
}

export const DEFAULT_STEP_THRESHOLDS: StepThresholdConfig = {
  touchLargeDistanceThreshold: 520,
  touchFastVelocityThreshold: 3.5,
  touchFastMinDistance: 440,
  wheelLargeDeltaThreshold: 850,
};

export function calculateStepCount(
  distance: number,
  velocity = 0,
  isTouch = false,
  config?: StepThresholdConfig
): number {
  const activeConfig =
    config ??
    (typeof window !== "undefined"
      ? getDynamicStepThresholds()
      : DEFAULT_STEP_THRESHOLDS);

  if (isTouch) {
    const isLargeSwipe = distance >= activeConfig.touchLargeDistanceThreshold;
    const isStrongFlick =
      velocity >= activeConfig.touchFastVelocityThreshold &&
      distance >= activeConfig.touchFastMinDistance;
    return isLargeSwipe || isStrongFlick ? 2 : 1;
  }
  return distance >= activeConfig.wheelLargeDeltaThreshold ? 2 : 1;
}

const INTENT_LOCK_THRESHOLD = 5;
const INTENT_RATIO = 1.0;
const INTENTIONAL_VERTICAL_THRESHOLD = 20;
const GESTURE_RESET_TIMEOUT_MS = 160;

export function SmoothScrollProvider({ children }: SmoothScrollProviderProps) {
  const [lenis, setLenis] = useState<Lenis | null>(null);
  const { locale } = useLanguage();

  useEffect(() => {
    const deviceMode = detectDeviceScrollMode();

    const gesture = {
      isTouch: false,
      touchActive: false,
      touchStepsCommitted: 0,
      lockedDirection: null as "horizontal" | "vertical" | null,
      accumX: 0,
      accumY: 0,
      startX: 0,
      startY: 0,
      startTime: 0,
      lastY: 0,
      lastTime: 0,
      peakVelocity: 0,
      maxDisplacement: 0,
      resetTimer: null as ReturnType<typeof setTimeout> | null,
    };

    const onTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      if (!touch) return;
      const now = performance.now();
      gesture.isTouch = true;
      gesture.touchActive = true;
      gesture.touchStepsCommitted = 0;
      gesture.lockedDirection = null;
      gesture.accumX = 0;
      gesture.accumY = 0;
      gesture.startX = touch.clientX;
      gesture.startY = touch.clientY;
      gesture.startTime = now;
      gesture.lastY = touch.clientY;
      gesture.lastTime = now;
      gesture.peakVelocity = 0;
      gesture.maxDisplacement = 0;
      if (now >= gateUntil) {
        activeDirection = null;
        gateUntil = 0;
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      const touch = e.touches[0];
      if (!touch) return;
      gesture.isTouch = true;
      gesture.touchActive = true;

      const now = performance.now();
      const dt = now - gesture.lastTime;
      const totalDist = Math.abs(touch.clientY - gesture.startY);
      if (totalDist > gesture.maxDisplacement) {
        gesture.maxDisplacement = totalDist;
      }

      if (gesture.lockedDirection === null) {
        const dx = Math.abs(touch.clientX - gesture.startX);
        const dy = Math.abs(touch.clientY - gesture.startY);
        if (Math.hypot(dx, dy) >= INTENT_LOCK_THRESHOLD) {
          gesture.lockedDirection = dx >= dy * INTENT_RATIO ? "horizontal" : "vertical";
        }
      }

      if (dt > 12) {
        const instantV = Math.abs(touch.clientY - gesture.lastY) / dt;
        if (instantV > gesture.peakVelocity) {
          gesture.peakVelocity = instantV;
        }
        gesture.lastY = touch.clientY;
        gesture.lastTime = now;
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (e.touches.length === 0) {
        gesture.touchActive = false;
      }
      const touch = e.changedTouches[0];
      if (touch) {
        const totalDist = Math.abs(touch.clientY - gesture.startY);
        if (totalDist > gesture.maxDisplacement) {
          gesture.maxDisplacement = totalDist;
        }
        const totalDt = performance.now() - gesture.startTime;
        if (totalDt > 12) {
          const overallV = totalDist / totalDt;
          if (overallV > gesture.peakVelocity) {
            gesture.peakVelocity = overallV;
          }
        }
      }
      if (gateUntil > 0 && !gesture.isTouch) {
        gateUntil = Math.max(gateUntil, performance.now() + GESTURE_RESET_TIMEOUT_MS);
      }
      scheduleReset();
    };

    const resetGesture = () => {
      gesture.isTouch = false;
      gesture.touchActive = false;
      gesture.touchStepsCommitted = 0;
      gesture.lockedDirection = null;
      gesture.accumX = 0;
      gesture.accumY = 0;
      gesture.peakVelocity = 0;
      gesture.maxDisplacement = 0;
      if (performance.now() >= gateUntil) {
        activeDirection = null;
        gateUntil = 0;
      }
    };

    const scheduleReset = () => {
      if (gesture.resetTimer) clearTimeout(gesture.resetTimer);
      gesture.resetTimer = setTimeout(resetGesture, GESTURE_RESET_TIMEOUT_MS);
    };

    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("touchend", onTouchEnd, { passive: true });
    window.addEventListener("touchcancel", resetGesture, { passive: true });

    const lenisInstance = new Lenis({
      duration: 1.0,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: "vertical",
      gestureOrientation: "vertical",
      smoothWheel: true,
      wheelMultiplier: 1,
      syncTouch: deviceMode.allowNativeMomentum,
      syncTouchLerp: 0.075,
      touchMultiplier: 1,
      touchInertiaExponent: 1.7,
      virtualScroll: (data) => {
        scheduleReset();
        if (data.event && "touches" in data.event) {
          gesture.isTouch = true;
        } else if (data.event && (data.event as any).type === "wheel") {
          gesture.isTouch = false;
        }

        const { deltaX, deltaY } = data;

        if ((gesture.accumY > 0 && deltaY < 0) || (gesture.accumY < 0 && deltaY > 0)) {
          gesture.accumY = 0;
        }

        gesture.accumX += deltaX;
        gesture.accumY += deltaY;

        if (gesture.lockedDirection === null) {
          const totalDist = Math.hypot(gesture.accumX, gesture.accumY);
          if (totalDist >= INTENT_LOCK_THRESHOLD) {
            gesture.lockedDirection =
              Math.abs(gesture.accumX) >= Math.abs(gesture.accumY) * INTENT_RATIO
                ? "horizontal"
                : "vertical";
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
    let currentStepCount = 1;

    lenisInstance.scrollTo = (target: any, opts: any = {}) => {
      if (opts.programmatic !== false || typeof target !== "number") {
        return origScrollTo(target, opts);
      }

      // Bypass discrete snapping for touch gestures to allow fluid native inertia
      if (gesture.isTouch || !deviceMode.enableDiscreteWheel) {
        return origScrollTo(target, opts);
      }

      const now = performance.now();
      const current = lenisInstance.scroll;
      const isGated = gateUntil > 0 && now < gateUntil;

      const evalDistance = Math.abs(gesture.accumY);
      const evaluatedSteps = calculateStepCount(
        evalDistance,
        0,
        false
      );

      // In-flight upgrade: if currently running 1 step, but user continued gesture with high velocity/distance
      const canUpgrade = isGated && currentStepCount === 1 && evaluatedSteps >= 2;

      // While transition is gated, suppress all trailing micro-deltas and momentum
      if (isGated && !canUpgrade) {
        return;
      }

      const effectiveSteps = canUpgrade ? evaluatedSteps : isGated ? currentStepCount : evaluatedSteps;

      const { target: resolved, discrete } = resolveScrollTarget(
        current,
        target,
        getScrollZones(),
        isGated && !canUpgrade ? activeDirection : null,
        effectiveSteps
      );

      // Non-discrete scroll targets: fallback to normal scroll
      if (!discrete) {
        activeDirection = null;
        return origScrollTo(resolved, opts);
      }

      const quiet = now - lastEvent;
      lastEvent = now;

      if (!isGated && quiet < GESTURE_QUIET_MS) {
        return;
      }

      currentStepCount = effectiveSteps;
      const durationMs = effectiveSteps >= 3 ? STEP_DURATION_3_MS : effectiveSteps === 2 ? STEP_DURATION_2_MS : STEP_DURATION_1_MS;
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
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
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
