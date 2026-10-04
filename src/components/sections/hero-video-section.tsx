"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { createFrameScrub } from "@/lib/frame-scrub";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MobileHeroNav } from "@/components/layout/navbar";
import { useLanguage } from "@/components/providers/language-provider";
import { useLenis } from "@/components/providers/smooth-scroll-provider";

function getSlideTransform(
  p: number,
  enterStart: number,
  enterEnd: number,
  exitStart: number,
  exitEnd: number
) {
  if (enterStart >= 0 && p < enterStart) {
    return { opacity: 0, yPercent: 35, pointerEvents: "none" as const };
  }
  if (enterStart >= 0 && p <= enterEnd) {
    const progress = (p - enterStart) / (enterEnd - enterStart);
    return {
      opacity: progress,
      yPercent: (1 - progress) * 35,
      pointerEvents: progress > 0.5 ? ("auto" as const) : ("none" as const),
    };
  }
  if (p < exitStart) {
    return { opacity: 1, yPercent: 0, pointerEvents: "auto" as const };
  }
  if (exitStart <= 1.0 && p <= exitEnd) {
    const progress = (p - exitStart) / (exitEnd - exitStart);
    const opacity = 1 - progress;
    return {
      opacity,
      yPercent: -progress * 35,
      pointerEvents: opacity > 0.1 ? ("auto" as const) : ("none" as const),
    };
  }
  return { opacity: 0, yPercent: -35, pointerEvents: "none" as const };
}

