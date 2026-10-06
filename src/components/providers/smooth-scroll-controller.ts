import Lenis from "lenis";
import {
  type ScrollSectionId,
  getScrollZones,
  resolveScrollTarget,
  resolveActiveSection,
} from "@/lib/scroll-topology";
import {
  INTENT_LOCK_THRESHOLD,
  INTENT_RATIO,
  TouchTrackerState,
  ScrollGateState,
  shouldAllowScrollEvent,
  resolveGestureStepCount,
  attachTouchGestureTracker,
} from "./smooth-scroll-gestures";
import { detectDevice } from "@/lib/device-detection";

export { attachTouchGestureTracker };

export interface SectionScrollTiming {
  step1Ms: number;
  step2Ms: number;
  step3Ms: number;
  easing: (t: number) => number;
}

export const SINE_EASING = (t: number) => 0.5 * (1 - Math.cos(Math.PI * t));
export const CUBIC_OUT_EASING = (t: number) => 1 - Math.pow(1 - t, 3);

export const UNIFIED_SCROLL_TIMING: SectionScrollTiming = {
  step1Ms: 600,
  step2Ms: 1150,
  step3Ms: 1450,
  easing: SINE_EASING,
};

export const SECTION_TIMINGS: Record<ScrollSectionId, SectionScrollTiming> = {
  hero: UNIFIED_SCROLL_TIMING,
  technique: UNIFIED_SCROLL_TIMING,
  default: UNIFIED_SCROLL_TIMING,
};

export const STEP_TAIL_MS = 70;
export const GESTURE_QUIET_MS = 70;

export interface DeviceScrollMode {
  isTouchDevice: boolean;
  enableDiscreteScroll: boolean;
  allowNativeMomentum?: boolean;
  enableDiscreteWheel?: boolean;
}

export function detectDeviceScrollMode(): DeviceScrollMode {
  if (typeof window === "undefined") {
    return {
      isTouchDevice: false,
      enableDiscreteScroll: true,
      allowNativeMomentum: false,
      enableDiscreteWheel: true,
    };
  }

  const { isTouch } = detectDevice();

  return {
    isTouchDevice: isTouch,
    enableDiscreteScroll: true,
    allowNativeMomentum: false,
    enableDiscreteWheel: true,
  };
}

export interface StepThresholdConfig {
  touchLargeDistanceThreshold: number; // large swipe across screen (px)
  touchFastVelocityThreshold: number;  // fast vigorous flick (px/ms)
  touchFastMinDistance: number;        // minimum displacement required for flick upgrade (px)
  wheelLargeDeltaThreshold: number;    // vigorous wheel spin or trackpad fling (px)
}

export const DEFAULT_STEP_THRESHOLDS: StepThresholdConfig = {
  touchLargeDistanceThreshold: 520,
  touchFastVelocityThreshold: 3.5,
  touchFastMinDistance: 440,
  wheelLargeDeltaThreshold: 850,
};

export function getDynamicStepThresholds(): StepThresholdConfig {
  if (typeof window === "undefined") {
    return DEFAULT_STEP_THRESHOLDS;
  }
  const vh = window.innerHeight || window.visualViewport?.height || 800;
  return {
    touchLargeDistanceThreshold: Math.max(520, Math.round(vh * 0.65)),
    touchFastVelocityThreshold: 3.8,
    touchFastMinDistance: Math.max(440, Math.round(vh * 0.55)),
    wheelLargeDeltaThreshold: Math.max(850, Math.round(vh * 0.75)),
  };
}

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

export function shouldBypassDiscreteScroll(
  target: unknown,
  opts: { programmatic?: boolean } | undefined,
  enableDiscreteScroll: boolean
): boolean {
  if (typeof target !== "number") return true;
  if (opts?.programmatic !== false) return true;
  return !enableDiscreteScroll;
}

export function calculateRawScrollTarget(
  target: number,
  current: number,
  isTouch: boolean,
  accumY: number,
  lockedDirection?: "down" | "up" | null
): number {
  if (!isTouch) {
    return target;
  }
  const dirFromLock = lockedDirection === "down" ? 1 : lockedDirection === "up" ? -1 : 0;
  const touchDir = dirFromLock || Math.sign(target - current) || Math.sign(accumY);
  return current + touchDir * Math.max(Math.abs(target - current), 100);
}

