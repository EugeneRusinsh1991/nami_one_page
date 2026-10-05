export * from "./frame-cache-utils";

import {
  CONCURRENCY,
  isLowMemoryDevice,
  frameUrl,
  buildInitialOrder,
  pruneCache,
  findBestFrame as findBestFrameUtil,
  populateUrgentQueue,
  type FrameCache,
  type FrameCacheOptions,
} from "./frame-cache-utils";

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
  const maxCachedFrames = lowMemory ? 48 : 72;
  const windowRadius = lowMemory ? 16 : 24;

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

  const prune = (center: number) => {
    pruneCache(frames, center, frameCount, maxCachedFrames, windowRadius, evictableKeys, evictFrame);
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
        prune(currentTarget);
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
    findBestFrame: (targetIndex, direction = 1, lastDrawnIndex = -1) =>
      findBestFrameUtil(frames, frameCount, windowRadius, targetIndex, direction, lastDrawnIndex),
    trimCache,
    destroy,
  };
}
