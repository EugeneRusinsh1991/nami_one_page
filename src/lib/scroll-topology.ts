import { ScrollTrigger } from "@/lib/gsap";
import { dedupe, MERGE_DISTANCE, TOLERANCE, type ResolvedTarget, resolveTargetFromPoints } from "./scroll-quantization";

export type ScrollSectionId = "hero" | "technique" | "default";

export interface ScrollZone {
  points: number[];
}

export const TECHNIQUE_STEP_POINTS = [0, 1 / 3, 2 / 3, 1] as const;

export function getActiveScreenHeight(): number {
  if (typeof window === "undefined" || typeof document === "undefined") return 800;
  const rootH = parseFloat(document.documentElement.style.getPropertyValue("--app-screen-h"));
  if (Number.isFinite(rootH) && rootH > 0) return rootH;
  const isTouch = window.matchMedia("(pointer: coarse)").matches || /iPhone|iPad|Android/i.test(navigator.userAgent);
  return (isTouch && window.screen?.height) ? window.screen.height : window.innerHeight;
}

let cachedZones: ScrollZone[] | null = null;
let cachedAllPoints: number[] | null = null;
const sectionTopCache = new Map<string, number>();

export function invalidateScrollZonesCache(): void {
  cachedZones = null;
  cachedAllPoints = null;
  sectionTopCache.clear();
}

type InvalidationCallback = () => void;
const invalidationListeners = new Set<InvalidationCallback>();

export function addInvalidationListener(cb: InvalidationCallback): () => void {
  invalidationListeners.add(cb);
  return () => {
    invalidationListeners.delete(cb);
  };
}

export function notifyInvalidation(): void {
  invalidationListeners.forEach((cb) => {
    try {
      cb();
    } catch {
      // Ignore listener error to protect execution loop
    }
  });
}

let resizeTimer: ReturnType<typeof setTimeout> | null = null;
let orientationTimer: ReturnType<typeof setTimeout> | null = null;
let lastWindowWidth = typeof window !== "undefined" ? window.innerWidth : 0;
let lastWindowHeight = typeof window !== "undefined" ? window.innerHeight : 0;

export function handleViewportChange(force = false): void {
  if (typeof window === "undefined") return;

  const currentWidth = window.innerWidth;
  const currentHeight = window.innerHeight;
  if (!force && currentWidth === lastWindowWidth && Math.abs(currentHeight - lastWindowHeight) <= 60 && lastWindowWidth !== 0) {
    return;
  }
  lastWindowWidth = currentWidth;
  lastWindowHeight = currentHeight;

  notifyInvalidation();

  if (resizeTimer) clearTimeout(resizeTimer);
  if (orientationTimer) clearTimeout(orientationTimer);

  resizeTimer = setTimeout(() => {
    notifyInvalidation();
    ScrollTrigger.refresh();
  }, 150);

  orientationTimer = setTimeout(() => {
    notifyInvalidation();
    ScrollTrigger.refresh();
  }, 350);
}

let isObserverInitialized = false;

export function initViewportObserver(): void {
  if (isObserverInitialized || typeof window === "undefined") return;
  isObserverInitialized = true;

  ScrollTrigger.addEventListener("refresh", notifyInvalidation);
  window.addEventListener("resize", () => handleViewportChange(false), { passive: true });
  window.addEventListener("orientationchange", () => handleViewportChange(true), { passive: true });

  if (window.visualViewport) {
    let lastVvWidth = window.visualViewport.width;
    let lastVvHeight = window.visualViewport.height;
    window.visualViewport.addEventListener(
      "resize",
      () => {
        const currentVvWidth = window.visualViewport?.width ?? 0;
        const currentVvHeight = window.visualViewport?.height ?? 0;
        const widthDelta = Math.abs(currentVvWidth - lastVvWidth);
        const heightDelta = Math.abs(currentVvHeight - lastVvHeight);
        if (widthDelta > 1 || heightDelta > 60) {
          lastVvWidth = currentVvWidth;
          lastVvHeight = currentVvHeight;
          handleViewportChange(true);
        }
      },
      { passive: true }
    );
  }
}

if (typeof window !== "undefined") {
  addInvalidationListener(invalidateScrollZonesCache);
  initViewportObserver();
}

