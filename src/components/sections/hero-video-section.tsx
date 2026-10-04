"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { createFrameScrub } from "@/lib/frame-scrub";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Heading } from "@/components/ui/typography";
import { MobileHeroNav } from "@/components/layout/navbar";
import { useLanguage } from "@/components/providers/language-provider";
import { useBreakpoint } from "@/hooks/use-breakpoint";
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
  const { isMobile } = useBreakpoint();
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
        distance: () => (isMobile ? 1600 : 2600),
        onProgress: (p) => {
          const s0 = getSlideTransform(p, -1, -1, 0.14, 0.38);
          const s1 = getSlideTransform(p, 0.22, 0.42, 0.58, 0.78);
          const s2 = getSlideTransform(p, 0.62, 0.82, 1.05, 1.05);

          gsap.set(".hero-slide-0", { opacity: s0.opacity, yPercent: s0.yPercent, pointerEvents: s0.pointerEvents, force3D: true });
          gsap.set(".hero-slide-1", { opacity: s1.opacity, yPercent: s1.yPercent, pointerEvents: s1.pointerEvents, force3D: true });
          gsap.set(".hero-slide-2", { opacity: s2.opacity, yPercent: s2.yPercent, pointerEvents: s2.pointerEvents, force3D: true });
          gsap.set(".hero-scroll", { opacity: Math.max(0, 1 - p * 12) });
        },
      });

      return () => handle.destroy();
    },
    { scope: containerRef, dependencies: [t, isMobile], revertOnUpdate: true }
  );

  const goTo = (id: string) => {
    scrollToId(id);
  };

  return (
    <section ref={containerRef} id="hero" className="relative h-dvh min-h-dvh w-full overflow-hidden bg-brand-bg">
      <canvas ref={canvasRef} className="hero-video absolute inset-0 h-full w-full" />
      <div className="absolute inset-0 bg-gradient-to-b from-brand-bg/80 via-brand-bg/30 to-brand-bg/90 will-change-[transform]" style={{ transform: 'translateZ(0)' }} />

      {/* Slide 1 (Initial / Branding / CTAs) */}
      <div className="hero-slide hero-slide-0 absolute inset-0 z-10 mx-auto flex h-full max-w-5xl flex-col items-center justify-start px-6 safe-offset-mobile md:justify-center text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/logo.png"
          alt="NAMI STUDIO"
          className="hero-badge mb-8 h-7 w-auto object-contain sm:h-8"
        />

        <Heading as="h1" size="display">
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

          <Heading as="h2" size="display">
            {slides[1].title}
          </Heading>
        </div>
      )}

      {/* Slide 3 (Longevity & Natural Aesthetics) */}
      {slides[2] && (
        <div className="hero-slide hero-slide-2 pointer-events-none absolute inset-0 z-10 mx-auto flex h-full max-w-5xl flex-col items-center justify-start px-6 safe-offset-mobile md:justify-center text-center opacity-0">
          <Badge variant="glass" className="mb-8">
            {slides[2].badge}
          </Badge>

          <Heading as="h2" size="display">
            {slides[2].title}
          </Heading>
        </div>
      )}

      <div className="hero-scroll absolute inset-x-0 bottom-[calc(2rem+env(safe-area-inset-bottom))] z-10 flex flex-col items-center gap-2 font-mono text-[10px] uppercase tracking-[0.3em] text-brand-border">
        {t.hero.scroll}
        <span className="h-10 w-px animate-pulse bg-brand-border" />
      </div>
    </section>
  );
}
