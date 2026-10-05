"use client";

import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, MASTER_CARD_CONFIG } from "@/components/ui/card";
import { SectionHeader } from "@/components/ui/section-header";
import { Heading, Text } from "@/components/ui/typography";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/components/providers/language-provider";
import {
  IMAGES,
  computeSliderMetrics,
  type SliderCardMetric,
  type SliderTrackMetrics,
} from "./portfolio-slider-utils";
import { usePortfolioSlider } from "./use-portfolio-slider";

export type { SliderCardMetric, SliderTrackMetrics };
export { computeSliderMetrics, IMAGES };

export function PortfolioSliderSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { t } = useLanguage();

  const cases = t.port.cases;
  const total = cases.length;

  const { trackRef, activeIndex, navigate, goTo } = usePortfolioSlider({ total });

  const slides = [
    ...cases.map((item, originalIndex) => ({ item, originalIndex, copyIndex: 0 })),
    ...cases.map((item, originalIndex) => ({ item, originalIndex, copyIndex: 1 })),
    ...cases.map((item, originalIndex) => ({ item, originalIndex, copyIndex: 2 })),
  ];

  return (
    <section
      ref={containerRef}
      id="works"
      className={cn(
        "relative flex h-svh flex-col justify-between overflow-hidden bg-brand-bg",
        MASTER_CARD_CONFIG.sectionPadding
      )}
    >
      <div className={cn("mx-auto flex w-full max-w-6xl shrink-0 items-end justify-between px-6", MASTER_CARD_CONFIG.headerMargin)}>
        <SectionHeader
          badge={t.port.label}
          title={t.port.title}
        />

        <div className="flex items-center gap-3">
          <span className="shrink-0 whitespace-nowrap font-mono text-xs tracking-widest text-brand-text/60">
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
          "flex min-h-0 flex-1 w-full items-stretch gap-4 sm:gap-6 md:gap-8 overflow-x-auto overflow-y-hidden px-[9vw] sm:px-[12vw] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden overscroll-x-contain",
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
            key={`${item.t}-${copyIndex}-${originalIndex}`}
            data-orig-index={originalIndex}
            variant="surface"
            className={cn(
              "port-card group relative cursor-pointer select-none shadow-lg hover:shadow-2xl data-[active=true]:shadow-2xl touch-pan-x touch-pan-y",
              MASTER_CARD_CONFIG.container
            )}
            style={{ touchAction: "pan-x pan-y" }}
          >
            <div className="pointer-events-none select-none absolute inset-0 overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={IMAGES[originalIndex % IMAGES.length]}
                alt={item.t}
                draggable={false}
                className="port-img pointer-events-none select-none absolute inset-y-0 -left-[8%] h-full w-[116%] max-w-none object-cover grayscale transition-[filter,transform] duration-500 group-hover:scale-105 group-hover:grayscale-0 group-data-[active=true]:scale-105 group-data-[active=true]:grayscale-0"
              />
            </div>
            <div className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-t from-brand-text/70 via-transparent to-transparent" />

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
          "mx-auto flex w-full max-w-6xl shrink-0 items-center justify-center gap-1.5",
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
