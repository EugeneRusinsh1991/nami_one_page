import { gsap, ScrollTrigger } from "@/lib/gsap";
import { BREAKPOINTS } from "@/hooks/use-breakpoint";
import { createFrameCache, isLowMemoryDevice, preloadFrameSequence } from "./frame-cache";

const MAX_DPR = 2;
const MOBILE_MAX_DPR = 1.5;

export interface FrameScrubOptions {
  canvas: HTMLCanvasElement;
  trigger: Element;
  distance: number | (() => number);
  frameCount: number;
  framesPath: string;
  verticalAlign?: "top" | "center";
  topOffset?: number | (() => number);
  onProgress?: (progress: number) => void;
  onScrollProgress?: (progress: number) => void;
  onFirstFrame?: () => void;
  snap?: ScrollTrigger.Vars["snap"];
  pin?: boolean;
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
  verticalAlign = "center",
  topOffset,
  onProgress,
  onScrollProgress,
  onFirstFrame,
  snap,
  pin,
}: FrameScrubOptions): FrameScrubHandle {
  const ctx = canvas.getContext("2d", { alpha: false });
  let target = 0;
  let smoothed = 0;
  let lastDrawnIndex = -1;
  let scrollDirection = 1;
  let needsRedraw = true;
  let destroyed = false;
  let isTickerActive = false;
  let currentDpr = 1;

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

  const lowMemory = isLowMemoryDevice();
  const frameCache = createFrameCache({
    frameCount,
    framesPath,
    getCurrentTarget: () => smoothed * (frameCount - 1) + 1,
    onFrameLoaded: (n) => {
      const currentTarget = Math.round(Math.min(frameCount, Math.max(1, smoothed * (frameCount - 1) + 1)));
      const isCloser = Math.abs(n - currentTarget) <= Math.abs(lastDrawnIndex - currentTarget);
      const isConsistentWithDirection =
        lastDrawnIndex === -1 ||
        (scrollDirection >= 0 ? n >= lastDrawnIndex : n <= lastDrawnIndex);
      if (isCloser && isConsistentWithDirection) {
        needsRedraw = true;
        if (!isTickerActive && !destroyed) {
          startTicker();
        }
      }
    },
  });

  const configureContext = () => {
    if (!ctx) return;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "medium";
  };

  const drawFrameCover = (img: HTMLImageElement) => {
    if (!ctx || !img.naturalWidth || !img.naturalHeight) return;
    try {
      const scale = Math.max(canvas.width / img.naturalWidth, canvas.height / img.naturalHeight);
      const w = Math.ceil(img.naturalWidth * scale);
      const h = Math.ceil(img.naturalHeight * scale);
      const x = Math.round((canvas.width - w) * 0.5);

      const y = verticalAlign === "top"
        ? 0
        : Math.round((canvas.height - h) * 0.5);

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
    currentDpr = dpr;
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
    if (!needsRedraw) {
      stopTicker();
      return;
    }

    const currentFloat = smoothed * (frameCount - 1) + 1;
    frameCache.prioritizeWindow(currentFloat);
    render(currentFloat, scrollDirection);
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
          }
        }, { rootMargin: "100% 0px" })
      : null;

  if (intersectionObserver) {
    intersectionObserver.observe(trigger);
  } else {
    startTicker();
  }

  frameCache.pumpQueue();

  frameCache.load(1).then(() => {
    if (!destroyed) {
      needsRedraw = true;
      const initialFloat = smoothed * (frameCount - 1) + 1;
      render(initialFloat);
      onProgress?.(smoothed);
      onFirstFrame?.();
      if (framesPath.includes("Banner.1")) {
        preloadFrameSequence("/videos/Banner.2/frames", 160, [1, 2, 3, 4, 5, 8, 12, 16, 20, 24, 30, 40]);
      }
    }
  });

  const scrollTrigger = ScrollTrigger.create({
    id: "story-frame-scrub",
    trigger,
    start: "top top",
    end: () => `+=${typeof distance === "function" ? distance() : distance}`,
    pin: pin ?? true,
    anticipatePin: 0,
    invalidateOnRefresh: true,
    snap,
    onUpdate: (self) => {
      target = self.progress;
      smoothed = self.progress;
      if (self.direction !== 0) {
        scrollDirection = self.direction >= 0 ? 1 : -1;
      }
      onScrollProgress?.(self.progress);
      onProgress?.(self.progress);

      const currentFloat = self.progress * (frameCount - 1) + 1;
      frameCache.prioritizeWindow(currentFloat);
      render(currentFloat, scrollDirection);

      if (framesPath.includes("Banner.1") && self.progress >= 0.65) {
        preloadFrameSequence("/videos/Banner.2/frames", 160, [1, 2, 3, 4, 5, 10, 15, 20, 25, 30, 35, 40]);
      } else if (framesPath.includes("Banner.2") && self.progress <= 0.35) {
        preloadFrameSequence("/videos/Banner.1/frames", 120, [120, 115, 110, 105, 100, 95, 90, 85, 80]);
      }

      if (!isTickerActive && !destroyed) {
        startTicker();
      }
    },
  });

  target = scrollTrigger.progress;
  smoothed = scrollTrigger.progress;
  onProgress?.(smoothed);
  onScrollProgress?.(scrollTrigger.progress);

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
