export const HERO_SLOT_COUNT = 3;
const FOCUS_HOLD = 0.15;
const FOCUS_FADE = 0.6;

export const ACCENT_CLASS =
  " font-[family-name:var(--font-serif-accent)] font-semibold italic tracking-normal text-[1.16em] leading-[0.9]";

/** Hermite interpolation clamped to [0, 1] */
export function smoothstep(min: number, max: number, value: number): number {
  if (max <= min) return 0;
  const x = Math.max(0, Math.min(1, (value - min) / (max - min)));
  return x * x * (3 - 2 * x);
}

export interface SlotFocusState {
  opacity: number;
  isActive: boolean;
  pointerEvents: "auto" | "none";
}

/** Focus fade for a physically scrolling slot: d = |progress·(count−1) − index| in screen units. */
export function calculateSlotFocus(index: number, count: number, progress: number): SlotFocusState {
  if (count <= 1) {
    return { opacity: 1, isActive: true, pointerEvents: "auto" };
  }

  const p = Math.max(0, Math.min(1, progress));
  const pos = p * (count - 1);
  const d = Math.abs(pos - index);
  const opacity = 1 - smoothstep(FOCUS_HOLD, FOCUS_FADE, d);
  const isActive = Math.round(pos) === index;
  const pointerEvents = opacity > 0.5 ? "auto" : "none";

  return { opacity, isActive, pointerEvents };
}
