import { gsap, ScrollTrigger } from "@/lib/gsap";

const LERP = 0.45;
const KEY_STEP = 6;
const CONCURRENCY = 6;
const MAX_DPR = 2;

export interface FrameScrubOptions {
  canvas: HTMLCanvasElement;
  trigger: Element;
  distance: number | (() => number);
  frameCount: number;
  framesPath: string;
  onProgress?: (progress: number) => void;
  snap?: ScrollTrigger.Vars["snap"];
}

export interface FrameScrubHandle {
  trigger: ScrollTrigger;
  destroy: () => void;
}

const frameUrl = (path: string, n: number) => `${encodeURI(path)}/frame_${String(n).padStart(4, "0")}.webp`;

function buildInitialOrder(count: number): number[] {
  const order: number[] = [];
  const seen = new Set<number>();
  const add = (n: number) => {
    if (n >= 1 && n <= count && !seen.has(n)) {
      seen.add(n);
      order.push(n);
    }
  };

  // Immediate first frames for instant cover display
  for (let i = 1; i <= Math.min(count, 12); i++) add(i);
  // Dense keyframes across entire timeline
  for (let i = KEY_STEP; i <= count; i += KEY_STEP) add(i);
  add(count);
  // Full sequential fill
  for (let i = 1; i <= count; i++) add(i);

  return order;
}

