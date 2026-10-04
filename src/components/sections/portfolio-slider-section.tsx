"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SectionHeader } from "@/components/ui/section-header";
import { Heading, Text } from "@/components/ui/typography";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/components/providers/language-provider";

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

export interface SliderCardMetric {
  domIndex: number;
  origIndex: number;
  offsetLeft: number;
  offsetWidth: number;
  centerOffset: number;
}

export interface SliderTrackMetrics {
  trackWidth: number;
  setWidth: number;
  cards: SliderCardMetric[];
}

export function computeSliderMetrics(
  track: HTMLElement,
  cards: HTMLElement[],
  totalOriginal: number
): SliderTrackMetrics {
  const trackWidth = track.clientWidth;
  const metrics: SliderCardMetric[] = cards.map((card, domIndex) => {
    const offsetLeft = card.offsetLeft;
    const offsetWidth = card.offsetWidth;
    return {
      domIndex,
      origIndex: Number(card.dataset.origIndex || 0),
      offsetLeft,
      offsetWidth,
      centerOffset: offsetLeft + offsetWidth / 2,
    };
  });

  const firstCard = metrics[0];
  const middleCard = metrics[totalOriginal];
  const setWidth = firstCard && middleCard ? middleCard.offsetLeft - firstCard.offsetLeft : 0;

  return {
    trackWidth,
    setWidth,
    cards: metrics,
  };
}