export function getSectionStepTiming(
  section: ScrollSectionId,
  steps: number
): { durationMs: number; easing: (t: number) => number } {
  const profile = SECTION_TIMINGS[section] || SECTION_TIMINGS.default;
  let durationMs = profile.step1Ms;
  if (steps >= 3) durationMs = profile.step3Ms;
  else if (steps === 2) durationMs = profile.step2Ms;
  return { durationMs, easing: profile.easing };
}

export function isWithinQuietPeriod(
  now: number,
  lastStepTime: number,
  isGated: boolean
): boolean {
  return !isGated && lastStepTime > 0 && now - lastStepTime < GESTURE_QUIET_MS;
}

export function createVirtualScrollHandler(
  gesture: TouchTrackerState,
  scheduleReset: () => void
) {
  return (data: any) => {
    scheduleReset();
    if ((data.event as any)?.type === "touchstart") return false;
    const isTouch = Boolean(
      data.event &&
      ("touches" in data.event || (data.event as any).type?.startsWith("touch"))
    );
    const isWheel = !isTouch;
    gesture.isTouch = isTouch;

    const target = (data.event as any)?.target as HTMLElement | null;
    const { deltaX, deltaY } = data;

    if (gesture.lockedVerticalDirection === null && Math.abs(gesture.accumY) >= INTENT_LOCK_THRESHOLD) {
      gesture.lockedVerticalDirection = gesture.accumY > 0 ? "down" : "up";
    }

    // Suppress contrary vertical deltas during an active locked gesture (e.g. finger recoil, rubber-band back)
    if (gesture.lockedVerticalDirection === "down" && deltaY < 0) {
      return false;
    }
    if (gesture.lockedVerticalDirection === "up" && deltaY > 0) {
      return false;
    }

    if ((gesture.accumY > 0 && deltaY < 0) || (gesture.accumY < 0 && deltaY > 0)) {
      if (gesture.lockedVerticalDirection === null) {
        gesture.accumY = 0;
      }
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

    return shouldAllowScrollEvent({
      target,
      deltaX,
      deltaY,
      isWheel,
      lockedDirection: gesture.lockedDirection,
      accumX: gesture.accumX,
      accumY: gesture.accumY,
    });
  };
}

export function attachDiscreteScroll(
  lenis: Lenis,
  enableDiscreteScroll: boolean,
  gesture: TouchTrackerState,
  gateState: ScrollGateState
) {
  const origScrollTo = lenis.scrollTo.bind(lenis);
  let lastStepTime = 0;
  let currentStepCount = 1;

  lenis.scrollTo = (target: any, opts: any = {}) => {
    if (shouldBypassDiscreteScroll(target, opts, enableDiscreteScroll)) {
      return origScrollTo(target, opts);
    }

    const evaluatedSteps = resolveGestureStepCount(gesture);
    if (evaluatedSteps === null) {
      return;
    }

    const now = performance.now();
    const isGated = gateState.gateUntil > 0 && now < gateState.gateUntil;
    const canUpgrade = isGated && currentStepCount === 1 && evaluatedSteps >= 2;

    if (isGated && !canUpgrade) {
      return;
    }

    if (isWithinQuietPeriod(now, lastStepTime, isGated)) {
      return;
    }

    const current = lenis.scroll;
    const rawTarget = calculateRawScrollTarget(
      target,
      current,
      gesture.isTouch,
      gesture.accumY,
      gesture.lockedVerticalDirection
    );

    const { target: resolved, discrete } = resolveScrollTarget(
      current,
      rawTarget,
      getScrollZones(),
      gesture.lockedVerticalDirection,
      evaluatedSteps
    );

    if (!discrete) {
      if (gesture.isTouch) {
        gesture.stepsCommitted += evaluatedSteps;
      }
      gateState.activeDirection = rawTarget > current ? "down" : "up";
      gateState.gateUntil = Math.max(gateState.gateUntil, now + 350);
      lastStepTime = now;
      return origScrollTo(resolved, opts);
    }

    currentStepCount = evaluatedSteps;
    gesture.stepsCommitted += evaluatedSteps;
    lastStepTime = now;
    const section = resolveActiveSection(current, resolved);
    const { durationMs, easing } = getSectionStepTiming(section, evaluatedSteps);
    gateState.activeDirection = resolved > current ? "down" : "up";
    gateState.gateUntil = now + durationMs + STEP_TAIL_MS;

    return origScrollTo(resolved, {
      ...opts,
      lerp: undefined,
      duration: durationMs / 1000,
      easing,
      lock: true,
    });
  };
}
