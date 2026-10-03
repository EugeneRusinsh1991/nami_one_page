import { ScrollTrigger } from "@/lib/gsap";

export interface ScrollZone {
  points: number[];
}

export interface ResolvedTarget {
  target: number;
  discrete: boolean;
}

const TOLERANCE = 25;
const MERGE_DISTANCE = 40;

function dedupe(points: number[]): number[] {
  const sorted = points.filter(Number.isFinite).sort((a, b) => a - b);
  const merged: number[] = [];
  sorted.forEach((p) => {
    if (merged.length === 0 || p - merged[merged.length - 1] > MERGE_DISTANCE) merged.push(p);
  });
  return merged;
}

function getWorksPoints(trigger: HTMLElement, start: number): number[] {
  const track = trigger.querySelector<HTMLElement>("[class*='w-max']");
  const cards = trigger.querySelectorAll<HTMLElement>(".port-card");
  if (!track || cards.length === 0) return [start];
  const maxX = Math.max(0, track.scrollWidth - window.innerWidth);
  return Array.from(cards).map((card) => {
    const center = card.offsetLeft + card.offsetWidth / 2;
    return start + Math.max(0, Math.min(maxX, center - window.innerWidth / 2));
  });
}

const PHILO_HEAD_OFFSET = 96;

function getPhilosophyEntry(): number | null {
  const head = document.querySelector<HTMLElement>("#philosophy .philo-head");
  if (!head) return null;
  return Math.round(head.getBoundingClientRect().top + window.scrollY - PHILO_HEAD_OFFSET);
}

function getHandoffZones(pins: Record<string, { start: number; end: number }>): ScrollZone[] {
  const { hero, technique, works } = pins;
  const handoffs: Array<[number | undefined, number | null | undefined]> = [
    [hero?.end, getPhilosophyEntry()],
    [technique && technique.start - window.innerHeight, technique?.start],
    [technique?.end, works?.start],
  ];
  return handoffs
    .filter((h): h is [number, number] => h[0] != null && h[1] != null && h[1] - h[0] > MERGE_DISTANCE)
    .map(([from, to]) => ({ points: [from, to] }));
}

export function getScrollZones(): ScrollZone[] {
  const zones: ScrollZone[] = [];
  const pins: Record<string, { start: number; end: number }> = {};
  ScrollTrigger.getAll().forEach((st) => {
    const el = st.trigger as HTMLElement | null;
    if (!st.pin || !el || st.end <= st.start) return;
    const start = Math.round(st.start);
    const end = Math.round(st.end);
    pins[el.id] = { start, end };
    if (el.id === "hero" || el.id === "technique") {
      zones.push({ points: dedupe([start, Math.round((start + end) / 2), end]) });
    } else if (el.id === "works") {
      zones.push({ points: dedupe([...getWorksPoints(el, start).map(Math.round), end]) });
    }
  });
  zones.push(...getHandoffZones(pins));
  return zones.filter((z) => z.points.length > 1);
}

function resolveDown(current: number, target: number, zones: ScrollZone[]): ResolvedTarget {
  const inside = zones.find((z) => current >= z.points[0] - TOLERANCE && current < z.points[z.points.length - 1] - TOLERANCE);
  if (inside) {
    const next = inside.points.find((p) => p > current + TOLERANCE);
    if (next !== undefined) return { target: next, discrete: true };
  }
  const bounds = zones.flatMap((z) => [z.points[0], z.points[z.points.length - 1]]);
  const nextBound = bounds.filter((b) => b > current + TOLERANCE).sort((a, b) => a - b)[0];
  return { target: nextBound !== undefined && target > nextBound ? nextBound : target, discrete: false };
}

function resolveUp(current: number, target: number, zones: ScrollZone[]): ResolvedTarget {
  const inside = zones.find((z) => current > z.points[0] + TOLERANCE && current <= z.points[z.points.length - 1] + TOLERANCE);
  if (inside) {
    const prev = [...inside.points].reverse().find((p) => p < current - TOLERANCE);
    if (prev !== undefined) return { target: prev, discrete: true };
  }
  const bounds = zones.flatMap((z) => [z.points[0], z.points[z.points.length - 1]]);
  const prevBound = bounds.filter((b) => b < current - TOLERANCE).sort((a, b) => b - a)[0];
  return { target: prevBound !== undefined && target < prevBound ? prevBound : target, discrete: false };
}

export function resolveScrollTarget(current: number, target: number, zones: ScrollZone[]): ResolvedTarget {
  if (target > current) return resolveDown(current, target, zones);
  if (target < current) return resolveUp(current, target, zones);
  return { target, discrete: false };
}
