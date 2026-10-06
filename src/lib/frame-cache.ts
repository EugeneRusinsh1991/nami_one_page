export * from "./frame-cache-utils";

import {
  CONCURRENCY,
  isLowMemoryDevice,
  frameUrl,
  buildInitialOrder,
  pruneCache,
  findBestFrame as findBestFrameUtil,
  populateUrgentQueue,
  MAX_CACHED_FRAMES,
  WINDOW_RADIUS,
  TOUCH_MAX_CACHED_FRAMES,
  TOUCH_WINDOW_RADIUS,
  type FrameCache,
  type FrameCacheOptions,
} from "./frame-cache-utils";

const cacheRegistry = new Map<string, FrameCache>();

export function createFrameCache({
  frameCount,
  framesPath,
  getCurrentTarget,
  onFrameLoaded,
}: FrameCacheOptions): FrameCache {
  const existing = cacheRegistry.get(framesPath);
  if (existing) {
    existing.updateCallbacks?.({ getCurrentTarget, onFrameLoaded });
    return existing;
  }

  const frames = new Map<number, HTMLImageElement>();
  const pendingLoads = new Map<number, Promise<HTMLImageElement | null>>();
  let queue: number[] = buildInitialOrder(frameCount);
  let nextQueue: number[] = [];
  let queueHead = 0;
  let activeWorkers = 0;
  let destroyed = false;
  let lastPrioritizedCenter = -1;

  let currentTargetGetter = getCurrentTarget;
  let frameLoadedCallback = onFrameLoaded;

  const inUrgent = new Uint8Array(Math.max(1, frameCount + 1));
  const evictableKeys: number[] = [];

  const lowMemory = isLowMemoryDevice();
  const concurrency = lowMemory ? 8 : CONCURRENCY;
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

  const prune = (center: number) => {
    pruneCache(frames, center, frameCount, maxCachedFrames, windowRadius, evictableKeys, evictFrame);
  };

  const trimCache = () => {
    const currentTarget = Math.round(Math.min(frameCount, Math.max(1, currentTargetGetter())));
    prune(currentTarget);
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
      }, 8000);

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
        const currentTarget = Math.round(Math.min(frameCount, Math.max(1, currentTargetGetter())));
        prune(currentTarget);
        frameLoadedCallback?.(n);
        done(img);
      };

      if (typeof img.decode === "function") {
        img
          .decode()
          .then(onDecoded)
          .catch(() => {
            if (img.complete && img.naturalWidth > 0) {
              onDecoded();
            } else {
              img.onload = onDecoded;
              img.onerror = () => done(null);
            }
          });
      } else {
        img.onload = onDecoded;
        img.onerror = () => done(null);
      }
    }).finally(() => {
      pendingLoads.delete(n);
    });

    pendingLoads.set(n, promise);
    return promise;
  };

  const pumpQueue = () => {
    while (!destroyed && activeWorkers < concurrency && queueHead < queue.length) {
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
      if (frames.size < frameCount && !destroyed) {
        for (let i = 1; i <= frameCount; i++) {
          if (!frames.has(i) && !pendingLoads.has(i)) {
            queue.push(i);
          }
        }
        if (queue.length > 0 && activeWorkers < concurrency) {
          pumpQueue();
        }
      }
    }
  };

  const isFrameAvailable = (n: number) => frames.has(n) || pendingLoads.has(n);

  const prioritizeWindow = (center: number) => {
    const rounded = Math.round(center);
    if (Math.abs(rounded - lastPrioritizedCenter) < 2) return;
    lastPrioritizedCenter = rounded;

    const hasUrgent = populateUrgentQueue(
      rounded,
      windowRadius,
      frameCount,
      inUrgent,
      queue,
      queueHead,
      nextQueue,
      isFrameAvailable
    );

    if (hasUrgent) {
      const temp = queue;
      queue = nextQueue;
      nextQueue = temp;
      queueHead = 0;
      pumpQueue();
    }

    prune(rounded);
  };

  const updateCallbacks = (callbacks: {
    getCurrentTarget?: () => number;
    onFrameLoaded?: (index: number) => void;
  }) => {
    if (callbacks.getCurrentTarget) currentTargetGetter = callbacks.getCurrentTarget;
    if (callbacks.onFrameLoaded !== undefined) frameLoadedCallback = callbacks.onFrameLoaded;
  };

  const destroy = () => {
    frameLoadedCallback = undefined;
  };

  const cacheInstance: FrameCache = {
    isLowMemory: lowMemory,
    get: (n) => frames.get(n),
    has: (n) => frames.has(n),
    load,
    pumpQueue,
    prioritizeWindow,
    findBestFrame: (targetIndex, direction = 1, lastDrawnIndex = -1) =>
      findBestFrameUtil(frames, frameCount, windowRadius, targetIndex, direction, lastDrawnIndex),
    trimCache,
    destroy,
    updateCallbacks,
  };

  cacheRegistry.set(framesPath, cacheInstance);
  return cacheInstance;
}

export function preloadFrameSequence(framesPath: string, frameCount: number, priorityIndices?: number[]): void {
  if (typeof window === "undefined") return;
  const cache = createFrameCache({
    frameCount,
    framesPath,
    getCurrentTarget: () => 1,
  });

  if (priorityIndices && priorityIndices.length > 0) {
    for (const n of priorityIndices) {
      if (!cache.has(n)) {
        cache.load(n);
      }
    }
  }

  cache.pumpQueue();
}