export function createFrameScrub({
  canvas,
  trigger,
  distance,
  frameCount,
  framesPath,
  onProgress,
  snap,
}: FrameScrubOptions): FrameScrubHandle {
  const ctx = canvas.getContext("2d", { alpha: false });
  const frames: (HTMLImageElement | undefined)[] = new Array(frameCount + 1);
  const pendingLoads = new Map<number, Promise<HTMLImageElement | null>>();
  let queue: number[] = buildInitialOrder(frameCount);
  let activeWorkers = 0;
  let destroyed = false;

  let target = 0;
  let smoothed = 0;
  let lastDrawnIndex = -1;
  let lastPrioritizedCenter = -1;
  let scrollDirection = 1;
  let needsRedraw = true;

  const configureContext = () => {
    if (!ctx) return;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
  };

  const resize = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
    const parent = canvas.parentElement;
    const displayWidth = parent ? parent.clientWidth : (canvas.clientWidth || window.innerWidth);
    const displayHeight = parent ? parent.clientHeight : (canvas.clientHeight || window.innerHeight);
    const w = Math.max(1, Math.round(displayWidth * dpr));
    const h = Math.max(1, Math.round(displayHeight * dpr));

    // Guard against vertical address-bar jitter on mobile touch devices
    const isHeightOnlyJitter = canvas.width === w && canvas.height > 0 && Math.abs(canvas.height - h) <= 120 * dpr;
    if (isHeightOnlyJitter) return;

    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
      configureContext();
      needsRedraw = true;
      render(smoothed * (frameCount - 1) + 1);
    }
  };

  const load = (n: number): Promise<HTMLImageElement | null> => {
    if (frames[n]) return Promise.resolve(frames[n]!);
    const existing = pendingLoads.get(n);
    if (existing) return existing;

    const promise = new Promise<HTMLImageElement | null>((resolve) => {
      const img = new Image();
      img.decoding = "async";
      img.src = frameUrl(framesPath, n);

      const onDecoded = () => {
        frames[n] = img;
        const currentTarget = Math.round(Math.min(frameCount, Math.max(1, smoothed * (frameCount - 1) + 1)));
        if (Math.abs(n - currentTarget) <= Math.abs(lastDrawnIndex - currentTarget)) {
          needsRedraw = true;
        }
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
      if (frames[next] || pendingLoads.has(next)) continue;

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
    for (let offset = 0; offset <= 14; offset++) {
      const fwd = rounded + offset;
      if (fwd <= frameCount && !frames[fwd] && !pendingLoads.has(fwd)) urgent.push(fwd);
      if (offset > 0) {
        const back = rounded - offset;
        if (back >= 1 && !frames[back] && !pendingLoads.has(back)) urgent.push(back);
      }
    }

    if (urgent.length > 0) {
      const urgentSet = new Set(urgent);
      queue = [...urgent, ...queue.filter((n) => !urgentSet.has(n))];
      pumpQueue();
    }
  };

  const findBestFrame = (targetIndex: number, direction: number = scrollDirection): number => {
    if (frames[targetIndex]) return targetIndex;

    // Direction-aware search to prevent stroboscopic jumps (forward/backward oscillation).
    // When scrolling forward (direction >= 0), prefer frames <= targetIndex to maintain monotonicity.
    // When scrolling backward (direction < 0), prefer frames >= targetIndex.
    if (direction >= 0) {
      for (let i = targetIndex - 1; i >= 1; i--) {
        if (frames[i]) return i;
      }
      for (let i = targetIndex + 1; i <= frameCount; i++) {
        if (frames[i]) return i;
      }
    } else {
      for (let i = targetIndex + 1; i <= frameCount; i++) {
        if (frames[i]) return i;
      }
      for (let i = targetIndex - 1; i >= 1; i--) {
        if (frames[i]) return i;
      }
    }

    return lastDrawnIndex >= 1 && lastDrawnIndex <= frameCount && frames[lastDrawnIndex]
      ? lastDrawnIndex
      : 1;
  };

  const drawFrameCover = (img: HTMLImageElement) => {
    if (!ctx || !img.naturalWidth || !img.naturalHeight) return;
    const scale = Math.max(canvas.width / img.naturalWidth, canvas.height / img.naturalHeight);
    const w = Math.ceil(img.naturalWidth * scale);
    const h = Math.ceil(img.naturalHeight * scale);
    const x = Math.round((canvas.width - w) * 0.5);
    const y = Math.round((canvas.height - h) * 0.5);

    ctx.drawImage(img, x, y, w, h);
  };

  const render = (floatIndex: number, direction: number = scrollDirection) => {
    if (!ctx || canvas.width === 0 || canvas.height === 0) return;

    const clamped = Math.min(frameCount, Math.max(1, floatIndex));
    const targetIndex = Math.round(clamped);

    const frameIndex = frames[targetIndex] ? targetIndex : findBestFrame(targetIndex, direction);
    if (frameIndex === lastDrawnIndex && !needsRedraw) return;

    const img = frames[frameIndex];
    if (!img) return;

    drawFrameCover(img);
    lastDrawnIndex = frameIndex;
    needsRedraw = false;
  };

  const tick = () => {
    const delta = target - smoothed;
    const absDelta = Math.abs(delta);
    const isMoving = absDelta >= 0.0001;

    if (delta > 0.0001) scrollDirection = 1;
    else if (delta < -0.0001) scrollDirection = -1;

    if (isMoving) {
      smoothed += delta * LERP;
      if (Math.abs(target - smoothed) < 0.0001) {
        smoothed = target;
      }
      onProgress?.(smoothed);
    } else if (smoothed !== target) {
      smoothed = target;
      onProgress?.(smoothed);
    }

    // Suppress GPU draw calls and priority queue reordering when canvas is idle and clean
    if (!isMoving && !needsRedraw) {
      return;
    }

    const currentFloat = smoothed * (frameCount - 1) + 1;
    prioritizeWindow(currentFloat);
    render(currentFloat, scrollDirection);
  };

  resize();
  const observer = typeof ResizeObserver !== "undefined" ? new ResizeObserver(resize) : null;
  observer?.observe(canvas.parentElement || canvas);
  window.addEventListener("resize", resize);
  gsap.ticker.add(tick);

  load(1).then(() => {
    if (!destroyed) {
      needsRedraw = true;
      render(1);
      onProgress?.(smoothed);
      pumpQueue();
    }
  });

  const scrollTrigger = ScrollTrigger.create({
    trigger,
    start: "top top",
    end: () => `+=${typeof distance === "function" ? distance() : distance}`,
    pin: true,
    anticipatePin: 0,
    invalidateOnRefresh: true,
    snap,
    onUpdate: (self) => {
      target = self.progress;
      if (self.direction !== 0) {
        scrollDirection = self.direction >= 0 ? 1 : -1;
      }
    },
  });

  // Align initial progress with trigger position
  target = scrollTrigger.progress;
  smoothed = scrollTrigger.progress;
  onProgress?.(smoothed);

  return {
    trigger: scrollTrigger,
    destroy: () => {
      destroyed = true;
      gsap.ticker.remove(tick);
      observer?.disconnect();
      window.removeEventListener("resize", resize);
      scrollTrigger.kill();
    },
  };
}
