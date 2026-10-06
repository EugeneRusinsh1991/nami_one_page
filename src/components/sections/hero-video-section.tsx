"use client";

import { useRef } from "react";
import { gsap, useGSAP, prefersReducedMotion } from "@/lib/gsap";
import { createFrameScrub } from "@/lib/frame-scrub";
import { getActiveScreenHeight } from "@/lib/scroll-topology";
import { useScrollTo } from "@/hooks/use-scroll-to";
import { useLanguage } from "@/components/providers/language-provider";
import { Button } from "@/components/ui/button";
import { MobileHeroNav } from "@/components/layout/mobile-nav";
import { calculateSlotFocus } from "./hero-video-utils";
import { HeroSlide } from "./hero-slide";
import { HeroBackgroundEffects } from "./hero-background-effects";
import { StoryStageSection } from "./story-stage-section";

export function HeroVideoSection(): React.JSX.Element {
  const containerRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { t } = useLanguage();
  const { scrollToId } = useScrollTo();
  const slides = t.hero.slides || [
    { badge: t.hero.badge, title: t.hero.title, sub: t.hero.sub },
  ];

  const heroSlots: React.ReactNode[] = [
    <HeroSlide
      key={0}
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
    </HeroSlide>,
  ];

  if (slides[1]) {
    heroSlots.push(
      <HeroSlide
        key={1}
        index={1}
        title={slides[1].title}
        isAccentWord={(i) => i !== 0}
      />
    );
  }

  if (slides[2]) {
    heroSlots.push(
      <HeroSlide
        key={2}
        index={2}
        title={slides[2].title}
        isAccentWord={(i) => i !== 0}
      />
    );
  }

  const slideCount = heroSlots.length;

  useGSAP(
    () => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return;

      const reducedMotion = prefersReducedMotion();

      let frame1Ready = false;
      let minBufferPassed = false;
      let revealed = false;

      let intro: gsap.core.Timeline | null = null;
      if (!reducedMotion) {
        gsap.set(canvas, { opacity: 0, scale: 1.05 });
        intro = gsap.timeline({ paused: true, defaults: { ease: "power3.out" } });
        intro
          .to(canvas, { opacity: 1, scale: 1, duration: 1.8, ease: "power2.out" })
          .fromTo(
            ".hero-slide-0 .hero-halo",
            { opacity: 0, scale: 0.65 },
            { opacity: 1, scale: 1, duration: 1.4, ease: "power2.out" },
            0.4
          )
          .from(
            ".hero-badge",
            { y: 16, opacity: 0, scale: 0.92, duration: 0.9, ease: "power2.out" },
            0.6
          )
          .from(
            ".hero-word",
            { yPercent: 115, opacity: 0, duration: 1.2, stagger: 0.08, ease: "power3.out" },
            "-=0.6"
          )
          .from(
            ".hero-cta",
            { y: 20, opacity: 0, duration: 0.85, stagger: 0.12, ease: "power3.out" },
            "-=0.55"
          );
      }

      const checkReveal = (force = false) => {
        if (revealed) return;
        if (force || (minBufferPassed && frame1Ready)) {
          revealed = true;
          if (reducedMotion) {
            gsap.set(canvas, { opacity: 1, scale: 1 });
          } else {
            intro?.play();
          }
        }
      };

      const bufferTimer = setTimeout(() => {
        minBufferPassed = true;
        checkReveal();
      }, 250);

      const fallbackTimer = setTimeout(() => {
        checkReveal(true);
      }, 1200);

      const applySlotFocus = (p: number) => {
        for (let i = 0; i < slideCount; i++) {
          const s = calculateSlotFocus(i, slideCount, p);
          gsap.set(`.hero-slide-${i}`, {
            opacity: s.opacity,
            pointerEvents: s.pointerEvents,
            force3D: true,
          });
        }
        gsap.set(".hero-scroll", { opacity: 1, pointerEvents: "auto" });
      };

      const handle = createFrameScrub({
        canvas,
        trigger: container,
        frameCount: 120,
        framesPath: "/videos/Banner.1/frames",
        pin: false,
        verticalAlign: typeof window !== "undefined" && window.innerWidth < 768 ? "top" : "center",
        distance: () => (slideCount - 1) * getActiveScreenHeight(),
        onFirstFrame: () => {
          frame1Ready = true;
          checkReveal();
        },
        onScrollProgress: applySlotFocus,
      });

      return () => {
        clearTimeout(bufferTimer);
        clearTimeout(fallbackTimer);
        intro?.kill();
        handle.destroy();
      };
    },
    { scope: containerRef }
  );

  return (
    <StoryStageSection
      id="hero"
      sectionRef={containerRef}
      className="bg-brand-bg"
      stage={
        <HeroBackgroundEffects
          canvasRef={canvasRef}
          scrollLabel={t.hero.scroll}
        />
      }
      slots={heroSlots}
    />
  );
}
