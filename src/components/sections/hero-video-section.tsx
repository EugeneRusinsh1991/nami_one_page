"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { createFrameScrub } from "@/lib/frame-scrub";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MobileHeroNav } from "@/components/layout/navbar";
import { useLanguage } from "@/components/providers/language-provider";
import { useLenis } from "@/components/providers/smooth-scroll-provider";

export function HeroVideoSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { t } = useLanguage();
  const lenis = useLenis();

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
        frameCount: 470,
        framesPath: "/videos/exploded view/frames",
        distance: () => (window.innerWidth < 768 ? 1400 : 2200),
        snap: {
          snapTo: (value: number) => {
            if (value >= 0.85) return 1.0;
            if (value <= 0.15) return 0.0;
            return value;
          },
          duration: { min: 0.2, max: 0.4 },
          delay: 0.05,
          ease: "power2.out",
          inertia: false,
        },
        onProgress: (p) => {
          gsap.set(".hero-content", { yPercent: -p * 25, opacity: 1 - Math.min(1, p * 2.2) });
          gsap.set(".hero-video", { scale: 1 + p * 0.12 });
          gsap.set(".hero-scroll", { opacity: 1 - Math.min(1, p * 8) });
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
    <section ref={containerRef} id="hero" className="relative h-screen min-h-[100dvh] w-full overflow-hidden bg-brand-bg">
      <canvas ref={canvasRef} className="hero-video absolute inset-0 h-full w-full" />
      <div className="absolute inset-0 bg-gradient-to-b from-brand-bg/80 via-brand-bg/30 to-brand-bg/90" />

      <div className="hero-content relative z-10 mx-auto flex h-full max-w-5xl flex-col items-center justify-center px-6 text-center">
        <Badge className="hero-badge mb-8 rounded-full border border-brand-border/40 bg-white/60 px-4 py-1.5 font-mono text-[11px] font-normal uppercase tracking-[0.25em] text-brand-text backdrop-blur-md hover:bg-white/60">
          {t.hero.badge}
        </Badge>

        <h1 className="font-heading text-4xl font-extrabold leading-[1.05] tracking-tight text-brand-text sm:text-6xl lg:text-7xl">
          {t.hero.title.split(" ").map((word, i) => (
            <span key={`${word}-${i}`} className="mr-[0.25em] inline-block overflow-hidden align-bottom">
              <span className="hero-word inline-block">{word}</span>
            </span>
          ))}
        </h1>

        <p className="hero-sub mt-6 max-w-xl text-base text-brand-text/70 sm:text-lg">{t.hero.sub}</p>

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

      <div className="hero-scroll absolute inset-x-0 bottom-8 z-10 flex flex-col items-center gap-2 font-mono text-[10px] uppercase tracking-[0.3em] text-brand-border">
        {t.hero.scroll}
        <span className="h-10 w-px animate-pulse bg-brand-border" />
      </div>
    </section>
  );
}
