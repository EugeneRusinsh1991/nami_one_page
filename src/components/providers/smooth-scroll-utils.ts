export const STEP_DURATION_1_MS = 500;
export const STEP_DURATION_2_MS = 750;
export const STEP_DURATION_3_MS = 950;
export const STEP_TAIL_MS = 70;
export const GESTURE_QUIET_MS = 70;
export const STEP_EASING = (t: number) => 1 - Math.pow(1 - t, 3);

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
  accumY: number
): number {
  if (!isTouch) {
    return target;
  }
  const touchDir = Math.sign(target - current) || Math.sign(accumY);
  return current + touchDir * Math.max(Math.abs(target - current), 100);
}

export function getStepDuration(steps: number): number {
  if (steps >= 3) return STEP_DURATION_3_MS;
  if (steps === 2) return STEP_DURATION_2_MS;
  return STEP_DURATION_1_MS;
}

export function isWithinQuietPeriod(
  now: number,
  lastStepTime: number,
  isGated: boolean
): boolean {
  return !isGated && lastStepTime > 0 && now - lastStepTime < GESTURE_QUIET_MS;
}
