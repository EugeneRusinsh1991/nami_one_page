export const KEY_STEP = 16;
export const CONCURRENCY = 4;
export const MAX_CACHED_FRAMES = 72;
export const WINDOW_RADIUS = 24;
export const TOUCH_MAX_CACHED_FRAMES = 48;
export const TOUCH_WINDOW_RADIUS = 16;

export const isLowMemoryDevice = (): boolean => {
  if (typeof window === "undefined" || typeof navigator === "undefined") return false;

  const nav = navigator as Navigator & { deviceMemory?: number };
  if (typeof nav.deviceMemory === "number" && nav.deviceMemory < 4) {
    return true;
  }

  if (typeof navigator.hardwareConcurrency === "number" && navigator.hardwareConcurrency <= 2) {
    return true;
  }

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

export function createFrameCache({
  frameCount,
  framesPath,
  getCurrentTarget,
  onFrameLoaded,
}: FrameCacheOptions): FrameCache {
  const frames = new Map<number, HTMLImageElement>();
  const pendingLoads = new Map<number, Promise<HTMLImageElement | null>>();
  let queue: number[] = buildInitialOrder(frameCount);
  let nextQueue: number[] = [];
  let queueHead = 0;
  let activeWorkers = 0;
  let destroyed = false;
  let lastPrioritizedCenter = -1;

  const inUrgent = new Uint8Array(Math.max(1, frameCount + 1));
  const evictableKeys: number[] = [];

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
    for (const key of frames.keys()) evictFrame(key);
    queue.length = 0;
    nextQueue.length = 0;
    queueHead = 0;
    lastPrioritizedCenter = -1;
  };

  const pruneCache = (center: number) => {
    if (frames.size <= maxCachedFrames) return;

    evictableKeys.length = 0;
    for (const key of frames.keys()) {
      if (key === 1 || key === frameCount) continue;
      const dist = Math.abs(key - center);
      if (dist > windowRadius) {
        evictableKeys.push(key);
      }
    }

    evictableKeys.sort((a, b) => Math.abs(b - center) - Math.abs(a - center));

    for (let i = 0; i < evictableKeys.length; i++) {
      if (frames.size <= maxCachedFrames) break;
      evictFrame(evictableKeys[i]);
    }
    evictableKeys.length = 0;
  };

  const load = (n: number): Promise<HTMLImageElement | null> => {
    if (destroyed) return Promise.resolve(null);
    const cached = frames.get(n);
    if (cached) return Promise.resolve(cached);
    const existing = pendingLoads.get(n);
    if (existing) return existing;

    const promise = new Promise<HTMLImageElement | null>((resolve) => {
      let settled = false;
      const done = (result: HTMLImageElement | null) => {
        if (settled) return;
        settled = true;
        clearTimeout(timeoutId);
        resolve(result);
      };

      const timeoutId = setTimeout(() => {
        done(null);
      }, 5000);

      const img = new Image();
      img.decoding = "async";
      img.src = frameUrl(framesPath, n);

      const onDecoded = () => {
        if (destroyed) {
          img.src = "";
          done(null);
          return;
        }
        frames.set(n, img);
        const currentTarget = Math.round(Math.min(frameCount, Math.max(1, getCurrentTarget())));
        pruneCache(currentTarget);
        onFrameLoaded?.(n);
        done(img);
      };

      if (typeof img.decode === "function") {
        img
          .decode()
          .then(onDecoded)
          .catch(() => {
            img.onload = onDecoded;
            img.onerror = () => done(null);
          });
      } else {
        (img as HTMLImageElement).onload = onDecoded;
        (img as HTMLImageElement).onerror = () => done(null);
      }
    }).finally(() => {
      pendingLoads.delete(n);
    });

    pendingLoads.set(n, promise);
    return promise;
  };

  const pumpQueue = () => {
    while (!destroyed && activeWorkers < CONCURRENCY && queueHead < queue.length) {
      const next = queue[queueHead++];
      if (frames.has(next) || pendingLoads.has(next)) continue;

      activeWorkers++;
      load(next).then(() => {
        activeWorkers--;
        pumpQueue();
      });
    }

    if (queueHead >= queue.length) {
      queue.length = 0;
      queueHead = 0;
    }
  };

  const prioritizeWindow = (center: number) => {
    const rounded = Math.round(center);
    if (Math.abs(rounded - lastPrioritizedCenter) < 2) return;
    lastPrioritizedCenter = rounded;

    inUrgent.fill(0);
    let urgentCount = 0;

    for (let offset = 0; offset <= windowRadius; offset++) {
      const fwd = rounded + offset;
      if (fwd <= frameCount && !frames.has(fwd) && !pendingLoads.has(fwd) && !inUrgent[fwd]) {
        inUrgent[fwd] = 1;
        urgentCount++;
      }
      if (offset > 0) {
        const back = rounded - offset;
        if (back >= 1 && !frames.has(back) && !pendingLoads.has(back) && !inUrgent[back]) {
          inUrgent[back] = 1;
          urgentCount++;
        }
      }
    }

    if (urgentCount > 0) {
      nextQueue.length = 0;

      for (let offset = 0; offset <= windowRadius; offset++) {
        const fwd = rounded + offset;
        if (fwd <= frameCount && inUrgent[fwd]) {
          nextQueue.push(fwd);
        }
        if (offset > 0) {
          const back = rounded - offset;
          if (back >= 1 && inUrgent[back]) {
            nextQueue.push(back);
          }
        }
      }

      for (let i = queueHead; i < queue.length; i++) {
        const n = queue[i];
        if (!inUrgent[n] && !frames.has(n) && !pendingLoads.has(n)) {
          if (n === 1 || n === frameCount || n % KEY_STEP === 0 || Math.abs(n - rounded) <= windowRadius * 2) {
            nextQueue.push(n);
          }
        }
      }

      const temp = queue;
      queue = nextQueue;
      nextQueue = temp;
      queueHead = 0;

      pumpQueue();
    }

    pruneCache(rounded);
  };

  const findClosestLoadedFrame = (targetIndex: number): number => {
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
  };

  const findBestFrame = (
    targetIndex: number,
    direction: number = 1,
    lastDrawnIndex: number = -1
  ): number => {
    if (frames.has(targetIndex)) return targetIndex;

    const searchLimit = Math.max(windowRadius, 16);
    for (let offset = 1; offset <= searchLimit; offset++) {
      const primary = direction >= 0 ? targetIndex - offset : targetIndex + offset;
      if (primary >= 1 && primary <= frameCount && frames.has(primary)) {
        return primary;
      }

      const secondary = direction >= 0 ? targetIndex + offset : targetIndex - offset;
      if (secondary >= 1 && secondary <= frameCount && frames.has(secondary)) {
        return secondary;
      }
    }

    if (
      lastDrawnIndex >= 1 &&
      lastDrawnIndex <= frameCount &&
      frames.has(lastDrawnIndex) &&
      Math.abs(lastDrawnIndex - targetIndex) <= searchLimit * 2
    ) {
      return lastDrawnIndex;
    }

    return findClosestLoadedFrame(targetIndex);
  };

  const destroy = () => {
    destroyed = true;
    pendingLoads.clear();
    queue.length = 0;
    nextQueue.length = 0;
    queueHead = 0;
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
