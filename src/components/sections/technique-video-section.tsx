"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { createFrameScrub } from "@/lib/frame-scrub";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useLanguage } from "@/components/providers/language-provider";

const STEP_COUNT = 3;

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

      gsap.set(".tech-step", { opacity: 0, y: 40 });
      let active = -1;

      const show = (index: number) => {
        if (index === active) return;
        gsap.to(".tech-step", { opacity: 0, y: -30, duration: 0.4, overwrite: true });
        gsap.to(`.tech-step-${index}`, { opacity: 1, y: 0, duration: 0.7, ease: "power3.out", overwrite: true, delay: 0.15 });
        gsap.to(".tech-dot", { scale: 1, backgroundColor: "#D5DAE0", duration: 0.3 });
        gsap.to(`.tech-dot-${index}`, { scale: 1.6, backgroundColor: "#1A1F25", duration: 0.3 });
        active = index;
      };

      const handle = createFrameScrub({
        canvas,
        trigger: container,
        frameCount: 470,
        framesPath: "/videos/exploded view/frames",
        distance: 3000,
        onProgress: (p) => {
          show(Math.min(STEP_COUNT - 1, Math.floor(p * STEP_COUNT)));
          const bar = progressRef.current?.firstElementChild as HTMLElement | null;
          if (bar) bar.style.transform = `translateX(-${100 - p * 100}%)`;
          gsap.set(".tech-video", { scale: 1.05 + p * 0.1 });
        },
      });

      return () => handle.destroy();
    },
    { scope: containerRef, dependencies: [t], revertOnUpdate: true }
  );

  return (
    <section ref={containerRef} id="technique" className="relative h-screen min-h-[100dvh] w-full overflow-hidden bg-brand-surface">
      <canvas ref={canvasRef} className="tech-video absolute inset-0 h-full w-full" />
      <div className="absolute inset-0 bg-gradient-to-r from-brand-bg/85 via-brand-bg/30 to-transparent" />

      <div className="relative z-10 mx-auto flex h-full max-w-6xl items-center px-6">
        <div className="relative h-72 w-full max-w-md">
          <Badge className="absolute -top-14 left-0 rounded-full border border-brand-border/40 bg-white/60 font-mono text-[11px] font-normal uppercase tracking-[0.25em] text-brand-text backdrop-blur-md hover:bg-white/60">
            {t.tech.label}
          </Badge>
          {t.tech.steps.map((step, i) => (
            <div
              key={step.t}
              className={`tech-step tech-step-${i} absolute inset-0 flex flex-col justify-center rounded-3xl border border-white/60 bg-white/55 p-8 shadow-xl backdrop-blur-xl`}
            >
              <span className="mb-3 font-mono text-xs tracking-widest text-brand-accent">0{i + 1} / 0{STEP_COUNT}</span>
              <h2 className="mb-3 font-heading text-3xl font-bold text-brand-text">{step.t}</h2>
              <p className="text-brand-text/70">{step.d}</p>
            </div>
          ))}
        </div>

        <div className="absolute right-6 top-1/2 hidden -translate-y-1/2 flex-col gap-5 md:flex">
          {t.tech.steps.map((step, i) => (
            <span key={step.t} className={`tech-dot tech-dot-${i} block h-2 w-2 rounded-full bg-brand-elevated`} />
          ))}
        </div>

        <div ref={progressRef} className="absolute inset-x-6 bottom-10 mx-auto max-w-6xl">
          <Progress value={0} className="h-px bg-brand-elevated [&>div]:bg-brand-text [&>div]:transition-none" />
        </div>
      </div>
    </section>
  );
}
