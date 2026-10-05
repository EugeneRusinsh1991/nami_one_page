"use client";

import { useRef } from "react";
import { gsap, useGSAP, prefersReducedMotion } from "@/lib/gsap";
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

const ACCENT_CLASS = " font-[family-name:var(--font-serif-accent)] font-semibold italic tracking-normal text-[1.16em] leading-[0.9]";

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
      if (prefersReducedMotion()) return;
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
      if (prefersReducedMotion()) return;
      gsap.fromTo(
        ".hero-scroll-line",
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

      const handle = createFrameScrub({
        canvas,
        trigger: container,
        frameCount: 120,
        framesPath: "/videos/Banner.1/frames",
        distance: () => (isMobileWidth() ? 1600 : 2600),
        onProgress: (p) => {
          const s0 = getSlideTransform(p, -1, -1, 0.10, 0.45);
          const s1 = getSlideTransform(p, 0.10, 0.45, 0.60, 0.95);
          const s2 = getSlideTransform(p, 0.60, 0.95, 1.05, 1.05);

          gsap.set(".hero-slide-0", {
            opacity: s0.opacity,
            yPercent: s0.yPercent,
            scale: 0.96 + 0.04 * s0.opacity,
            pointerEvents: s0.pointerEvents,
            force3D: true,
          });
          gsap.set(".hero-slide-1", {
            opacity: s1.opacity,
            yPercent: s1.yPercent,
            scale: 0.96 + 0.04 * s1.opacity,
            pointerEvents: s1.pointerEvents,
            force3D: true,
          });
          gsap.set(".hero-slide-2", {
            opacity: s2.opacity,
            yPercent: s2.yPercent,
            scale: 0.96 + 0.04 * s2.opacity,
            pointerEvents: s2.pointerEvents,
            force3D: true,
          });
          gsap.set(".hero-scroll", { opacity: s0.opacity });
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
    <section ref={containerRef} id="hero" className="relative h-svh min-h-svh w-full overflow-hidden bg-brand-bg isolate">
      <canvas
        ref={canvasRef}
        className="hero-video pointer-events-none absolute inset-0 h-full w-full will-change-transform transform-gpu"
        style={{
          transform: "translate3d(0, 0, 0)",
          filter: "contrast(1.04) brightness(1.02)",
        }}
      />

      {/* Smooth easing gradient + radial vignette */}
      <div
        className="pointer-events-none absolute inset-0 z-0 isolate"
        style={{
          background: [
            "radial-gradient(ellipse 75% 65% at 50% 50%, transparent 35%, rgba(248, 249, 251, 0.2) 70%, rgba(248, 249, 251, 0.5) 100%)",
            "linear-gradient(to bottom, rgba(248, 249, 251, 0.85) 0%, rgba(248, 249, 251, 0.55) 14%, rgba(248, 249, 251, 0.22) 28%, rgba(248, 249, 251, 0.06) 42%, transparent 52%)",
            "linear-gradient(to top, rgba(248, 249, 251, 0.35) 0%, transparent 12%)",
          ].join(", "),
        }}
      />

      {/* Procedural Film Grain for dithering & cinematic texture */}
      <svg
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0 h-full w-full opacity-[0.05] mix-blend-overlay will-change-transform transform-gpu"
      >
        <filter id="hero-grain">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.8"
            numOctaves="3"
            stitchTiles="stitch"
          />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#hero-grain)" />
      </svg>

      {/* Slide 1 (Initial / Branding / CTAs) */}
      <div className="hero-slide hero-slide-0 isolate will-change-transform transform-gpu absolute inset-0 z-10 mx-auto flex h-full max-w-5xl flex-col items-center justify-start px-6 safe-offset-mobile md:justify-center text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/logo.png"
          alt="NAMI STUDIO"
          className="hero-badge mb-8 h-7 w-auto object-contain sm:h-8"
        />

        <Heading
          as="h1"
          size="display"
          className="min-h-[144px] md:min-h-0 font-semibold tracking-[-0.025em] text-white [text-shadow:0_2px_16px_rgba(0,0,0,0.6)] relative before:pointer-events-none before:absolute before:-inset-x-[15%] before:-inset-y-[30%] before:-z-10 before:content-[''] before:bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0.65),transparent_72%)] before:blur-2xl"
        >
          {slides[0].title.split(" ").map((word, i) => (
            <span key={`${word}-${i}`} className="block overflow-hidden px-[0.1em] py-[0.05em]">
              <span className={`hero-word inline-block${i !== 1 ? ACCENT_CLASS : ""}`}>{word}</span>
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
        <div className="hero-slide hero-slide-1 pointer-events-none isolate will-change-transform transform-gpu absolute inset-0 z-10 mx-auto flex h-full max-w-5xl flex-col items-center justify-center px-6 pb-20 md:pb-0 text-center opacity-0">
          <Badge variant="glass" className="mb-6 md:mb-8">
            {slides[1].badge}
          </Badge>

          <Heading
            as="h2"
            size="display"
            className="font-semibold tracking-[-0.025em] text-white [text-shadow:0_2px_16px_rgba(0,0,0,0.6)] relative before:pointer-events-none before:absolute before:-inset-x-[15%] before:-inset-y-[30%] before:-z-10 before:content-[''] before:bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0.65),transparent_72%)] before:blur-2xl"
          >
            {slides[1].title.split(" ").map((word, i) => (
              <span key={`${word}-${i}`} className={`block${i !== 0 ? ACCENT_CLASS : ""}`}>{word}</span>
            ))}
          </Heading>
        </div>
      )}

      {/* Slide 3 (Longevity & Natural Aesthetics - Badge only) */}
      {slides[2] && (
        <div className="hero-slide hero-slide-2 pointer-events-none isolate will-change-transform transform-gpu absolute inset-0 z-10 mx-auto flex h-full max-w-5xl flex-col items-center justify-start px-6 safe-offset-mobile md:justify-center text-center opacity-0">
          <Badge
            variant="glass"
            className="translate-y-[5.5rem] md:-translate-y-32"
          >
            {slides[2].badge}
          </Badge>
        </div>
      )}
      <div className="hero-scroll pointer-events-none absolute inset-x-0 bottom-[calc(8.5rem+env(safe-area-inset-bottom))] z-10 flex flex-col items-center gap-2 font-mono text-[11px] font-medium uppercase tracking-[0.3em] text-white [text-shadow:0_2px_8px_rgba(0,0,0,0.85)] md:bottom-36 lg:bottom-40 isolate">
        <span className="select-none [text-shadow:0_1px_8px_rgba(0,0,0,0.8)]">{t.hero.scroll}</span>
        <span className="hero-scroll-line h-10 w-0.5 rounded-full bg-white/95 shadow-[0_0_8px_rgba(255,255,255,0.7)]" />
      </div>
    </section>
  );
}
