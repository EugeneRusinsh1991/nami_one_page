"use client";

import type { RefObject } from "react";
import { gsap, useGSAP, prefersReducedMotion } from "@/lib/gsap";

export interface HeroBackgroundEffectsProps {
  canvasRef: RefObject<HTMLCanvasElement | null>;
  scrollLabel: string;
}

export function HeroBackgroundEffects({
  canvasRef,
  scrollLabel,
}: HeroBackgroundEffectsProps): React.JSX.Element {
  useGSAP(() => {
    if (prefersReducedMotion()) return;
    gsap.fromTo(
      ".hero-scroll-line",
      { scaleY: 0.35, transformOrigin: "top" },
      { scaleY: 1, duration: 1.2, ease: "sine.inOut", repeat: -1, yoyo: true }
    );
  });

  return (
    <>
      <canvas
        ref={canvasRef}
        className="hero-video section-bg-full will-change-transform transform-gpu"
        style={{
          transform: "translate3d(0, 0, 0)",
          filter: "contrast(1.04) brightness(1.02)",
        }}
      />

      {/* Side easing gradients */}
      <div
        className="section-bg-full"
        style={{
          background:
            "linear-gradient(to right, rgba(248, 249, 251, 0.75) 0%, rgba(248, 249, 251, 0.35) 12%, transparent 28%, transparent 72%, rgba(248, 249, 251, 0.35) 88%, rgba(248, 249, 251, 0.75) 100%)",
        }}
      />


      {/* Scroll indicator prompt */}
      <div
        className="hero-scroll pointer-events-none absolute inset-x-0 top-[calc(100svh-4.5rem-var(--app-safe-bottom,0px))] md:top-auto md:bottom-36 lg:bottom-40 z-10 flex flex-col items-center gap-2 font-mono text-[11px] font-medium uppercase tracking-[0.3em] text-white [text-shadow:0_2px_8px_rgba(0,0,0,0.85)] isolate"
      >
        <span className="select-none [text-shadow:0_1px_8px_rgba(0,0,0,0.8)]">{scrollLabel}</span>
        <span className="hero-scroll-line h-10 w-0.5 rounded-full bg-white/95 shadow-[0_0_8px_rgba(255,255,255,0.7)]" />
      </div>
    </>
  );
}
