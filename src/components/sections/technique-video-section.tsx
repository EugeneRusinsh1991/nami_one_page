"use client";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { SectionHeader } from "@/components/ui/section-header";
import { useLanguage } from "@/components/providers/language-provider";
import { STEP_COUNT } from "./technique-video-math";
import { useTechniqueVideo } from "./use-technique-video";

export {
  calculateStepTransformState,
  type StepTransformState,
} from "./technique-video-math";

export function TechniqueVideoSection() {
  const { containerRef, canvasRef, progressRef } = useTechniqueVideo();
  const { t } = useLanguage();

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
