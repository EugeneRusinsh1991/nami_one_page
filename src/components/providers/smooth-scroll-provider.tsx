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

export interface StepThresholdConfig {
  touchLargeDistanceThreshold: number; // large swipe across screen (px)
  touchFastVelocityThreshold: number;  // fast vigorous flick (px/ms)
  touchFastMinDistance: number;        // minimum displacement required for flick upgrade (px)
  wheelLargeDeltaThreshold: number;    // vigorous wheel spin or trackpad fling (px)
}

export const DEFAULT_STEP_THRESHOLDS: StepThresholdConfig = {
  touchLargeDistanceThreshold: 360,
  touchFastVelocityThreshold: 2.4,
  touchFastMinDistance: 160,
  wheelLargeDeltaThreshold: 400,
};

export function calculateStepCount(
  distance: number,
  velocity = 0,
  isTouch = false,
  config = DEFAULT_STEP_THRESHOLDS
): number {
  if (isTouch) {
    const isLargeSwipe = distance >= config.touchLargeDistanceThreshold;
    const isStrongFlick =
      velocity >= config.touchFastVelocityThreshold &&
      distance >= config.touchFastMinDistance;
    return isLargeSwipe || isStrongFlick ? 2 : 1;
  }
  return distance >= config.wheelLargeDeltaThreshold ? 2 : 1;
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
      isTouch: false,
      lockedDirection: null as "horizontal" | "vertical" | null,
      accumX: 0,
      accumY: 0,
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
      gesture.lockedDirection = null;
      gesture.accumX = 0;
      gesture.accumY = 0;
      gesture.startY = touch.clientY;
      gesture.startTime = now;
      gesture.lastY = touch.clientY;
      gesture.lastTime = now;
      gesture.peakVelocity = 0;
      gesture.maxDisplacement = 0;
      if (now >= gateUntil) {
        activeDirection = null;
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      const touch = e.touches[0];
      if (!touch) return;
      gesture.isTouch = true;
      const now = performance.now();
      const dt = now - gesture.lastTime;
      const totalDist = Math.abs(touch.clientY - gesture.startY);
      if (totalDist > gesture.maxDisplacement) {
        gesture.maxDisplacement = totalDist;
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
      scheduleReset();
    };

    const resetGesture = () => {
      gesture.isTouch = false;
      gesture.lockedDirection = null;
      gesture.accumX = 0;
      gesture.accumY = 0;
      gesture.peakVelocity = 0;
      gesture.maxDisplacement = 0;
      if (performance.now() >= gateUntil) {
        activeDirection = null;
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
      syncTouch: true,
      syncTouchLerp: 0.10,
      touchMultiplier: 1.25,
      touchInertiaExponent: 1.02,
      virtualScroll: (data) => {
        scheduleReset();
        if (data.event && "touches" in data.event) {
          gesture.isTouch = true;
        }

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
    let currentStepCount = 1;

    lenisInstance.scrollTo = (target: any, opts: any = {}) => {
      if (opts.programmatic !== false || typeof target !== "number") {
        return origScrollTo(target, opts);
      }

      const now = performance.now();
      const current = lenisInstance.scroll;
      const isGated = now < gateUntil;

      const rawDelta = Math.abs(target - current);
      const evalDistance = gesture.isTouch
        ? gesture.maxDisplacement
        : Math.max(Math.abs(gesture.accumY), rawDelta);
      const evaluatedSteps = calculateStepCount(
        evalDistance,
        gesture.peakVelocity,
        gesture.isTouch
      );

      // In-flight upgrade: if currently running 1 step, but user continued gesture with high velocity/distance
      const canUpgrade = isGated && currentStepCount === 1 && evaluatedSteps >= 2;
      const effectiveSteps = canUpgrade ? evaluatedSteps : isGated ? currentStepCount : evaluatedSteps;

      const { target: resolved, discrete } = resolveScrollTarget(
        current,
        target,
        getScrollZones(),
        isGated && !canUpgrade ? activeDirection : null,
        effectiveSteps
      );

      // Non-discrete scroll targets (e.g. beyond bounds or micro-deltas): bypass discrete step gating
      if (!discrete) {
        activeDirection = null;
        return origScrollTo(resolved, opts);
      }

      const quiet = now - lastEvent;
      lastEvent = now;

      // During active step transition, suppress micro-deltas unless this is an in-flight upgrade
      if (isGated && !canUpgrade) {
        if (now < gateUntil - STEP_TAIL_MS || quiet < GESTURE_QUIET_MS) return;
      } else if (!isGated && quiet < GESTURE_QUIET_MS) {
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
