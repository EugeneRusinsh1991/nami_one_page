export const KEY_STEP = 16;
export const CONCURRENCY = 4;
export const MAX_CACHED_FRAMES = 36;
export const WINDOW_RADIUS = 16;
export const TOUCH_MAX_CACHED_FRAMES = 24;
export const TOUCH_WINDOW_RADIUS = 8;

export const isLowMemoryDevice = (): boolean =>
  typeof window !== "undefined" &&
  (navigator.maxTouchPoints > 0 || window.matchMedia("(pointer: coarse)").matches);

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

export function createFrameCache({
  frameCount,
  framesPath,
  getCurrentTarget,
  onFrameLoaded,
}: FrameCacheOptions): FrameCache {
  const frames = new Map<number, HTMLImageElement>();
  const pendingLoads = new Map<number, Promise<HTMLImageElement | null>>();
  let queue: number[] = buildInitialOrder(frameCount);
  let activeWorkers = 0;
  let destroyed = false;
  let lastPrioritizedCenter = -1;

  const lowMemory = isLowMemoryDevice();
  const maxCachedFrames = lowMemory ? TOUCH_MAX_CACHED_FRAMES : MAX_CACHED_FRAMES;
  const windowRadius = lowMemory ? TOUCH_WINDOW_RADIUS : WINDOW_RADIUS;

  const evictFrame = (n: number) => {
    if (n === 1 || n === frameCount) return;
    const img = frames.get(n);
    if (!img) return;
    img.onload = null;
    img.onerror = null;
    img.src = "";
    frames.delete(n);
  };

  const trimCache = () => {
    for (const key of Array.from(frames.keys())) evictFrame(key);
    queue = [];
    lastPrioritizedCenter = -1;
  };

  const pruneCache = (center: number) => {
    if (frames.size <= maxCachedFrames) return;

    const evictable: { index: number; dist: number }[] = [];
    for (const key of frames.keys()) {
      if (key === 1 || key === frameCount) continue;
      const dist = Math.abs(key - center);
      if (dist > windowRadius) {
        evictable.push({ index: key, dist });
      }
    }

    evictable.sort((a, b) => b.dist - a.dist);

    for (const item of evictable) {
      if (frames.size <= maxCachedFrames) break;
      evictFrame(item.index);
    }
  };

  const load = (n: number): Promise<HTMLImageElement | null> => {
    if (destroyed) return Promise.resolve(null);
    const cached = frames.get(n);
    if (cached) return Promise.resolve(cached);
    const existing = pendingLoads.get(n);
    if (existing) return existing;

    const promise = new Promise<HTMLImageElement | null>((resolve) => {
      const img = new Image();
      img.decoding = "async";
      img.src = frameUrl(framesPath, n);

      const onDecoded = () => {
        if (destroyed) {
          img.src = "";
          resolve(null);
          return;
        }
        frames.set(n, img);
        const currentTarget = Math.round(Math.min(frameCount, Math.max(1, getCurrentTarget())));
        pruneCache(currentTarget);
        onFrameLoaded?.(n);
        resolve(img);
      };

      if (typeof img.decode === "function") {
        img
          .decode()
          .then(onDecoded)
          .catch(() => {
            img.onload = onDecoded;
            img.onerror = () => resolve(null);
          });
      } else {
        (img as HTMLImageElement).onload = onDecoded;
        (img as HTMLImageElement).onerror = () => resolve(null);
      }
    }).finally(() => {
      pendingLoads.delete(n);
    });

    pendingLoads.set(n, promise);
    return promise;
  };

  const pumpQueue = () => {
    while (!destroyed && activeWorkers < CONCURRENCY && queue.length > 0) {
      const next = queue.shift();
      if (next === undefined) break;
      if (frames.has(next) || pendingLoads.has(next)) continue;

      activeWorkers++;
      load(next).then(() => {
        activeWorkers--;
        pumpQueue();
      });
    }
  };

  const prioritizeWindow = (center: number) => {
    const rounded = Math.round(center);
    if (Math.abs(rounded - lastPrioritizedCenter) < 2) return;
    lastPrioritizedCenter = rounded;

    const urgent: number[] = [];
    for (let offset = 0; offset <= windowRadius; offset++) {
      const fwd = rounded + offset;
      if (fwd <= frameCount && !frames.has(fwd) && !pendingLoads.has(fwd)) urgent.push(fwd);
      if (offset > 0) {
        const back = rounded - offset;
        if (back >= 1 && !frames.has(back) && !pendingLoads.has(back)) urgent.push(back);
      }
    }

    if (urgent.length > 0) {
      const urgentSet = new Set(urgent);
      queue = [
        ...urgent,
        ...queue.filter((n) => !urgentSet.has(n) && (n === 1 || n % KEY_STEP === 0 || Math.abs(n - rounded) <= windowRadius * 2)),
      ];
      pumpQueue();
    }

    pruneCache(rounded);
  };

  const searchBackward = (from: number): number | undefined => {
    for (let i = from; i >= 1; i--) {
      if (frames.has(i)) return i;
    }
  };

  const searchForward = (from: number): number | undefined => {
    for (let i = from; i <= frameCount; i++) {
      if (frames.has(i)) return i;
    }
  };

  const getFallbackFrame = (lastDrawnIndex: number): number =>
    lastDrawnIndex >= 1 && lastDrawnIndex <= frameCount && frames.has(lastDrawnIndex)
      ? lastDrawnIndex
      : 1;

  const findBestFrame = (targetIndex: number, direction: number = 1, lastDrawnIndex: number = -1): number => {
    if (frames.has(targetIndex)) return targetIndex;

    const first = direction >= 0 ? searchBackward(targetIndex - 1) : searchForward(targetIndex + 1);
    if (first !== undefined) return first;

    const second = direction >= 0 ? searchForward(targetIndex + 1) : searchBackward(targetIndex - 1);
    if (second !== undefined) return second;

    return getFallbackFrame(lastDrawnIndex);
  };

  const destroy = () => {
    destroyed = true;
    pendingLoads.clear();
    queue = [];
    frames.forEach((img) => {
      img.onload = null;
      img.onerror = null;
      img.src = "";
    });
    frames.clear();
  };

  return {
    isLowMemory: lowMemory,
    get: (n) => frames.get(n),
    has: (n) => frames.has(n),
    load,
    pumpQueue,
    prioritizeWindow,
    findBestFrame,
    trimCache,
    destroy,
  };
}
