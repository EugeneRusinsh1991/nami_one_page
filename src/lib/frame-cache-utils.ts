export const KEY_STEP = 8;
export const CONCURRENCY = 16;
export const MAX_CACHED_FRAMES = 240;
export const WINDOW_RADIUS = 72;
export const TOUCH_MAX_CACHED_FRAMES = 200;
export const TOUCH_WINDOW_RADIUS = 54;

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
  const order: number[] = new Array(count);
  for (let i = 0; i < count; i++) {
    order[i] = i + 1;
  }
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
  updateCallbacks?(callbacks: { getCurrentTarget?: () => number; onFrameLoaded?: (index: number) => void }): void;
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

  const isTeleport =
    lastDrawnIndex > 0 &&
    Math.abs(targetIndex - lastDrawnIndex) > Math.max(windowRadius, 32);

  // When moving continuously, preserve strict monotonicity in the direction of motion
  // to eliminate jitter and flickering from out-of-order frame arrivals
  if (!isTeleport && lastDrawnIndex >= 1 && lastDrawnIndex <= frameCount) {
    if (direction >= 0) {
      if (targetIndex >= lastDrawnIndex) {
        for (let f = targetIndex; f >= lastDrawnIndex; f--) {
          if (frames.has(f)) return f;
        }
        if (frames.has(lastDrawnIndex)) return lastDrawnIndex;
      }
    } else {
      if (targetIndex <= lastDrawnIndex) {
        for (let f = targetIndex; f <= lastDrawnIndex; f++) {
          if (frames.has(f)) return f;
        }
        if (frames.has(lastDrawnIndex)) return lastDrawnIndex;
      }
    }
  }

  // Fallback for initial render, teleport, or rapid directional change
  const searchLimit = Math.max(windowRadius, 24);
  for (let offset = 1; offset <= searchLimit; offset++) {
    const primary = direction >= 0 ? targetIndex - offset : targetIndex + offset;
    if (primary >= 1 && primary <= frameCount && frames.has(primary)) return primary;

    const secondary = direction >= 0 ? targetIndex + offset : targetIndex - offset;
    if (secondary >= 1 && secondary <= frameCount && frames.has(secondary)) return secondary;
  }

  if (lastDrawnIndex >= 1 && lastDrawnIndex <= frameCount && frames.has(lastDrawnIndex)) {
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

const appendRemainingQueue = (
  inUrgent: Uint8Array,
  queue: number[],
  head: number,
  nextQueue: number[],
  isAvailable: (n: number) => boolean
) => {
  for (let i = head; i < queue.length; i++) {
    const n = queue[i];
    if (inUrgent[n] || isAvailable(n)) continue;
    nextQueue.push(n);
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
  appendRemainingQueue(inUrgent, queue, queueHead, nextQueue, isAvailable);
  return true;
}
