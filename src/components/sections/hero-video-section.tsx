"use client";

import { useRef } from "react";
import { gsap, useGSAP, prefersReducedMotion } from "@/lib/gsap";
import { createFrameScrub } from "@/lib/frame-scrub";
import { isMobileWidth } from "@/hooks/use-breakpoint";
import { useScrollTo } from "@/hooks/use-scroll-to";
import { useLanguage } from "@/components/providers/language-provider";
import { Button } from "@/components/ui/button";
import { MobileHeroNav } from "@/components/layout/mobile-nav";
import { HERO_SLIDE_RANGES, calculateSlideTransform } from "./hero-video-utils";
import { HeroSlide } from "./hero-slide";
import { HeroBackgroundEffects } from "./hero-background-effects";

export function HeroVideoSection(): React.JSX.Element {
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
          HERO_SLIDE_RANGES.forEach((range, i) => {
            const state = calculateSlideTransform(p, range);
            gsap.set(`.hero-slide-${i}`, {
              opacity: state.opacity,
              yPercent: state.yPercent,
              scale: state.scale,
              pointerEvents: state.pointerEvents,
              force3D: true,
            });
          });
          gsap.set(".hero-scroll", { opacity: 1, pointerEvents: "auto" });
        },
      });

      return () => handle.destroy();
    },
    { scope: containerRef }
  );

  return (
    <section
      ref={containerRef}
      id="hero"
      className="relative h-[100lvh] min-h-[100lvh] w-full overflow-hidden bg-brand-bg isolate"
    >
      <HeroBackgroundEffects canvasRef={canvasRef} scrollLabel={t.hero.scroll} />

      <HeroSlide
        index={0}
        as="h1"
        badgeSrc="/images/logo.png"
        title={slides[0].title}
        isAccentWord={(i) => i !== 1}
      >
        <div className="mt-8 flex flex-col items-center gap-4 sm:mt-10">
          <MobileHeroNav className="hero-cta" />

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              size="lg"
              variant="brand-primary"
              onClick={() => scrollToId("booking")}
              className="hero-cta px-8 hover:-translate-y-0.5"
            >
              {t.hero.cta1}
            </Button>
            <Button
              size="lg"
              variant="brand-glass"
              onClick={() => scrollToId("works")}
              className="hero-cta px-8 hover:-translate-y-0.5"
            >
              {t.hero.cta2}
            </Button>
          </div>
        </div>
      </HeroSlide>

      {slides[1] && (
        <HeroSlide
          index={1}
          title={slides[1].title}
          isAccentWord={(i) => i !== 0}
        />
      )}

      {slides[2] && (
        <HeroSlide
          index={2}
          title={slides[2].title}
          isAccentWord={(i) => i !== 0}
          headingClassName="translate-y-[4.5rem] sm:translate-y-[5.5rem] md:-translate-y-36 lg:-translate-y-40"
        />
      )}
    </section>
  );
}
