"use client";

import { useRef } from "react";
import { gsap, useGSAP, prefersReducedMotion } from "@/lib/gsap";
import { createFrameScrub } from "@/lib/frame-scrub";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { SectionHeader } from "@/components/ui/section-header";
import { useLanguage } from "@/components/providers/language-provider";
import { isMobileWidth } from "@/hooks/use-breakpoint";
import { TECHNIQUE_STEP_POINTS } from "@/lib/scroll-breakpoints";

const STEP_COUNT = TECHNIQUE_STEP_POINTS.length;
const COLOR_ACTIVE = "#1A1F25";
const COLOR_INACTIVE = "#D5DAE0";

function smoothstep(min: number, max: number, value: number): number {
  if (max <= min) return 0;
  const x = Math.max(0, Math.min(1, (value - min) / (max - min)));
  return x * x * (3 - 2 * x);
}

export interface StepTransformState {
  opacity: number;
  y: number;
  isActive: boolean;
}

export function calculateStepTransformState(
  stepIndex: number,
  totalSteps: number,
  progress: number,
  stepPoints: readonly number[] = TECHNIQUE_STEP_POINTS
): StepTransformState {
  if (totalSteps <= 1) {
    return { opacity: 1, y: 0, isActive: true };
  }

  const p = Math.max(0, Math.min(1, progress));
  const isFirst = stepIndex === 0;
  const isLast = stepIndex === totalSteps - 1;

  let currentStep = 0;
  let minDistance = Infinity;
  for (let i = 0; i < totalSteps; i++) {
    const pt = stepPoints[i] ?? i / (totalSteps - 1);
    const dist = Math.abs(p - pt);
    if (dist < minDistance) {
      minDistance = dist;
      currentStep = i;
    }
  }
  const isActive = stepIndex === currentStep;

  const currentPt = stepPoints[stepIndex] ?? stepIndex / (totalSteps - 1);
  const prevPt = isFirst ? 0 : (stepPoints[stepIndex - 1] ?? (stepIndex - 1) / (totalSteps - 1));
  const nextPt = isLast ? 1 : (stepPoints[stepIndex + 1] ?? (stepIndex + 1) / (totalSteps - 1));

  const prevSpan = currentPt - prevPt;
  const nextSpan = nextPt - currentPt;

  // Staggered card transition: exit earlier, pause, then enter next card without overlap
  const enterStart = isFirst ? -1 : prevPt + prevSpan * 0.55;
  const enterEnd = isFirst ? -1 : prevPt + prevSpan * 0.86;

  const exitStart = isLast ? 2 : currentPt + nextSpan * 0.16;
  const exitEnd = isLast ? 2 : currentPt + nextSpan * 0.45;

  const Y_OFFSET = 20;

  if (!isFirst && p < enterStart) {
    return { opacity: 0, y: Y_OFFSET, isActive };
  }

  if (!isFirst && p <= enterEnd) {
    const t = smoothstep(enterStart, enterEnd, p);
    return {
      opacity: t,
      y: (1 - t) * Y_OFFSET,
      isActive,
    };
  }

  if (p < exitStart) {
    return { opacity: 1, y: 0, isActive };
  }

  if (!isLast && p <= exitEnd) {
    const t = smoothstep(exitStart, exitEnd, p);
    return {
      opacity: 1 - t,
      y: -t * Y_OFFSET,
      isActive,
    };
  }

  return { opacity: 0, y: -Y_OFFSET, isActive };
}

export function TechniqueVideoSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const { t } = useLanguage();

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
              y: s.y,
              scale: 0.98 + 0.02 * s.opacity,
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
        distance: () => (isMobileWidth() ? 1600 : 3000),
        onProgress: applyProgress,
      });

      return () => handle.destroy();
    },
    { scope: containerRef }
  );

  return (
    <section ref={containerRef} id="technique" className="relative h-[100lvh] min-h-[100lvh] w-full overflow-hidden bg-brand-surface isolate">
      <canvas
        ref={canvasRef}
        className="tech-video pointer-events-none absolute inset-0 h-full w-full will-change-transform transform-gpu"
        style={{
          transform: "translate3d(0, 0, 0)",
          filter: "contrast(1.04) brightness(1.02)",
        }}
      />

      {/* Smooth easing gradient + radial vignette */}
      <div
        className="pointer-events-none absolute inset-0 z-0 isolate"
        style={{
          background: "linear-gradient(to right, rgba(248, 249, 251, 0.75) 0%, rgba(248, 249, 251, 0.4) 25%, transparent 55%)",
        }}
      />

      {/* Procedural Film Grain for dithering & cinematic texture */}
      <svg
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0 h-full w-full opacity-[0.05] mix-blend-overlay will-change-transform transform-gpu"
      >
        <filter id="tech-grain">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.8"
            numOctaves="3"
            stitchTiles="stitch"
          />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#tech-grain)" />
      </svg>

      <div className="relative z-10 mx-auto flex h-[100dvh] min-h-[100dvh] w-full max-w-6xl items-start px-6 safe-offset-mobile md:items-center">
        <div className="relative h-80 sm:h-96 w-full max-w-md sm:max-w-lg lg:max-w-xl">
          <Badge variant="brand-outline" className="absolute -top-12 left-0 sm:-top-14">
            {t.tech.label}
          </Badge>
          {t.tech.steps.map((step, i) => (
            <Card
              key={i}
              variant="glass"
              className={`tech-step tech-step-${i} absolute inset-0 flex flex-col justify-center p-6 sm:p-8 md:p-10 ${i > 0 ? "pointer-events-none opacity-0" : ""}`}
            >
              <SectionHeader
                eyebrow={`0${i + 1} / 0${STEP_COUNT}`}
                title={step.t}
                description={step.d}
              />
            </Card>
          ))}
        </div>

        <div className="absolute right-6 top-1/2 hidden -translate-y-1/2 flex-col gap-5 md:flex">
          {t.tech.steps.map((step, i) => (
            <span
              key={step.t}
              className={`tech-dot tech-dot-${i} block h-2 w-2 rounded-full ${i === 0 ? "scale-150 bg-brand-text" : "bg-brand-elevated"}`}
            />
          ))}
        </div>

        <div ref={progressRef} className="absolute inset-x-6 bottom-[calc(1.5rem+env(safe-area-inset-bottom))] mx-auto max-w-6xl md:bottom-10">
          <Progress value={0} className="h-px bg-brand-elevated [&>div]:bg-brand-text [&>div]:transition-none" />
        </div>
      </div>

      <div className="tech-scroll pointer-events-none absolute inset-x-0 bottom-[calc(100lvh_-_100dvh_+_5.5rem_+_env(safe-area-inset-bottom,0px))] z-10 flex flex-col items-center gap-2 font-mono text-[11px] font-medium uppercase tracking-[0.3em] text-brand-text [text-shadow:0_1px_6px_rgba(255,255,255,0.9)] md:bottom-28 isolate">
        <span className="select-none [text-shadow:0_1px_8px_rgba(255,255,255,0.9)]">{t.hero.scroll}</span>
        <span className="tech-scroll-line h-10 w-0.5 rounded-full bg-brand-text shadow-[0_0_8px_rgba(255,255,255,0.9)]" />
      </div>
    </section>
  );
}