export function PortfolioSliderSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const { t } = useLanguage();
  const [activeIndex, setActiveIndex] = useState(0);
  const activeIndexRef = useRef(0);
  activeIndexRef.current = activeIndex;

  const cases = t.port.cases;
  const total = cases.length;

  const slides = [
    ...cases.map((item, originalIndex) => ({ item, originalIndex, copyIndex: 0 })),
    ...cases.map((item, originalIndex) => ({ item, originalIndex, copyIndex: 1 })),
    ...cases.map((item, originalIndex) => ({ item, originalIndex, copyIndex: 2 })),
  ];

  const navigateRef = useRef<(step: number) => void>(() => {});
  const goToRef = useRef<(index: number) => void>(() => {});

  useEffect(() => {
    const track = trackRef.current;
    if (!track || total === 0) return;

    const cards = Array.from(track.querySelectorAll<HTMLElement>(".port-card"));
    if (cards.length === 0) return;

    let metrics = computeSliderMetrics(track, cards, total);
    let targetLeft = track.scrollLeft;
    let smoothRaf = 0;

    const checkWrap = () => {
      const { setWidth } = metrics;
      if (setWidth <= 0) return;

      if (track.scrollLeft < setWidth * 0.5) {
        track.scrollLeft += setWidth;
        targetLeft += setWidth;
      } else if (track.scrollLeft >= setWidth * 1.5) {
        track.scrollLeft -= setWidth;
        targetLeft -= setWidth;
      }
    };

    const updateActiveCard = () => {
      const currentCenter = track.scrollLeft + metrics.trackWidth / 2;
      let closestCard: HTMLElement | null = null;
      let closestOrig = 0;
      let minDiff = Infinity;

      metrics.cards.forEach((cardMetric) => {
        const diff = Math.abs(cardMetric.centerOffset - currentCenter);
        if (diff < minDiff) {
          minDiff = diff;
          closestCard = cards[cardMetric.domIndex] ?? null;
          closestOrig = cardMetric.origIndex;
        }
      });

      cards.forEach((card) => {
        const active = card === closestCard ? "true" : "false";
        if (card.dataset.active !== active) card.dataset.active = active;
      });

      setActiveIndex((prev) => (prev !== closestOrig ? closestOrig : prev));
    };

    const smoothScroll = () => {
      smoothRaf = 0;
      const diff = targetLeft - track.scrollLeft;
      if (Math.abs(diff) > 0.5) {
        track.scrollLeft += diff * 0.2;
        checkWrap();
        updateActiveCard();
        smoothRaf = requestAnimationFrame(smoothScroll);
      } else {
        track.scrollLeft = targetLeft;
        checkWrap();
        updateActiveCard();
      }
    };

    const getClosestCardIndex = () => {
      const currentCenter = track.scrollLeft + metrics.trackWidth / 2;
      let closestIndex = total;
      let minDiff = Infinity;
      metrics.cards.forEach((cardMetric) => {
        const diff = Math.abs(cardMetric.centerOffset - currentCenter);
        if (diff < minDiff) {
          minDiff = diff;
          closestIndex = cardMetric.domIndex;
        }
      });
      return closestIndex;
    };

    const scrollToDomIndex = (targetDomIndex: number) => {
      const boundedIndex = Math.max(0, Math.min(cards.length - 1, targetDomIndex));
      const targetMetric = metrics.cards[boundedIndex];
      if (!targetMetric) return;
      targetLeft = targetMetric.offsetLeft - (metrics.trackWidth - targetMetric.offsetWidth) / 2;
      if (smoothRaf) cancelAnimationFrame(smoothRaf);
      smoothRaf = requestAnimationFrame(smoothScroll);
    };

    navigateRef.current = (step: number) => {
      const current = getClosestCardIndex();
      scrollToDomIndex(current + step);
    };

    goToRef.current = (targetOrigIndex: number) => {
      const currentDom = getClosestCardIndex();
      const currentMetric = metrics.cards[currentDom];
      const currentOrig = currentMetric ? currentMetric.origIndex : 0;
      let diff = targetOrigIndex - currentOrig;
      if (diff > total / 2) diff -= total;
      if (diff < -total / 2) diff += total;
      scrollToDomIndex(currentDom + diff);
    };

    // Center Card 1 (first item of the middle set) initially
    const centerInitial = () => {
      const primaryFirstCard = metrics.cards[total];
      if (!primaryFirstCard) return;
      const initialOffset = primaryFirstCard.offsetLeft - (metrics.trackWidth - primaryFirstCard.offsetWidth) / 2;
      track.scrollLeft = initialOffset;
      targetLeft = initialOffset;
      updateActiveCard();
    };

    let isPointerDown = false;
    let startX = 0;
    let startScrollLeft = 0;
    let hasMoved = false;

    const onPointerDown = (e: PointerEvent) => {
      if (e.pointerType !== "mouse" || e.button !== 0) return;
      isPointerDown = true;
      hasMoved = false;
      startX = e.clientX;
      startScrollLeft = track.scrollLeft;
      if (smoothRaf) cancelAnimationFrame(smoothRaf);
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!isPointerDown) return;
      const dx = e.clientX - startX;
      if (Math.abs(dx) > 4) {
        hasMoved = true;
        track.scrollLeft = startScrollLeft - dx;
        targetLeft = track.scrollLeft;
      }
    };

    const onPointerUp = () => {
      isPointerDown = false;
    };

    const onClick = (e: MouseEvent) => {
      if (hasMoved) {
        hasMoved = false;
        return;
      }
      const targetCard = (e.target as HTMLElement).closest<HTMLElement>(".port-card");
      if (targetCard) {
        const idx = cards.indexOf(targetCard);
        if (idx !== -1) scrollToDomIndex(idx);
      }
    };

    const onScroll = () => {
      if (!smoothRaf) {
        checkWrap();
        updateActiveCard();
      }
    };

    let lastWidth = typeof window !== "undefined" ? window.innerWidth : 0;
    const onResize = () => {
      if (window.innerWidth === lastWidth) return;
      lastWidth = window.innerWidth;
      metrics = computeSliderMetrics(track, cards, total);
      const activeCardDom = cards.find(
        (c, idx) => Number(c.dataset.origIndex) === activeIndexRef.current && idx >= total && idx < total * 2
      ) || cards[total];
      if (activeCardDom) {
        const offset = activeCardDom.offsetLeft - (metrics.trackWidth - activeCardDom.offsetWidth) / 2;
        track.scrollLeft = offset;
        targetLeft = offset;
      }
    };

    track.addEventListener("scroll", onScroll, { passive: true });
    track.addEventListener("click", onClick);
    track.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("resize", onResize);

    centerInitial();

    return () => {
      if (smoothRaf) cancelAnimationFrame(smoothRaf);
      track.removeEventListener("scroll", onScroll);
      track.removeEventListener("click", onClick);
      track.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("resize", onResize);
    };
  }, [total]);

  return (
    <section ref={containerRef} id="works" className="relative flex h-dvh flex-col justify-between overflow-hidden bg-brand-bg pt-[calc(1.5rem+env(safe-area-inset-top,0px))] sm:pt-[calc(2rem+env(safe-area-inset-top,0px))] md:pt-20 lg:pt-24 pb-[calc(1.25rem+env(safe-area-inset-bottom,0px))] md:pb-6">
      <div className="mx-auto flex w-full max-w-6xl shrink-0 items-end justify-between px-6 mb-3 sm:mb-4">
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
              onClick={() => navigateRef.current(-1)}
              aria-label="Previous card"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="icon-glass"
              onClick={() => navigateRef.current(1)}
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
        className="flex min-h-0 flex-1 w-full items-stretch gap-6 overflow-x-auto overflow-y-hidden px-[12vw] py-2 [scrollbar-width:none] sm:gap-8 [&::-webkit-scrollbar]:hidden"
        style={{
          WebkitOverflowScrolling: "touch",
          touchAction: "pan-x pan-y",
        }}
      >
        {slides.map(({ item, originalIndex, copyIndex }) => (
          <Card
            key={`${item.t}-${copyIndex}-${originalIndex}`}
            data-orig-index={originalIndex}
            variant="surface"
            className="port-card group relative h-full w-[76vw] sm:w-[54vw] md:w-[40vw] lg:w-[32vw] max-w-[460px] shrink-0 cursor-pointer select-none shadow-lg hover:shadow-2xl data-[active=true]:shadow-2xl"
          >
            <div className="pointer-events-none select-none absolute inset-0 overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={IMAGES[originalIndex % IMAGES.length]}
                alt={item.t}
                draggable={false}
                className="port-img pointer-events-none select-none absolute inset-y-0 -left-[8%] h-full w-[116%] max-w-none object-cover grayscale group-hover:scale-105 group-hover:grayscale-0 group-data-[active=true]:scale-105 group-data-[active=true]:grayscale-0"
              />
            </div>
            <div className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-t from-brand-text/70 via-transparent to-transparent" />
            <div className="absolute left-5 top-5 z-10 flex gap-2">
              <Badge
                variant="glass-subtle"
                className="opacity-100 transition-opacity duration-500 group-hover:opacity-0 group-data-[active=true]:opacity-0"
              >
                {t.port.before}
              </Badge>
              <Badge
                variant="pill-dark"
                className="absolute left-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100 group-data-[active=true]:opacity-100"
              >
                {t.port.healed}
              </Badge>
            </div>
            <div className="absolute inset-x-0 bottom-0 z-10 p-5 md:p-6 lg:p-7 text-white">
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

      <div className="mx-auto flex w-full max-w-6xl shrink-0 items-center justify-center gap-1.5 pt-3">
        {cases.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => goToRef.current(i)}
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
