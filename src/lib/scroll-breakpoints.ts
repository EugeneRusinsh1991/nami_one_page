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

let cachedZones: ScrollZone[] | null = null;
const sectionTopCache = new Map<string, number>();

export function invalidateScrollZonesCache(): void {
  cachedZones = null;
  sectionTopCache.clear();
}

let resizeTimer: ReturnType<typeof setTimeout> | null = null;
let orientationTimer: ReturnType<typeof setTimeout> | null = null;

export function handleViewportChange(): void {
  invalidateScrollZonesCache();

  if (resizeTimer) clearTimeout(resizeTimer);
  if (orientationTimer) clearTimeout(orientationTimer);

  if (typeof requestAnimationFrame !== "undefined") {
    requestAnimationFrame(() => {
      invalidateScrollZonesCache();
    });
  }

  resizeTimer = setTimeout(() => {
    invalidateScrollZonesCache();
    ScrollTrigger.refresh();
  }, 150);

  orientationTimer = setTimeout(() => {
    invalidateScrollZonesCache();
    ScrollTrigger.refresh();
  }, 350);
}

if (typeof window !== "undefined") {
  ScrollTrigger.addEventListener("refresh", invalidateScrollZonesCache);
  window.addEventListener("resize", handleViewportChange, { passive: true });
  window.addEventListener("orientationchange", handleViewportChange, { passive: true });
  if (window.visualViewport) {
    window.visualViewport.addEventListener("resize", handleViewportChange, { passive: true });
  }
}

export function getSectionTop(id: string, forceRefresh = false): number | null {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return null;
  }

  if (!forceRefresh && sectionTopCache.has(id)) {
    return sectionTopCache.get(id)!;
  }

  const el = document.getElementById(id);
  if (!el) return null;

  const triggers = ScrollTrigger.getAll();
  const st = triggers.find((s) => s.trigger === el || s.pin === el);

  if (st && st.pin && typeof st.start === "number" && Number.isFinite(st.start) && st.end > st.start) {
    const top = Math.round(st.start);
    sectionTopCache.set(id, top);
    return top;
  }

  let targetEl: HTMLElement = el;
  const spacer = (st as { spacer?: Element | null } | undefined)?.spacer;
  if (spacer instanceof HTMLElement) {
    targetEl = spacer;
  } else if (el.parentElement?.classList.contains("pin-spacer")) {
    targetEl = el.parentElement as HTMLElement;
  } else {
    const pinSpacer = el.closest(".pin-spacer") as HTMLElement | null;
    if (pinSpacer) {
      targetEl = pinSpacer;
    }
  }

  const scrollY = window.scrollY || window.pageYOffset || 0;
  const top = Math.round(targetEl.getBoundingClientRect().top + scrollY);
  sectionTopCache.set(id, top);
  return top;
}

function getPhilosophyEntry(): number | null {
  return getSectionTop("philosophy");
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
  const heroEnd = pins.hero?.end ?? (getSectionTop("hero") ?? 0);
  const philoEntry = getPhilosophyEntry();
  const techStart = pins.technique?.start ?? getSectionTop("technique");
  const techEnd = pins.technique?.end ?? techStart;
  const worksTop = getSectionTop("works");
  const handoffs: Array<[number | null | undefined, number | null | undefined]> = [
    [heroEnd, philoEntry],
    [philoEntry, techStart],
    [techEnd, worksTop],
  ];
  const zones: ScrollZone[] = handoffs
    .filter((h): h is [number, number] => h[0] != null && h[1] != null && h[1] - h[0] > MERGE_DISTANCE)
    .map(([from, to]) => ({ points: [from, to] }));

  const bottomPoints = dedupe([
    ...(worksTop != null ? [worksTop] : []),
    ...getMasterPoints(),
    ...getBottomSectionPoints(),
  ]);

  if (bottomPoints.length > 0) {
    zones.push({ points: bottomPoints });
  }

  return zones;
}

export function getScrollZones(forceRefresh = false): ScrollZone[] {
  if (forceRefresh) {
    invalidateScrollZonesCache();
  } else if (cachedZones !== null && cachedZones.length > 0) {
    return cachedZones;
  }

  const zones: ScrollZone[] = [];
  const pins: Record<string, { start: number; end: number }> = {};
  ScrollTrigger.getAll().forEach((st) => {
    const triggerEl = st.trigger as HTMLElement | null;
    const pinEl = st.pin as HTMLElement | null;
    const id = triggerEl?.id || pinEl?.id;
    if (!st.pin || !id || st.end <= st.start) return;
    const start = Math.round(st.start);
    const end = Math.round(st.end);
    pins[id] = { start, end };
    if (id === "hero") {
      zones.push({ points: dedupe([0, start, Math.round((start + end) / 2), end]) });
    } else if (id === "technique") {
      const step1 = Math.round(start + (end - start) / 3);
      const step2 = Math.round(start + ((end - start) * 2) / 3);
      zones.push({ points: dedupe([start, step1, step2, end]) });
    }
  });

  if (!pins.hero) {
    const heroTop = getSectionTop("hero") ?? 0;
    zones.push({ points: [heroTop] });
  }
  if (!pins.technique) {
    const techTop = getSectionTop("technique");
    if (techTop != null) {
      zones.push({ points: [techTop] });
    }
  }

  zones.push(...getHandoffZones(pins));
  const finalZones = zones.filter((z) => z.points.length > 0);
  if (finalZones.length > 0) {
    cachedZones = finalZones;
  }
  return finalZones;
}

function resolveDown(current: number, target: number, zones: ScrollZone[], stepCount = 1): ResolvedTarget {
  const allPoints = dedupe(zones.flatMap((z) => z.points));
  const allForwardPoints = allPoints.filter((p) => p > current + TOLERANCE);
  if (allForwardPoints.length > 0) {
    const normalizedStep = Math.max(1, stepCount);
    const targetIdx = Math.min(normalizedStep - 1, allForwardPoints.length - 1);
    const chosen = allForwardPoints[targetIdx];
    return { target: chosen, discrete: true };
  }
  if (allPoints.length > 0) {
    return { target: allPoints[allPoints.length - 1], discrete: true };
  }
  return { target, discrete: false };
}

function resolveUp(current: number, target: number, zones: ScrollZone[], stepCount = 1): ResolvedTarget {
  const allPoints = dedupe(zones.flatMap((z) => z.points));
  const allBackwardPoints = allPoints.filter((p) => p < current - TOLERANCE).sort((a, b) => b - a);
  if (allBackwardPoints.length > 0) {
    const normalizedStep = Math.max(1, stepCount);
    const targetIdx = Math.min(normalizedStep - 1, allBackwardPoints.length - 1);
    const chosen = allBackwardPoints[targetIdx];
    return { target: chosen, discrete: true };
  }
  if (allPoints.length > 0) {
    return { target: allPoints[0], discrete: true };
  }
  return { target, discrete: false };
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

