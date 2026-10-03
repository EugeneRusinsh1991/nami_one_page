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

const PHILO_HEAD_OFFSET = 96;

function getPhilosophyEntry(): number | null {
  const head = document.querySelector<HTMLElement>("#philosophy .philo-head");
  if (!head) return null;
  return Math.round(head.getBoundingClientRect().top + window.scrollY - PHILO_HEAD_OFFSET);
}

function getSectionTop(id: string): number | null {
  const el = document.getElementById(id);
  return el ? Math.round(el.getBoundingClientRect().top + window.scrollY) : null;
}

function getHandoffZones(pins: Record<string, { start: number; end: number }>): ScrollZone[] {
  const { hero, technique } = pins;
  const worksTop = getSectionTop("works");
  const handoffs: Array<[number | undefined, number | null | undefined]> = [
    [hero?.end, getPhilosophyEntry()],
    [technique && technique.start - window.innerHeight, technique?.start],
    [technique?.end, worksTop],
    [worksTop, getSectionTop("master")],
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
