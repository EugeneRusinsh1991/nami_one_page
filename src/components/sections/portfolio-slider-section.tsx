"use client";

import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MASTER_CARD_CONFIG } from "@/components/sections/showcase/media-badge-card";
import { SectionHeader } from "@/components/ui/section-header";
import { Heading, Text } from "@/components/ui/typography";
import { gsap, useGSAP, revealOnScroll, prefersReducedMotion } from "@/lib/gsap";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/components/providers/language-provider";
import { usePortfolioSlider } from "./use-portfolio-slider";

const IMAGES = [
  "/images/image (2).png",
  "/images/image (3).png",
  "/images/image (2).png",
  "/images/image (4).png",
  "/images/image (3).png",
  "/images/image (4).png",
  "/images/image (2).png",
  "/images/image (3).png",
];

export function PortfolioSliderSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const isFirstRender = useRef(true);
  const { locale, t } = useLanguage();

  const cases = t.port.cases;
  const total = cases.length;

  const { trackRef, activeIndex, navigate, goTo } = usePortfolioSlider({ total, locale });

  useGSAP(
    () => {
      if (!containerRef.current) return;
      revealOnScroll(".port-head", containerRef.current, { y: 24 });
      revealOnScroll(".port-track", containerRef.current, { y: 40, delay: 0.15 });
      revealOnScroll(".port-dots", containerRef.current, { y: 16, delay: 0.3 });
    },
    { scope: containerRef }
  );

  useGSAP(
    () => {
      if (isFirstRender.current) {
        isFirstRender.current = false;
        return;
      }
      if (prefersReducedMotion()) return;

      gsap.fromTo(
        ".port-counter",
        { y: 6, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.4, ease: "power3.out" }
      );
    },
    { dependencies: [activeIndex], scope: containerRef }
  );

  const slides = [
    ...cases.map((item, originalIndex) => ({ item, originalIndex, copyIndex: 0 })),
    ...cases.map((item, originalIndex) => ({ item, originalIndex, copyIndex: 1 })),
    ...cases.map((item, originalIndex) => ({ item, originalIndex, copyIndex: 2 })),
  ];

  return (
    <section
      ref={containerRef}
      id="works"
      className="section-screen flex flex-col justify-between bg-brand-bg pt-[calc(1.25rem+var(--app-safe-top,0px))] sm:pt-[calc(2rem+var(--app-safe-top,0px))] md:pt-20 lg:pt-24 pb-[calc(1rem+var(--app-safe-bottom,0px))] sm:pb-4 md:pb-6"
    >
      <div className={cn("port-head mx-auto flex w-full max-w-6xl shrink-0 items-end justify-between gap-3 px-6 isolate", MASTER_CARD_CONFIG.headerMargin)}>
        <SectionHeader
          badge={t.port.label}
          title={t.port.title}
          className="min-w-0 flex-1 shrink pr-2 sm:pr-4"
          titleClassName="break-words"
        />

        <div className="flex shrink-0 items-center gap-3 self-end mb-1 lg:mb-0">
          <span className="port-counter shrink-0 whitespace-nowrap font-mono text-xs tracking-widest text-brand-text/60">
            {String(activeIndex + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
          </span>
          <div className="hidden items-center gap-1.5 lg:flex">
            <Button
              type="button"
              variant="icon-glass"
              onClick={() => navigate(-1)}
              aria-label="Previous card"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="icon-glass"
              onClick={() => navigate(1)}
              aria-label="Next card"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div
        ref={trackRef}
        data-lenis-prevent-horizontal="true"
        className={cn(
          "port-track isolate relative flex min-h-0 flex-1 w-full items-center gap-4 sm:gap-6 md:gap-8 overflow-x-auto overflow-y-hidden px-[9vw] sm:px-[12vw] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden overscroll-x-contain",
          MASTER_CARD_CONFIG.mediaPadding
        )}
        style={{
          WebkitOverflowScrolling: "touch",
          touchAction: "pan-x pan-y",
          overscrollBehaviorY: "auto",
        }}
      >
        {slides.map(({ item, originalIndex, copyIndex }) => (
          <Card
            key={`${copyIndex}-${originalIndex}`}
            data-orig-index={originalIndex}
            variant="surface"
            className={cn(
              "port-card group relative cursor-pointer select-none self-center snap-center opacity-60 shadow-lg data-[active=true]:opacity-100 data-[active=true]:border-brand-text/50 data-[active=true]:shadow-2xl data-[active=true]:ring-2 data-[active=true]:ring-brand-text/40 touch-pan-x touch-pan-y transition-[transform,opacity,box-shadow,border-color] duration-500 ease-out isolate transform-gpu",
              MASTER_CARD_CONFIG.container,
              "scale-[0.93] data-[active=true]:scale-100"
            )}
            style={{ touchAction: "pan-x pan-y" }}
          >
            <div className="pointer-events-none select-none absolute inset-0 overflow-hidden isolate">
              {/* Base grayscale image (static filter, no dynamic filter re-rasterization) */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={IMAGES[originalIndex % IMAGES.length]}
                alt={item.t}
                draggable={false}
                className="port-img pointer-events-none select-none absolute inset-y-0 -left-[8%] h-full w-[116%] max-w-none object-cover grayscale will-change-transform transform-gpu transition-transform duration-500 ease-out group-data-[active=true]:scale-105"
              />
              {/* Color image overlay (fades via GPU opacity transition without invalidating texture raster cache) */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={IMAGES[originalIndex % IMAGES.length]}
                alt=""
                aria-hidden="true"
                draggable={false}
                className="port-img-color pointer-events-none select-none absolute inset-y-0 -left-[8%] h-full w-[116%] max-w-none object-cover opacity-0 will-change-[transform,opacity] transform-gpu transition-[transform,opacity] duration-500 ease-out group-data-[active=true]:opacity-100 group-data-[active=true]:scale-105"
              />
            </div>
            <div className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-t from-brand-text/70 via-transparent to-transparent isolate" />

            <div className="absolute inset-x-0 bottom-0 z-10 p-4 sm:p-5 md:p-6 lg:p-7 text-white">
              <span className="font-mono text-xs tracking-widest text-white/60">{String(originalIndex + 1).padStart(2, "0")}</span>
              <Heading as="h3" size="h3" className="text-white md:text-2xl">
                {item.t}
              </Heading>
              <Text variant="subtle" className="text-white/75">
                {item.d}
              </Text>
            </div>
          </Card>
        ))}
      </div>

      <div
        className={cn(
          "port-dots mx-auto flex w-full max-w-6xl shrink-0 items-center justify-center gap-1.5 isolate",
          MASTER_CARD_CONFIG.bottomBarPadding
        )}
      >
        {cases.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => goTo(i)}
            aria-label={`Go to card ${i + 1}`}
            className={cn(
              "h-1.5 rounded-full transition-all duration-300",
              i === activeIndex ? "w-8 bg-brand-text" : "w-2 bg-brand-text/25 hover:bg-brand-text/50"
            )}
          />
        ))}
      </div>
    </section>
  );
}
