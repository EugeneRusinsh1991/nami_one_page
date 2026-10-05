import { calculateStepCount } from "./smooth-scroll-utils";

export const INTENT_LOCK_THRESHOLD = 12;
export const INTENT_RATIO = 1.25;
export const INTENTIONAL_VERTICAL_THRESHOLD = 20;
export const GESTURE_RESET_TIMEOUT_MS = 100;

export interface ScrollEventEvaluationParams {
  target: HTMLElement | null;
  deltaX: number;
  deltaY: number;
  isWheel: boolean;
  lockedDirection: "horizontal" | "vertical" | null;
  accumX: number;
  accumY: number;
}

export function shouldAllowScrollEvent(params: ScrollEventEvaluationParams): boolean {
  const { target, deltaX, deltaY, isWheel, lockedDirection, accumX, accumY } = params;

  if (target?.closest?.("[data-lenis-prevent]")) {
    return false;
  }

  const isOverHorizontalContainer = Boolean(target?.closest?.("[data-lenis-prevent-horizontal]"));
  if (isOverHorizontalContainer) {
    // Wheel events with primary vertical intent must ALWAYS pass through to page scroll
    if (isWheel) {
      if (Math.abs(deltaY) >= Math.abs(deltaX)) {
        return true;
      }
      return false;
    }

    // Touch gesture logic: allow horizontal swipe within carousel; pass vertical gesture to Lenis
    if (lockedDirection === "horizontal") {
      return false;
    }
    if (lockedDirection === "vertical") {
      return true;
    }
    if (Math.abs(accumX) > Math.abs(accumY) && Math.abs(accumX) > 8) {
      return false;
    }
  }

  return lockedDirection !== "horizontal";
}

export interface TouchGestureState {
  startX: number;
  startY: number;
  startTime: number;
  lastY: number;
  lastTime: number;
  accumX: number;
  accumY: number;
  maxDisplacement: number;
  peakVelocity: number;
  lockedDirection: "horizontal" | "vertical" | null;
  touchActive: boolean;
  stepsCommitted: number;
}

export interface TouchTrackerState extends TouchGestureState {
  isTouch: boolean;
  resetTimer: ReturnType<typeof setTimeout> | null;
}

export interface TouchStepResolution {
  shouldTriggerStep: boolean;
  direction: "down" | "up" | null;
  stepCount: number;
}

export interface ScrollGateState {
  gateUntil: number;
  activeDirection: "down" | "up" | null;
}

export function evaluateTouchStep(
  state: TouchGestureState,
  minThreshold = 40
): TouchStepResolution {
  if (state.lockedDirection !== "vertical") {
    return { shouldTriggerStep: false, direction: null, stepCount: 0 };
  }

  const dy = -state.accumY; // Swipe up moves page down
  const absDy = Math.max(Math.abs(dy), state.maxDisplacement);

  if (absDy < minThreshold) {
    return { shouldTriggerStep: false, direction: null, stepCount: 0 };
  }

  const direction: "down" | "up" = dy > 0 ? "down" : "up";
  const stepCount = state.peakVelocity > 2.0 || absDy > 350 ? 2 : 1;

  return {
    shouldTriggerStep: true,
    direction,
    stepCount,
  };
}

export function resolveGestureStepCount(
  gesture: TouchGestureState & { isTouch: boolean }
): number | null {
  if (!gesture.isTouch) {
    return calculateStepCount(Math.abs(gesture.accumY), 0, false);
  }
  if (gesture.stepsCommitted > 0) {
    return null;
  }
  if (!evaluateTouchStep(gesture).shouldTriggerStep) {
    return null;
  }
  return 1;
}

export function createTouchGestureState(): TouchTrackerState {
  return {
    isTouch: false,
    touchActive: false,
    stepsCommitted: 0,
    lockedDirection: null,
    accumX: 0,
    accumY: 0,
    startX: 0,
    startY: 0,
    startTime: 0,
    lastY: 0,
    lastTime: 0,
    peakVelocity: 0,
    maxDisplacement: 0,
    resetTimer: null,
  };
}