const STORY_SECTION_IDS = new Set<string>(["hero", "technique"]);

function getStoryTriggerId(st: ScrollTrigger): "hero" | "technique" | null {
  if (st.vars?.id && st.vars.id !== "story-frame-scrub") {
    return null;
  }
  if (st.vars?.start && st.vars.start !== "top top") {
    return null;
  }
  const triggerEl = st.trigger as HTMLElement | null;
  const pinEl = st.pin as HTMLElement | null;
  const id = triggerEl?.id || pinEl?.id;
  if (id && STORY_SECTION_IDS.has(id) && st.end > st.start) {
    return id as "hero" | "technique";
  }
  return null;
}

export function resolveActiveSection(current: number, target: number): ScrollSectionId {
  if (typeof window === "undefined") return "default";
  const triggers = ScrollTrigger.getAll();
  for (const st of triggers) {
    const id = getStoryTriggerId(st);
    if (!id) continue;

    const start = Math.round(st.start);
    const end = Math.round(st.end);
    if (
      current >= start - TOLERANCE &&
      current <= end + TOLERANCE &&
      target >= start - TOLERANCE &&
      target <= end + TOLERANCE
    ) {
      return id;
    }
  }
  return "default";
}

export function isHeroTransition(current: number, target: number): boolean {
  return resolveActiveSection(current, target) === "hero";
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
  const st = triggers.find(
    (s) => (s.trigger === el || s.pin === el) && Boolean(s.pin || getStoryTriggerId(s) !== null)
  );

  if (st && typeof st.start === "number" && Number.isFinite(st.start) && st.end > st.start) {
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

export function getPhilosophyEntry(): number | null {
  return getSectionTop("philosophy");
}

export function getMasterPoints(): number[] {
  const master = getSectionTop("master") ?? getSectionTop("master-1");
  const studio = getSectionTop("studio") ?? getSectionTop("master-2");
  const academy = getSectionTop("academy");
  const points: number[] = [];
  if (master != null) points.push(master);
  if (studio != null) points.push(studio);
  if (academy != null) points.push(academy);
  return points;
}

export function getBottomSectionPoints(): number[] {
  const faq = getSectionTop("faq") ?? getSectionTop("guide-faq");
  const booking = getSectionTop("booking");
  const points: number[] = [];
  if (faq != null) points.push(faq);
  if (booking != null) points.push(booking);
  return points;
}

export function getHandoffZones(pins: Record<string, { start: number; end: number }>): ScrollZone[] {
  const heroEnd =
    pins.hero?.end ??
    (getSectionTop("hero") ??
      getSectionTop("client-guide-hero") ??
      getSectionTop("guide-hero") ??
      0);
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
    const id = getStoryTriggerId(st);
    if (!id) return;
    const start = Math.round(st.start);
    const end = Math.round(st.end);
    pins[id] = { start, end };
    const H = getActiveScreenHeight();
    if (id === "hero") {
      zones.push({ points: dedupe([0, start, start + H, start + 2 * H]) });
    } else if (id === "technique") {
      zones.push({ points: dedupe([start, start + H, start + 2 * H, start + 3 * H]) });
    }
  });

  if (!pins.hero) {
    const heroTop =
      getSectionTop("hero") ??
      getSectionTop("client-guide-hero") ??
      getSectionTop("guide-hero") ??
      0;
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
    cachedAllPoints = dedupe(finalZones.flatMap((z) => z.points));
  }
  return finalZones;
}

export function getAllScrollPoints(zones?: ScrollZone[]): number[] {
  if (cachedAllPoints !== null && cachedAllPoints.length > 0) {
    return cachedAllPoints;
  }
  const resolvedZones = zones ?? getScrollZones();
  if (cachedAllPoints !== null && cachedAllPoints.length > 0) {
    return cachedAllPoints;
  }
  const points = dedupe(resolvedZones.flatMap((z) => z.points));
  cachedAllPoints = points;
  return points;
}

export function resolveScrollTarget(
  current: number,
  target: number,
  zones?: ScrollZone[],
  lockedDirection?: "down" | "up" | null,
  stepCount = 1
): ResolvedTarget {
  const allPoints = getAllScrollPoints(zones);
  return resolveTargetFromPoints(current, target, allPoints, lockedDirection, stepCount);
}

export type { ResolvedTarget };
