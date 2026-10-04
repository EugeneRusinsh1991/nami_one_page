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
  const philo = document.getElementById("philosophy");
  if (!philo) return null;
  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
  if (isMobile) {
    return Math.round(philo.getBoundingClientRect().top + window.scrollY);
  }
  const head = philo.querySelector<HTMLElement>(".philo-head");
  if (!head) return Math.round(philo.getBoundingClientRect().top + window.scrollY);
  return Math.round(head.getBoundingClientRect().top + window.scrollY - PHILO_HEAD_OFFSET);
}

function getSectionTop(id: string): number | null {
  const el = document.getElementById(id);
  return el ? Math.round(el.getBoundingClientRect().top + window.scrollY) : null;
}

export function getMasterPoints(): number[] {
  const master1 = getSectionTop("master-1") ?? getSectionTop("master");
  const master2 = getSectionTop("master-2");
  const points: number[] = [];
  if (master1 != null) points.push(master1);
  if (master2 != null) points.push(master2);
  return points;
}

export function getBottomSectionPoints(): number[] {
  const faq = getSectionTop("faq");
  const booking = getSectionTop("booking");
  const points: number[] = [];
  if (faq != null) points.push(faq);
  if (booking != null) points.push(booking);
  return points;
}

function getHandoffZones(pins: Record<string, { start: number; end: number }>): ScrollZone[] {
  const { hero, technique } = pins;
  const philoEntry = getPhilosophyEntry();
  const worksTop = getSectionTop("works");
  const handoffs: Array<[number | null | undefined, number | null | undefined]> = [
    [hero?.end, philoEntry],
    [philoEntry, technique?.start],
    [technique?.end, worksTop],
  ];
  const zones: ScrollZone[] = handoffs
    .filter((h): h is [number, number] => h[0] != null && h[1] != null && h[1] - h[0] > MERGE_DISTANCE)
    .map(([from, to]) => ({ points: [from, to] }));

  const bottomPoints = dedupe([
    ...(worksTop != null ? [worksTop] : []),
    ...getMasterPoints(),
    ...getBottomSectionPoints(),
  ]);

  if (bottomPoints.length > 1) {
    zones.push({ points: bottomPoints });
  }

  return zones;
}

let cachedZones: ScrollZone[] | null = null;

export function invalidateScrollZonesCache(): void {
  cachedZones = null;
}

if (typeof window !== "undefined") {
  ScrollTrigger.addEventListener("refresh", invalidateScrollZonesCache);
  window.addEventListener("resize", invalidateScrollZonesCache, { passive: true });
}

export function getScrollZones(forceRefresh = false): ScrollZone[] {
  if (!forceRefresh && cachedZones !== null && cachedZones.length > 0) {
    return cachedZones;
  }

  const zones: ScrollZone[] = [];
  const pins: Record<string, { start: number; end: number }> = {};
  ScrollTrigger.getAll().forEach((st) => {
    const el = st.trigger as HTMLElement | null;
    if (!st.pin || !el || st.end <= st.start) return;
    const start = Math.round(st.start);
    const end = Math.round(st.end);
    pins[el.id] = { start, end };
    if (el.id === "hero") {
      zones.push({ points: dedupe([start, Math.round((start + end) / 2), end]) });
    } else if (el.id === "technique") {
      const step1 = Math.round(start + (end - start) / 3);
      const step2 = Math.round(start + ((end - start) * 2) / 3);
      zones.push({ points: dedupe([start, step1, step2, end]) });
    }
  });
  zones.push(...getHandoffZones(pins));
  const finalZones = zones.filter((z) => z.points.length > 1);
  cachedZones = finalZones;
  return finalZones;
}

function resolveDown(current: number, target: number, zones: ScrollZone[], stepCount = 1): ResolvedTarget {
  const allForwardPoints = dedupe(zones.flatMap((z) => z.points)).filter((p) => p > current + TOLERANCE);
  if (allForwardPoints.length > 0) {
    const targetIdx = Math.min(stepCount - 1, allForwardPoints.length - 1);
    const chosen = allForwardPoints[targetIdx];
    return { target: chosen, discrete: true };
  }
  const bounds = zones.flatMap((z) => [z.points[0], z.points[z.points.length - 1]]);
  const nextBound = bounds.filter((b) => b > current + TOLERANCE).sort((a, b) => a - b)[0];
  return { target: nextBound !== undefined && target > nextBound ? nextBound : target, discrete: false };
}

function resolveUp(current: number, target: number, zones: ScrollZone[], stepCount = 1): ResolvedTarget {
  const allBackwardPoints = dedupe(zones.flatMap((z) => z.points)).filter((p) => p < current - TOLERANCE).sort((a, b) => b - a);
  if (allBackwardPoints.length > 0) {
    const targetIdx = Math.min(stepCount - 1, allBackwardPoints.length - 1);
    const chosen = allBackwardPoints[targetIdx];
    return { target: chosen, discrete: true };
  }
  const bounds = zones.flatMap((z) => [z.points[0], z.points[z.points.length - 1]]);
  const prevBound = bounds.filter((b) => b < current - TOLERANCE).sort((a, b) => b - a)[0];
  return { target: prevBound !== undefined && target < prevBound ? prevBound : target, discrete: false };
}

export function resolveScrollTarget(
  current: number,
  target: number,
  zones: ScrollZone[],
  lockedDirection?: "down" | "up" | null,
  stepCount = 1
): ResolvedTarget {
  const delta = target - current;
  if (Math.abs(delta) < 20) {
    return { target: current, discrete: false };
  }

  // Suppress contrary micro-deltas during an active directional gesture
  if (lockedDirection === "down" && delta < 0 && Math.abs(delta) < 30) {
    return { target: current, discrete: false };
  }
  if (lockedDirection === "up" && delta > 0 && Math.abs(delta) < 30) {
    return { target: current, discrete: false };
  }

  if (delta > 0) return resolveDown(current, target, zones, stepCount);
  if (delta < 0) return resolveUp(current, target, zones, stepCount);
  return { target, discrete: false };
}