export function HeroVideoSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { t } = useLanguage();
  const lenis = useLenis();
  const slides = t.hero.slides || [
    { badge: t.hero.badge, title: t.hero.title, sub: t.hero.sub },
  ];

  useGSAP(
    () => {
      const intro = gsap.timeline({ defaults: { ease: "power3.out" } });
      intro
        .from(".hero-badge", { y: 20, opacity: 0, duration: 0.8, delay: 0.4 })
        .from(".hero-word", { yPercent: 110, opacity: 0, duration: 1.1, stagger: 0.08 }, "-=0.4")
        .from(".hero-sub", { y: 24, opacity: 0, duration: 0.9 }, "-=0.6")
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
        distance: () => (window.innerWidth < 768 ? 1600 : 2600),
        onProgress: (p) => {
          const s0 = getSlideTransform(p, -1, -1, 0.14, 0.38);
          const s1 = getSlideTransform(p, 0.22, 0.42, 0.58, 0.78);
          const s2 = getSlideTransform(p, 0.62, 0.82, 1.05, 1.05);

          gsap.set(".hero-slide-0", { opacity: s0.opacity, yPercent: s0.yPercent, pointerEvents: s0.pointerEvents });
          gsap.set(".hero-slide-1", { opacity: s1.opacity, yPercent: s1.yPercent });
          gsap.set(".hero-slide-2", { opacity: s2.opacity, yPercent: s2.yPercent });
          gsap.set(".hero-video", { scale: 1 + p * 0.12 });
          gsap.set(".hero-scroll", { opacity: Math.max(0, 1 - p * 12) });
        },
      });

      return () => handle.destroy();
    },
    { scope: containerRef, dependencies: [t], revertOnUpdate: true }
  );

  const goTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) lenis?.scrollTo(el, { duration: 1.6 });
  };

  return (
    <section ref={containerRef} id="hero" className="relative h-dvh min-h-dvh w-full overflow-hidden bg-brand-bg">
      <canvas ref={canvasRef} className="hero-video absolute inset-0 h-full w-full" />
      <div className="absolute inset-0 bg-gradient-to-b from-brand-bg/80 via-brand-bg/30 to-brand-bg/90" />

      {/* Slide 1 (Initial / Branding / CTAs) */}
      <div className="hero-slide hero-slide-0 absolute inset-0 z-10 mx-auto flex h-full max-w-5xl flex-col items-center justify-start px-6 safe-offset-mobile md:justify-center text-center">
        <Badge className="hero-badge mb-8 rounded-full border border-brand-border/40 bg-white/60 px-4 py-1.5 font-mono text-[11px] font-normal uppercase tracking-[0.25em] text-brand-text backdrop-blur-md hover:bg-white/60">
          {slides[0].badge}
        </Badge>

        <h1 className="font-heading text-4xl font-extrabold leading-[1.05] tracking-tight text-brand-text sm:text-6xl lg:text-7xl">
          {slides[0].title.split(" ").map((word, i) => (
            <span key={`${word}-${i}`} className="mr-[0.25em] inline-block overflow-hidden align-bottom">
              <span className="hero-word inline-block">{word}</span>
            </span>
          ))}
        </h1>

        <p className="hero-sub mt-6 max-w-xl text-base text-brand-text/70 sm:text-lg">{slides[0].sub}</p>

        <div className="mt-8 flex flex-col items-center gap-4 sm:mt-10">
          <MobileHeroNav className="hero-cta" />

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              size="lg"
              onClick={() => goTo("booking")}
              className="hero-cta rounded-full bg-brand-text px-8 text-white transition-transform hover:-translate-y-0.5 hover:bg-brand-text/85"
            >
              {t.hero.cta1}
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => goTo("works")}
              className="hero-cta rounded-full border-brand-border/50 bg-white/50 px-8 text-brand-text backdrop-blur-md transition-transform hover:-translate-y-0.5 hover:bg-white/80"
            >
              {t.hero.cta2}
            </Button>
          </div>
        </div>
      </div>

      {/* Slide 2 (Craftsmanship & Precision) */}
      {slides[1] && (
        <div className="hero-slide hero-slide-1 pointer-events-none absolute inset-0 z-10 mx-auto flex h-full max-w-5xl flex-col items-center justify-start px-6 safe-offset-mobile md:justify-center text-center opacity-0">
          <Badge className="mb-8 rounded-full border border-brand-border/40 bg-white/60 px-4 py-1.5 font-mono text-[11px] font-normal uppercase tracking-[0.25em] text-brand-text backdrop-blur-md hover:bg-white/60">
            {slides[1].badge}
          </Badge>

          <h2 className="font-heading text-4xl font-extrabold leading-[1.05] tracking-tight text-brand-text sm:text-6xl lg:text-7xl">
            {slides[1].title}
          </h2>

          <p className="mt-6 max-w-xl text-base text-brand-text/70 sm:text-lg">{slides[1].sub}</p>
        </div>
      )}

      {/* Slide 3 (Longevity & Natural Aesthetics) */}
      {slides[2] && (
        <div className="hero-slide hero-slide-2 pointer-events-none absolute inset-0 z-10 mx-auto flex h-full max-w-5xl flex-col items-center justify-start px-6 safe-offset-mobile md:justify-center text-center opacity-0">
          <Badge className="mb-8 rounded-full border border-brand-border/40 bg-white/60 px-4 py-1.5 font-mono text-[11px] font-normal uppercase tracking-[0.25em] text-brand-text backdrop-blur-md hover:bg-white/60">
            {slides[2].badge}
          </Badge>

          <h2 className="font-heading text-4xl font-extrabold leading-[1.05] tracking-tight text-brand-text sm:text-6xl lg:text-7xl">
            {slides[2].title}
          </h2>

          <p className="mt-6 max-w-xl text-base text-brand-text/70 sm:text-lg">{slides[2].sub}</p>
        </div>
      )}

      <div className="hero-scroll absolute inset-x-0 bottom-[calc(2rem+env(safe-area-inset-bottom))] z-10 flex flex-col items-center gap-2 font-mono text-[10px] uppercase tracking-[0.3em] text-brand-border">
        {t.hero.scroll}
        <span className="h-10 w-px animate-pulse bg-brand-border" />
      </div>
    </section>
  );
}
