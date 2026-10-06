export interface SlideRange {
  enterStart: number;
  enterEnd: number;
  exitStart: number;
  exitEnd: number;
}

export interface SlideTransformState {
  opacity: number;
  yPercent: number;
  scale: number;
  pointerEvents: "auto" | "none";
}

export const HERO_SLIDE_RANGES: readonly SlideRange[] = [
  { enterStart: -1, enterEnd: -1, exitStart: 0.15, exitEnd: 0.45 },
  { enterStart: 0.35, enterEnd: 0.50, exitStart: 0.55, exitEnd: 0.85 },
  { enterStart: 0.75, enterEnd: 0.95, exitStart: 1.05, exitEnd: 1.05 },
] as const;

export const ACCENT_CLASS =
  " font-[family-name:var(--font-serif-accent)] font-semibold italic tracking-normal text-[1.16em] leading-[0.9]";

/** Hermite interpolation clamped to [0, 1] */
export function smoothstep(min: number, max: number, value: number): number {
  const x = Math.max(0, Math.min(1, (value - min) / (max - min)));
  return x * x * (3 - 2 * x);
}

/** Calculates opacity, yPercent, scale, and pointerEvents for a slide at progress p */
export function calculateSlideTransform(progress: number, range: SlideRange): SlideTransformState {
  const { enterStart, enterEnd, exitStart, exitEnd } = range;
  const Y_OFFSET = 12;

  if (enterStart >= 0 && progress < enterStart) {
    return { opacity: 0, yPercent: Y_OFFSET, scale: 0.96, pointerEvents: "none" };
  }

  if (enterStart >= 0 && progress <= enterEnd) {
    const step = smoothstep(enterStart, enterEnd, progress);
    return {
      opacity: step,
      yPercent: (1 - step) * Y_OFFSET,
      scale: 0.96 + 0.04 * step,
      pointerEvents: step > 0.5 ? "auto" : "none",
    };
  }

  if (exitStart > 1.0 || progress < exitStart) {
    return { opacity: 1, yPercent: 0, scale: 1, pointerEvents: "auto" };
  }

  if (exitStart <= 1.0 && progress <= exitEnd) {
    const step = smoothstep(exitStart, exitEnd, progress);
    const opacity = 1 - step;
    return {
      opacity,
      yPercent: -step * Y_OFFSET,
      scale: 0.96 + 0.04 * opacity,
      pointerEvents: opacity > 0.1 ? "auto" : "none",
    };
  }

  return { opacity: 0, yPercent: -Y_OFFSET, scale: 0.96, pointerEvents: "none" };
}
