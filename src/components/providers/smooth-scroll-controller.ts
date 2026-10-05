import Lenis from "lenis";
import { getScrollZones, resolveScrollTarget, resolveActiveSection } from "@/lib/scroll-breakpoints";
import {
  STEP_TAIL_MS,
  shouldBypassDiscreteScroll,
  calculateRawScrollTarget,
  getSectionStepTiming,
  isWithinQuietPeriod,
} from "./smooth-scroll-utils";
import {
  INTENT_LOCK_THRESHOLD,
  INTENT_RATIO,
  GESTURE_RESET_TIMEOUT_MS,
  TouchTrackerState,
  ScrollGateState,
  shouldAllowScrollEvent,
  resolveGestureStepCount,
} from "./smooth-scroll-gestures";

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
    });
  };
}
