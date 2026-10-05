export type ScrollSectionId = "hero" | "technique" | "default";

export interface SectionScrollTiming {
  step1Ms: number;
  step2Ms: number;
  step3Ms: number;
  easing: (t: number) => number;
}

export const SINE_EASING = (t: number) => 0.5 * (1 - Math.cos(Math.PI * t));
export const CUBIC_OUT_EASING = (t: number) => 1 - Math.pow(1 - t, 3);

export const SECTION_TIMINGS: Record<ScrollSectionId, SectionScrollTiming> = {
  hero: {
    step1Ms: 670,
    step2Ms: 1000,
    step3Ms: 1270,
    easing: SINE_EASING,
  },
  technique: {
    step1Ms: 600, // 20% slower than base 500ms (500 * 1.20)
    step2Ms: 900,
    step3Ms: 1140,
    easing: SINE_EASING,
  },
  default: {
    step1Ms: 500,
    step2Ms: 750,
    step3Ms: 950,
    easing: CUBIC_OUT_EASING,
  },
};

export const STEP_DURATION_1_MS = SECTION_TIMINGS.default.step1Ms;
export const STEP_DURATION_2_MS = SECTION_TIMINGS.default.step2Ms;
export const STEP_DURATION_3_MS = SECTION_TIMINGS.default.step3Ms;
export const HERO_STEP_DURATION_1_MS = SECTION_TIMINGS.hero.step1Ms;
export const HERO_STEP_DURATION_2_MS = SECTION_TIMINGS.hero.step2Ms;
export const HERO_STEP_DURATION_3_MS = SECTION_TIMINGS.hero.step3Ms;
export const STEP_TAIL_MS = 70;
export const GESTURE_QUIET_MS = 70;
export const STEP_EASING = CUBIC_OUT_EASING;
export const HERO_STEP_EASING = SINE_EASING;

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
  const isTouchDevice =
    "ontouchstart" in window ||
    navigator.maxTouchPoints > 0 ||
    window.matchMedia("(pointer: coarse)").matches;

  return {
    isTouchDevice,
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
  const vh = window.innerHeight;
  return {
    touchLargeDistanceThreshold: Math.max(520, Math.round(vh * 0.55)),
    touchFastVelocityThreshold: 3.5,
    touchFastMinDistance: Math.max(440, Math.round(vh * 0.45)),
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

export function getStepDuration(steps: number, isHero = false): number {
  return getSectionStepTiming(isHero ? "hero" : "default", steps).durationMs;
}

export function isWithinQuietPeriod(
  now: number,
  lastStepTime: number,
  isGated: boolean
): boolean {
  return !isGated && lastStepTime > 0 && now - lastStepTime < GESTURE_QUIET_MS;
}
