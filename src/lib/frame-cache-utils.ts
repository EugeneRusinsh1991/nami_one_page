export const KEY_STEP = 16;
export const CONCURRENCY = 4;
export const MAX_CACHED_FRAMES = 72;
export const WINDOW_RADIUS = 24;
export const TOUCH_MAX_CACHED_FRAMES = 48;
export const TOUCH_WINDOW_RADIUS = 16;

export const isLowMemoryDevice = (): boolean => {
  if (typeof window === "undefined" || typeof navigator === "undefined") return false;
  const nav = navigator as Navigator & { deviceMemory?: number };
  if (typeof nav.deviceMemory === "number" && nav.deviceMemory < 4) return true;
  if (typeof navigator.hardwareConcurrency === "number" && navigator.hardwareConcurrency <= 2) return true;
  return false;
};

export const frameUrl = (path: string, n: number): string =>
  `${encodeURI(path)}/frame_${String(n).padStart(4, "0")}.webp`;

export function buildInitialOrder(count: number): number[] {
  const order: number[] = [];
  const seen = new Set<number>();
  const add = (n: number) => {
    if (n >= 1 && n <= count && !seen.has(n)) {
      seen.add(n);
      order.push(n);
    }
  };
  for (let i = 1; i <= Math.min(count, 10); i++) add(i);
  for (let i = KEY_STEP; i <= count; i += KEY_STEP) add(i);
  add(count);
  return order;
}

export interface FrameCacheOptions {
  frameCount: number;
  framesPath: string;
  getCurrentTarget: () => number;
  onFrameLoaded?: (index: number) => void;
}

export interface FrameCache {
  readonly isLowMemory: boolean;
  get(n: number): HTMLImageElement | undefined;
  has(n: number): boolean;
  load(n: number): Promise<HTMLImageElement | null>;
  pumpQueue(): void;
  prioritizeWindow(center: number): void;
  findBestFrame(targetIndex: number, direction: number, lastDrawnIndex: number): number;
  trimCache(): void;
  destroy(): void;
}

export function pruneCache(
  frames: Map<number, HTMLImageElement>,
  center: number,
  frameCount: number,
  maxCached: number,
  radius: number,
  keys: number[],
  evict: (n: number) => void
): void {
  if (frames.size <= maxCached) return;
  keys.length = 0;
  for (const key of frames.keys()) {
    if (key !== 1 && key !== frameCount && Math.abs(key - center) > radius) keys.push(key);
  }
  keys.sort((a, b) => Math.abs(b - center) - Math.abs(a - center));
  for (let i = 0; i < keys.length; i++) {
    if (frames.size <= maxCached) break;
    evict(keys[i]);
  }
  keys.length = 0;
}

export function findClosestLoadedFrame(frames: Map<number, HTMLImageElement>, targetIndex: number): number {
  let closest = -1;
  let minDistance = Infinity;
  for (const key of frames.keys()) {
    const dist = Math.abs(key - targetIndex);
    if (dist < minDistance) {
      minDistance = dist;
      closest = key;
    }
  }
  return closest > 0 ? closest : 1;
}

export function findBestFrame(
  frames: Map<number, HTMLImageElement>,
  frameCount: number,
  windowRadius: number,
  targetIndex: number,
  direction: number = 1,
  lastDrawnIndex: number = -1
): number {
  if (frames.has(targetIndex)) return targetIndex;

  const searchLimit = Math.max(windowRadius, 16);
  for (let offset = 1; offset <= searchLimit; offset++) {
    const primary = direction >= 0 ? targetIndex - offset : targetIndex + offset;
    if (primary >= 1 && primary <= frameCount && frames.has(primary)) return primary;

    const secondary = direction >= 0 ? targetIndex + offset : targetIndex - offset;
    if (secondary >= 1 && secondary <= frameCount && frames.has(secondary)) return secondary;
  }

  if (
    lastDrawnIndex >= 1 &&
    lastDrawnIndex <= frameCount &&
    frames.has(lastDrawnIndex) &&
    Math.abs(lastDrawnIndex - targetIndex) <= searchLimit * 2
  ) {
    return lastDrawnIndex;
  }

  return findClosestLoadedFrame(frames, targetIndex);
}

const markUrgent = (n: number, count: number, inUrgent: Uint8Array, isAvail: (n: number) => boolean): number => {
  if (n < 1 || n > count || isAvail(n) || inUrgent[n]) return 0;
  inUrgent[n] = 1;
  return 1;
};

const collectUrgentCount = (
  center: number,
  radius: number,
  count: number,
  inUrgent: Uint8Array,
  isAvail: (n: number) => boolean
): number => {
  inUrgent.fill(0);
  let total = markUrgent(center, count, inUrgent, isAvail);
  for (let offset = 1; offset <= radius; offset++) {
    total += markUrgent(center + offset, count, inUrgent, isAvail);
    total += markUrgent(center - offset, count, inUrgent, isAvail);
  }
  return total;
};

const pushUrgent = (n: number, count: number, inUrgent: Uint8Array, queue: number[]) => {
  if (n >= 1 && n <= count && inUrgent[n]) queue.push(n);
};

const appendUrgentWindow = (
  center: number,
  radius: number,
  count: number,
  inUrgent: Uint8Array,
  queue: number[]
) => {
  pushUrgent(center, count, inUrgent, queue);
  for (let offset = 1; offset <= radius; offset++) {
    pushUrgent(center + offset, count, inUrgent, queue);
    pushUrgent(center - offset, count, inUrgent, queue);
  }
};

const isRetainedFrame = (n: number, center: number, radius: number, frameCount: number): boolean =>
  n === 1 || n === frameCount || n % KEY_STEP === 0 || Math.abs(n - center) <= radius * 2;

const appendRemainingQueue = (
  center: number,
  radius: number,
  frameCount: number,
  inUrgent: Uint8Array,
  queue: number[],
  head: number,
  nextQueue: number[],
  isAvailable: (n: number) => boolean
) => {
  for (let i = head; i < queue.length; i++) {
    const n = queue[i];
    if (inUrgent[n] || isAvailable(n)) continue;
    if (isRetainedFrame(n, center, radius, frameCount)) nextQueue.push(n);
  }
};

export function populateUrgentQueue(
  rounded: number,
  windowRadius: number,
  frameCount: number,
  inUrgent: Uint8Array,
  queue: number[],
  queueHead: number,
  nextQueue: number[],
  isAvailable: (n: number) => boolean
): boolean {
  const urgentCount = collectUrgentCount(rounded, windowRadius, frameCount, inUrgent, isAvailable);
  if (urgentCount === 0) return false;

  nextQueue.length = 0;
  appendUrgentWindow(rounded, windowRadius, frameCount, inUrgent, nextQueue);
  appendRemainingQueue(rounded, windowRadius, frameCount, inUrgent, queue, queueHead, nextQueue, isAvailable);
  return true;
}
