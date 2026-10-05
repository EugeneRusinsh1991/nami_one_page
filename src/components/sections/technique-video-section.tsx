"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { createFrameScrub } from "@/lib/frame-scrub";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { SectionHeader } from "@/components/ui/section-header";
import { useLanguage } from "@/components/providers/language-provider";
import { isMobileWidth } from "@/hooks/use-breakpoint";

const STEP_COUNT = 4;
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
  progress: number
): StepTransformState {
  if (totalSteps <= 1) {
    return { opacity: 1, y: 0, isActive: true };
  }

  const p = Math.max(0, Math.min(1, progress));
  const intervals = totalSteps - 1;
  const currentStep = Math.min(intervals, Math.max(0, Math.round(p * intervals)));
  const isActive = stepIndex === currentStep;

  const intervalSize = 1 / intervals;
  const fade = intervalSize * 0.4;
  const halfFade = fade / 2;

  const isFirst = stepIndex === 0;
  const isLast = stepIndex === intervals;

  const enterMid = (stepIndex - 0.5) / intervals;
  const enterStart = isFirst ? -1 : enterMid - halfFade;
  const enterEnd = isFirst ? -1 : enterMid + halfFade;

  const exitMid = (stepIndex + 0.5) / intervals;
  const exitStart = isLast ? 2 : exitMid - halfFade;
  const exitEnd = isLast ? 2 : exitMid + halfFade;

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
      };

      applyProgress(0);

      const handle = createFrameScrub({
        canvas,
        trigger: container,
        frameCount: 470,
        framesPath: "/videos/exploded view/frames",
        distance: () => (isMobileWidth() ? 1600 : 3000),
        onProgress: applyProgress,
      });

      return () => handle.destroy();
    },
    { scope: containerRef }
  );

  return (
    <section ref={containerRef} id="technique" className="relative h-svh min-h-svh w-full overflow-hidden bg-brand-surface">
      <canvas ref={canvasRef} className="tech-video absolute inset-0 h-full w-full" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-brand-bg/85 via-brand-bg/30 to-transparent" />

      <div className="relative z-10 mx-auto flex h-full max-w-6xl items-start px-6 safe-offset-mobile md:items-center">
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
    </section>
  );
}
