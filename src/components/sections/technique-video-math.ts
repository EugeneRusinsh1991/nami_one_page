import { TECHNIQUE_STEP_POINTS } from "@/lib/scroll-topology";
import { calculateSlotFocus } from "./hero-video-utils";

export const STEP_COUNT = TECHNIQUE_STEP_POINTS.length;
export const COLOR_ACTIVE = "#1A1F25";
export const COLOR_INACTIVE = "#D5DAE0";

export interface StepTransformState {
  opacity: number;
  isActive: boolean;
}

export function calculateStepTransformState(
  stepIndex: number,
  totalSteps: number,
  progress: number
): StepTransformState {
  const { opacity, isActive } = calculateSlotFocus(stepIndex, totalSteps, progress);
  return { opacity, isActive };
}

