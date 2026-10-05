"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { createFrameScrub } from "@/lib/frame-scrub";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Heading } from "@/components/ui/typography";
import { MobileHeroNav } from "@/components/layout/navbar";
import { useLanguage } from "@/components/providers/language-provider";
import { isMobileWidth } from "@/hooks/use-breakpoint";
import { useScrollTo } from "@/hooks/use-scroll-to";

function smoothstep(min: number, max: number, value: number) {
  const x = Math.max(0, Math.min(1, (value - min) / (max - min)));
  return x * x * (3 - 2 * x);
}

function getSlideTransform(
  p: number,
  enterStart: number,
  enterEnd: number,
  exitStart: number,
  exitEnd: number
) {
  if (enterStart >= 0 && p < enterStart) {
    return { opacity: 0, yPercent: 30, pointerEvents: "none" as const };
  }
  if (enterStart >= 0 && p <= enterEnd) {
    const progress = smoothstep(enterStart, enterEnd, p);
    return {
      opacity: progress,
      yPercent: (1 - progress) * 30,
      pointerEvents: progress > 0.5 ? ("auto" as const) : ("none" as const),
    };
  }
  if (exitStart > 1.0 || p < exitStart) {
    return { opacity: 1, yPercent: 0, pointerEvents: "auto" as const };
  }
  if (exitStart <= 1.0 && p <= exitEnd) {
    const progress = smoothstep(exitStart, exitEnd, p);
    const opacity = 1 - progress;
    return {
      opacity,
      yPercent: -progress * 30,
      pointerEvents: opacity > 0.1 ? ("auto" as const) : ("none" as const),
    };
  }
  return { opacity: 0, yPercent: -30, pointerEvents: "none" as const };
}

export function HeroVideoSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { t } = useLanguage();
  const { scrollToId } = useScrollTo();
  const slides = t.hero.slides || [
    { badge: t.hero.badge, title: t.hero.title, sub: t.hero.sub },
  ];

  useGSAP(
    () => {
      const intro = gsap.timeline({ defaults: { ease: "power3.out" } });
      intro
        .from(".hero-badge", { y: 20, opacity: 0, duration: 0.8, delay: 0.4 })
        .from(".hero-word", { yPercent: 110, opacity: 0, duration: 1.1, stagger: 0.08 }, "-=0.4")
        .from(".hero-cta", { y: 24, opacity: 0, duration: 0.8, stagger: 0.12 }, "-=0.6");
    },
    { scope: containerRef }
  );

  useGSAP(
    () => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return;

      const handle = createFrameScrub({
        canvas,
        trigger: container,
        frameCount: 240,
        framesPath: "/videos/Banner.1/frames",
        distance: () => (isMobileWidth() ? 1600 : 2600),
        onProgress: (p) => {
          const s0 = getSlideTransform(p, -1, -1, 0.15, 0.35);
          const s1 = getSlideTransform(p, 0.15, 0.35, 0.65, 0.85);
          const s2 = getSlideTransform(p, 0.65, 0.85, 1.05, 1.05);

          gsap.set(".hero-slide-0", { opacity: s0.opacity, yPercent: s0.yPercent, pointerEvents: s0.pointerEvents, force3D: true });
          gsap.set(".hero-slide-1", { opacity: s1.opacity, yPercent: s1.yPercent, pointerEvents: s1.pointerEvents, force3D: true });
          gsap.set(".hero-slide-2", { opacity: s2.opacity, yPercent: s2.yPercent, pointerEvents: s2.pointerEvents, force3D: true });
          gsap.set(".hero-scroll", { opacity: Math.max(0, 1 - p * 12) });
        },
      });

      return () => handle.destroy();
    },
    { scope: containerRef }
  );

  const goTo = (id: string) => {
    scrollToId(id);
  };

  return (
    <section ref={containerRef} id="hero" className="relative h-svh min-h-svh w-full overflow-hidden bg-brand-bg">
      <canvas ref={canvasRef} className="hero-video absolute inset-0 h-full w-full" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-brand-bg/85 via-brand-bg/40 to-transparent" />

      {/* Slide 1 (Initial / Branding / CTAs) */}
      <div className="hero-slide hero-slide-0 absolute inset-0 z-10 mx-auto flex h-full max-w-5xl flex-col items-center justify-start px-6 safe-offset-mobile md:justify-center text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/logo.png"
          alt="NAMI STUDIO"
          className="hero-badge mb-8 h-7 w-auto object-contain sm:h-8"
        />

        <Heading
          as="h1"
          size="display"
          className="min-h-[144px] md:min-h-0 [filter:drop-shadow(0_0_10px_rgba(248,249,251,0.9))] md:[filter:drop-shadow(0_0_12px_rgba(248,249,251,0.95))_drop-shadow(0_0_32px_rgba(248,249,251,0.85))]"
        >
          {slides[0].title.split(" ").map((word, i) => (
            <span key={`${word}-${i}`} className="mr-[0.25em] inline-block overflow-hidden align-bottom">
              <span className="hero-word inline-block">{word}</span>
            </span>
          ))}
        </Heading>

        <div className="mt-8 flex flex-col items-center gap-4 sm:mt-10">
          <MobileHeroNav className="hero-cta" />

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              size="lg"
              variant="brand-primary"
              onClick={() => goTo("booking")}
              className="hero-cta px-8 hover:-translate-y-0.5"
            >
              {t.hero.cta1}
            </Button>
            <Button
              size="lg"
              variant="brand-glass"
              onClick={() => goTo("works")}
              className="hero-cta px-8 hover:-translate-y-0.5"
            >
              {t.hero.cta2}
            </Button>
          </div>
        </div>
      </div>

      {/* Slide 2 (Craftsmanship & Precision) */}
      {slides[1] && (
        <div className="hero-slide hero-slide-1 pointer-events-none absolute inset-0 z-10 mx-auto flex h-full max-w-5xl flex-col items-center justify-start px-6 safe-offset-mobile md:justify-center text-center opacity-0">
          <Badge variant="glass" className="mb-8">
            {slides[1].badge}
          </Badge>

          <Heading
            as="h2"
            size="display"
            className="[filter:drop-shadow(0_0_10px_rgba(248,249,251,0.9))] md:[filter:drop-shadow(0_0_12px_rgba(248,249,251,0.95))_drop-shadow(0_0_32px_rgba(248,249,251,0.85))]"
          >
            {slides[1].title}
          </Heading>
        </div>
      )}

      {/* Slide 3 (Longevity & Natural Aesthetics - Badge only) */}
      {slides[2] && (
        <div className="hero-slide hero-slide-2 pointer-events-none absolute inset-0 z-10 mx-auto flex h-full max-w-5xl flex-col items-center justify-start px-6 safe-offset-mobile md:justify-center text-center opacity-0">
          <Badge
            variant="glass"
            className="-translate-y-6 sm:-translate-y-24 md:-translate-y-32"
          >
            {slides[2].badge}
          </Badge>
        </div>
      )}
      <div className="hero-scroll pointer-events-none absolute inset-x-0 bottom-[calc(8.5rem+env(safe-area-inset-bottom))] z-10 flex flex-col items-center gap-2 font-mono text-[11px] font-medium uppercase tracking-[0.3em] text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.85)] animate-pulse md:bottom-36 lg:bottom-40">
        <span className="select-none [text-shadow:0_1px_8px_rgba(0,0,0,0.8)]">{t.hero.scroll}</span>
        <span className="h-10 w-0.5 rounded-full bg-white/95 shadow-[0_0_8px_rgba(255,255,255,0.7)]" />
      </div>
    </section>
  );
}
