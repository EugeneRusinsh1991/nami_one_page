"use client";

import { useRef } from "react";
import { gsap, useGSAP, prefersReducedMotion } from "@/lib/gsap";
import { createFrameScrub } from "@/lib/frame-scrub";
import { getActiveScreenHeight } from "@/lib/scroll-topology";
import {
  STEP_COUNT,
  COLOR_ACTIVE,
  COLOR_INACTIVE,
  calculateStepTransformState,
} from "./technique-video-math";

export interface UseTechniqueVideoReturn {
  containerRef: React.RefObject<HTMLElement | null>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  progressRef: React.RefObject<HTMLDivElement | null>;
}

export function useTechniqueVideo(): UseTechniqueVideoReturn {
  const containerRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (prefersReducedMotion()) return;
      gsap.fromTo(
        ".tech-scroll-line",
        { scaleY: 0.35, transformOrigin: "top" },
        { scaleY: 1, duration: 1.2, ease: "sine.inOut", repeat: -1, yoyo: true }
      );
    },
    { scope: containerRef }
  );

  useGSAP(
    () => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return;

      const stepEls = Array.from({ length: STEP_COUNT }, (_, i) =>
        container.querySelector<HTMLElement>(`.tech-step-${i}`)
      );
      const dotEls = Array.from({ length: STEP_COUNT }, (_, i) =>
        container.querySelector<HTMLElement>(`.tech-dot-${i}`)
      );
      const progressBar = progressRef.current?.firstElementChild as HTMLElement | null;

      const applyProgress = (p: number) => {
        for (let i = 0; i < STEP_COUNT; i++) {
          const s = calculateStepTransformState(i, STEP_COUNT, p);
          const stepEl = stepEls[i];
          if (stepEl) {
            gsap.set(stepEl, {
              opacity: s.opacity,
              pointerEvents: s.isActive ? "auto" : "none",
              force3D: true,
            });
          }
          const dotEl = dotEls[i];
          if (dotEl) {
            gsap.set(dotEl, {
              scale: 1 + s.opacity * 0.6,
              backgroundColor: s.isActive ? COLOR_ACTIVE : COLOR_INACTIVE,
            });
          }
        }

        if (progressBar) {
          progressBar.style.transform = `translateX(-${100 - p * 100}%)`;
        }

        gsap.set(".tech-scroll", { opacity: 1, pointerEvents: "auto" });
      };

      applyProgress(0);

      const handle = createFrameScrub({
        canvas,
        trigger: container,
        frameCount: 160,
        framesPath: "/videos/Banner.2/frames",
        pin: false,
        distance: () => (STEP_COUNT - 1) * getActiveScreenHeight(),
        onScrollProgress: applyProgress,
      });

      return () => handle.destroy();
    },
    { scope: containerRef }
  );

  return { containerRef, canvasRef, progressRef };
}
