import { TECHNIQUE_STEP_POINTS } from "@/lib/scroll-topology";

export const STEP_COUNT = TECHNIQUE_STEP_POINTS.length;
export const COLOR_ACTIVE = "#1A1F25";
export const COLOR_INACTIVE = "#D5DAE0";

export function smoothstep(min: number, max: number, value: number): number {
  if (max <= min) return 0;
  const x = Math.max(0, Math.min(1, (value - min) / (max - min)));
  return x * x * (3 - 2 * x);
}

export interface StepTransformState {
  opacity: number;
  y: number;
  isActive: boolean;
}

export function calculateStepTransformState(
  stepIndex: number,
  totalSteps: number,
  progress: number,
  stepPoints: readonly number[] = TECHNIQUE_STEP_POINTS
): StepTransformState {
  if (totalSteps <= 1) {
    return { opacity: 1, y: 0, isActive: true };
  }

  const p = Math.max(0, Math.min(1, progress));
  const isFirst = stepIndex === 0;
  const isLast = stepIndex === totalSteps - 1;

  let currentStep = 0;
  let minDistance = Infinity;
  for (let i = 0; i < totalSteps; i++) {
    const pt = stepPoints[i] ?? i / (totalSteps - 1);
    const dist = Math.abs(p - pt);
    if (dist < minDistance) {
      minDistance = dist;
      currentStep = i;
    }
  }
  const isActive = stepIndex === currentStep;

  const currentPt = stepPoints[stepIndex] ?? stepIndex / (totalSteps - 1);
  const prevPt = isFirst ? 0 : (stepPoints[stepIndex - 1] ?? (stepIndex - 1) / (totalSteps - 1));
  const nextPt = isLast ? 1 : (stepPoints[stepIndex + 1] ?? (stepIndex + 1) / (totalSteps - 1));

  const prevSpan = currentPt - prevPt;
  const nextSpan = nextPt - currentPt;

  // Staggered card transition: exit earlier, pause, then enter next card without overlap
  const enterStart = isFirst ? -1 : prevPt + prevSpan * 0.55;
  const enterEnd = isFirst ? -1 : prevPt + prevSpan * 0.86;

  const exitStart = isLast ? 2 : currentPt + nextSpan * 0.16;
  const exitEnd = isLast ? 2 : currentPt + nextSpan * 0.45;

  const Y_OFFSET = 20;

  if (!isFirst && p < enterStart) {
    return { opacity: 0, y: Y_OFFSET, isActive };
  }

  if (!isFirst && p <= enterEnd) {
    const t = smoothstep(enterStart, enterEnd, p);
    return {
      opacity: t,
      y: (1 - t) * Y_OFFSET,
      isActive,
    };
  }

  if (p < exitStart) {
    return { opacity: 1, y: 0, isActive };
  }

  if (!isLast && p <= exitEnd) {
    const t = smoothstep(exitStart, exitEnd, p);
    return {
      opacity: 1 - t,
      y: -t * Y_OFFSET,
      isActive,
    };
  }

  return { opacity: 0, y: -Y_OFFSET, isActive };
}
