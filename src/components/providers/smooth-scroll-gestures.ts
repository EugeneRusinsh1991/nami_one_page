import { calculateStepCount, STEP_TAIL_MS } from "./smooth-scroll-controller";

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
  lockedVerticalDirection: "down" | "up" | null;
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

  const dy = state.accumY !== 0 ? state.accumY : state.startY - state.lastY;
  const absDy = Math.max(Math.abs(dy), state.maxDisplacement);

  if (absDy < minThreshold) {
    return { shouldTriggerStep: false, direction: null, stepCount: 0 };
  }

  const direction: "down" | "up" = state.lockedVerticalDirection ?? (dy > 0 ? "down" : "up");
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
    lockedVerticalDirection: null,
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

export function attachTouchGestureTracker(
  gesture: TouchTrackerState,
  gate: ScrollGateState
): { cleanup: () => void; scheduleReset: () => void } {
  const resetGesture = () => {
    gesture.isTouch = false;
    gesture.touchActive = false;
    gesture.stepsCommitted = 0;
    gesture.lockedDirection = null;
    gesture.lockedVerticalDirection = null;
    gesture.accumX = 0;
    gesture.accumY = 0;
    gesture.peakVelocity = 0;
    gesture.maxDisplacement = 0;
    if (performance.now() >= gate.gateUntil) {
      gate.activeDirection = null;
      gate.gateUntil = 0;
    }
  };

  const scheduleReset = () => {
    if (gesture.resetTimer) clearTimeout(gesture.resetTimer);
    gesture.resetTimer = setTimeout(() => {
      if (!gesture.touchActive) resetGesture();
    }, GESTURE_RESET_TIMEOUT_MS);
  };

  const onTouchStart = (e: TouchEvent) => {
    const touch = e.touches[0];
    if (!touch) return;
    const now = performance.now();
    gesture.isTouch = true;
    gesture.touchActive = true;
    gesture.stepsCommitted = 0;
    gesture.lockedDirection = null;
    gesture.lockedVerticalDirection = null;
    gesture.accumX = 0;
    gesture.accumY = 0;
    gesture.startX = touch.clientX;
    gesture.startY = touch.clientY;
    gesture.startTime = now;
    gesture.lastY = touch.clientY;
    gesture.lastTime = now;
    gesture.peakVelocity = 0;
    gesture.maxDisplacement = 0;
    if (now >= gate.gateUntil - STEP_TAIL_MS) {
      gate.activeDirection = null;
      gate.gateUntil = 0;
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

    if (gesture.lockedVerticalDirection === null) {
      const dy = touch.clientY - gesture.startY;
      if (Math.abs(dy) >= INTENT_LOCK_THRESHOLD) {
        // Swipe up (touch.clientY < startY) moves page down
        gesture.lockedVerticalDirection = dy < 0 ? "down" : "up";
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
    if (gate.gateUntil > 0) {
      gate.gateUntil = Math.max(gate.gateUntil, performance.now() + 60);
    }
    scheduleReset();
  };

  window.addEventListener("touchstart", onTouchStart, { passive: true });
  window.addEventListener("touchmove", onTouchMove, { passive: true });
  window.addEventListener("touchend", onTouchEnd, { passive: true });
  window.addEventListener("touchcancel", resetGesture, { passive: true });

  const cleanup = () => {
    window.removeEventListener("touchstart", onTouchStart);
    window.removeEventListener("touchmove", onTouchMove);
    window.removeEventListener("touchend", onTouchEnd);
    window.removeEventListener("touchcancel", resetGesture);
    if (gesture.resetTimer) clearTimeout(gesture.resetTimer);
  };

  return { cleanup, scheduleReset };
}
