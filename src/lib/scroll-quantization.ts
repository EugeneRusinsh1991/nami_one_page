export interface ResolvedTarget {
  target: number;
  discrete: boolean;
}

export const TOLERANCE = 25;
export const MERGE_DISTANCE = 40;

export function dedupe(points: number[]): number[] {
  const sorted = points.filter(Number.isFinite).sort((a, b) => a - b);
  const merged: number[] = [];
  sorted.forEach((p) => {
    if (merged.length === 0 || p - merged[merged.length - 1] > MERGE_DISTANCE) merged.push(p);
  });
  return merged;
}

export function resolveDown(
  current: number,
  target: number,
  allPoints: number[],
  stepCount = 1
): ResolvedTarget {
  const allForwardPoints = allPoints.filter((p) => p > current + TOLERANCE);
  if (allForwardPoints.length > 0) {
    const normalizedStep = Math.max(1, stepCount);
    const targetIdx = Math.min(normalizedStep - 1, allForwardPoints.length - 1);
    const chosen = allForwardPoints[targetIdx];
    return { target: chosen, discrete: true };
  }
  return { target, discrete: false };
}

export function resolveUp(
  current: number,
  target: number,
  allPoints: number[],
  stepCount = 1
): ResolvedTarget {
  const allBackwardPoints = allPoints.filter((p) => p < current - TOLERANCE).sort((a, b) => b - a);
  if (allBackwardPoints.length > 0) {
    const normalizedStep = Math.max(1, stepCount);
    const targetIdx = Math.min(normalizedStep - 1, allBackwardPoints.length - 1);
    const chosen = allBackwardPoints[targetIdx];
    return { target: chosen, discrete: true };
  }
  return { target, discrete: false };
}

export function resolveTargetFromPoints(
  current: number,
  target: number,
  allPoints: number[],
  lockedDirection?: "down" | "up" | null,
  stepCount = 1
): ResolvedTarget {
  const delta = target - current;
  if (Math.abs(delta) < 20) {
    return { target: current, discrete: false };
  }

  // Suppress contrary deltas during an active directional gesture
  if (lockedDirection === "down" && delta < 0) {
    return { target: current, discrete: false };
  }
  if (lockedDirection === "up" && delta > 0) {
    return { target: current, discrete: false };
  }

  if (delta > 0) return resolveDown(current, target, allPoints, stepCount);
  if (delta < 0) return resolveUp(current, target, allPoints, stepCount);
  return { target, discrete: false };
}
