import { gsap, ScrollTrigger } from "@/lib/gsap";
import { BREAKPOINTS } from "@/hooks/use-breakpoint";
import { createFrameCache, isLowMemoryDevice } from "./frame-cache";

const LERP = 0.28;
const MAX_DPR = 2;
const MOBILE_MAX_DPR = 1.5;

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
  let target = 0;
  let smoothed = 0;
  let lastDrawnIndex = -1;
  let scrollDirection = 1;
  let needsRedraw = true;
  let destroyed = false;
  let isTickerActive = false;

  const lowMemory = isLowMemoryDevice();
  const frameCache = createFrameCache({
    frameCount,
    framesPath,
    getCurrentTarget: () => smoothed * (frameCount - 1) + 1,
    onFrameLoaded: (n) => {
      const currentTarget = Math.round(Math.min(frameCount, Math.max(1, smoothed * (frameCount - 1) + 1)));
      if (Math.abs(n - currentTarget) <= Math.abs(lastDrawnIndex - currentTarget)) {
        needsRedraw = true;
      }
    },
  });

  const configureContext = () => {
    if (!ctx) return;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
  };

  const drawFrameCover = (img: HTMLImageElement) => {
    if (!ctx || !img.naturalWidth || !img.naturalHeight) return;
    try {
      const scale = Math.max(canvas.width / img.naturalWidth, canvas.height / img.naturalHeight);
      const w = Math.ceil(img.naturalWidth * scale);
      const h = Math.ceil(img.naturalHeight * scale);
      const x = Math.round((canvas.width - w) * 0.5);
      const y = Math.round((canvas.height - h) * 0.5);

      ctx.drawImage(img, x, y, w, h);
    } catch {
      // Guard against potential context loss in WebKit/Safari under memory pressure
    }
  };

  const render = (floatIndex: number, direction: number = scrollDirection) => {
    if (!ctx || canvas.width === 0 || canvas.height === 0) return;

    const clamped = Math.min(frameCount, Math.max(1, floatIndex));
    const targetIndex = Math.round(clamped);

    const frameIndex = frameCache.findBestFrame(targetIndex, direction, lastDrawnIndex);
    if (frameIndex === lastDrawnIndex && !needsRedraw) return;

    const img = frameCache.get(frameIndex);
    if (!img) return;

    drawFrameCover(img);
    lastDrawnIndex = frameIndex;
    needsRedraw = false;
  };

  const resize = () => {
    const isMobile = typeof window !== "undefined" && window.innerWidth < BREAKPOINTS.md;
    const maxDpr = isMobile || lowMemory ? MOBILE_MAX_DPR : MAX_DPR;
    const dpr = Math.min(window.devicePixelRatio || 1, maxDpr);
    const parent = canvas.parentElement;
    const displayWidth = canvas.clientWidth || (parent ? parent.clientWidth : window.innerWidth);
    const displayHeight = canvas.clientHeight || (parent ? parent.clientHeight : window.innerHeight);
    const w = Math.max(1, Math.round(displayWidth * dpr));
    const h = Math.max(1, Math.round(displayHeight * dpr));

    // Guard against sub-pixel micro-jitter on mobile touch devices while allowing toolbar expansion/collapse to resize
    const isHeightOnlyJitter = canvas.width === w && canvas.height > 0 && Math.abs(canvas.height - h) <= 2 * dpr;
    if (isHeightOnlyJitter) return;

    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
      configureContext();
      needsRedraw = true;
      render(smoothed * (frameCount - 1) + 1);
    }
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
    frameCache.prioritizeWindow(currentFloat);
    render(currentFloat, scrollDirection);
  };

  const startTicker = () => {
    if (destroyed || isTickerActive) return;
    gsap.ticker.add(tick);
    isTickerActive = true;
    needsRedraw = true;
  };

  const stopTicker = () => {
    if (!isTickerActive) return;
    gsap.ticker.remove(tick);
    isTickerActive = false;
  };

  resize();
  const observer = typeof ResizeObserver !== "undefined" ? new ResizeObserver(resize) : null;
  observer?.observe(canvas.parentElement || canvas);
  window.addEventListener("resize", resize);

  const intersectionObserver =
    typeof IntersectionObserver !== "undefined"
      ? new IntersectionObserver((entries) => {
          const entry = entries[0];
          if (!entry) return;
          if (entry.isIntersecting) {
            startTicker();
          } else {
            stopTicker();
            if (lowMemory) frameCache.trimCache();
          }
        }, { rootMargin: "100% 0px" })
      : null;

  if (intersectionObserver) {
    intersectionObserver.observe(trigger);
  } else {
    startTicker();
  }

  frameCache.load(1).then(() => {
    if (!destroyed) {
      needsRedraw = true;
      render(1);
      onProgress?.(smoothed);
      frameCache.pumpQueue();
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
      if (!isTickerActive && !destroyed) {
        startTicker();
      }
    },
  });

  target = scrollTrigger.progress;
  smoothed = scrollTrigger.progress;
  onProgress?.(smoothed);

  return {
    trigger: scrollTrigger,
    destroy: () => {
      destroyed = true;
      stopTicker();
      observer?.disconnect();
      intersectionObserver?.disconnect();
      window.removeEventListener("resize", resize);
      scrollTrigger.kill();
      frameCache.destroy();
      canvas.width = 0;
      canvas.height = 0;
    },
  };
}
