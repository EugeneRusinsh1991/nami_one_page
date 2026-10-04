"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
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

export function PortfolioSliderSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const { t } = useLanguage();
  const [activeIndex, setActiveIndex] = useState(0);

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

    let targetLeft = track.scrollLeft;
    let smoothRaf = 0;
    let dragging = false;
    let moved = false;
    let startX = 0;
    let startY = 0;
    let startTime = 0;
    let startLeft = 0;
    let pointerId = -1;
    let lockDirection: "horizontal" | "vertical" | null = null;

    const getSetWidth = () => {
      const first = cards[0];
      const middle = cards[total];
      if (!first || !middle) return 0;
      return middle.offsetLeft - first.offsetLeft;
    };

    const checkWrap = () => {
      const setWidth = getSetWidth();
      if (setWidth <= 0) return;

      if (track.scrollLeft < setWidth * 0.5) {
        track.scrollLeft += setWidth;
        targetLeft += setWidth;
        if (dragging) startLeft += setWidth;
      } else if (track.scrollLeft >= setWidth * 1.5) {
        track.scrollLeft -= setWidth;
        targetLeft -= setWidth;
        if (dragging) startLeft -= setWidth;
      }
    };

    const updateActiveCard = () => {
      const center = track.getBoundingClientRect().left + track.clientWidth / 2;
      let closest: HTMLElement | null = null;
      let closestOrig = 0;
      let minDiff = Infinity;

      cards.forEach((card) => {
        const rect = card.getBoundingClientRect();
        const diff = Math.abs(rect.left + rect.width / 2 - center);
        if (diff < minDiff) {
          minDiff = diff;
          closest = card;
          closestOrig = Number(card.dataset.origIndex || 0);
        }
      });

      cards.forEach((card) => {
        const active = card === closest ? "true" : "false";
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
      const center = track.getBoundingClientRect().left + track.clientWidth / 2;
      let closestIndex = total;
      let minDiff = Infinity;
      cards.forEach((card, idx) => {
        const rect = card.getBoundingClientRect();
        const diff = Math.abs(rect.left + rect.width / 2 - center);
        if (diff < minDiff) {
          minDiff = diff;
          closestIndex = idx;
        }
      });
      return closestIndex;
    };

    const scrollToDomIndex = (targetDomIndex: number) => {
      const boundedIndex = Math.max(0, Math.min(cards.length - 1, targetDomIndex));
      const targetCard = cards[boundedIndex];
      if (!targetCard) return;
      targetLeft = targetCard.offsetLeft - (track.clientWidth - targetCard.offsetWidth) / 2;
      if (smoothRaf) cancelAnimationFrame(smoothRaf);
      smoothRaf = requestAnimationFrame(smoothScroll);
    };

    navigateRef.current = (step: number) => {
      const current = getClosestCardIndex();
      scrollToDomIndex(current + step);
    };

    goToRef.current = (targetOrigIndex: number) => {
      const currentDom = getClosestCardIndex();
      const currentOrig = Number(cards[currentDom]?.dataset.origIndex || 0);
      let diff = targetOrigIndex - currentOrig;
      if (diff > total / 2) diff -= total;
      if (diff < -total / 2) diff += total;
      scrollToDomIndex(currentDom + diff);
    };

    // Center Card 1 (first item of the middle set) initially
    const centerInitial = () => {
      const primaryFirstCard = cards[total];
      if (!primaryFirstCard) return;
      const initialOffset = primaryFirstCard.offsetLeft - (track.clientWidth - primaryFirstCard.offsetWidth) / 2;
      track.scrollLeft = initialOffset;
      targetLeft = initialOffset;
      updateActiveCard();
    };

    const onDown = (e: PointerEvent) => {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      if (smoothRaf) cancelAnimationFrame(smoothRaf);
      dragging = false;
      moved = false;
      startX = e.clientX;
      startY = e.clientY;
      startTime = performance.now();
      startLeft = track.scrollLeft;
      targetLeft = track.scrollLeft;
      pointerId = e.pointerId;
      lockDirection = e.pointerType === "mouse" ? "horizontal" : null;
      if (e.pointerType === "mouse") {
        dragging = true;
      }
    };

    const onMove = (e: PointerEvent) => {
      if (pointerId !== -1 && pointerId !== e.pointerId) return;

      const dx = e.clientX - startX;
      const dy = e.clientY - startY;

      if (lockDirection === null) {
        const absX = Math.abs(dx);
        const absY = Math.abs(dy);
        if (Math.hypot(absX, absY) > 6) {
          if (absX >= absY) {
            lockDirection = "horizontal";
            dragging = true;
          } else {
            lockDirection = "vertical";
            dragging = false;
          }
        }
      }

      if (!dragging || lockDirection !== "horizontal") return;

      const currentLeft = track.scrollLeft;
      const nextLeft = startLeft - dx;
      if (!moved && Math.abs(dx) > 4) moved = true;
      if (moved) {
        track.scrollLeft = nextLeft;
        targetLeft = nextLeft;
        checkWrap();
        updateActiveCard();
      }
    };

    const onUp = (e: PointerEvent) => {
      if (pointerId !== -1 && pointerId !== e.pointerId) return;
      pointerId = -1;
      const wasDragging = dragging;
      const wasMoved = moved;
      dragging = false;
      lockDirection = null;

      if (wasDragging && wasMoved) {
        const dt = performance.now() - startTime;
        const dx = e.clientX - startX;
        let closest = getClosestCardIndex();
        if (dt < 300 && Math.abs(dx) > 30) {
          const step = dx < 0 ? 1 : -1;
          closest = Math.max(0, Math.min(cards.length - 1, closest + step));
        }
        scrollToDomIndex(closest);
      }
    };

    const onClick = (e: MouseEvent) => {
      if (moved) {
        e.preventDefault();
        e.stopPropagation();
        moved = false;
        return;
      }
      const targetCard = (e.target as HTMLElement).closest<HTMLElement>(".port-card");
      if (targetCard) {
        const idx = cards.indexOf(targetCard);
        if (idx !== -1) scrollToDomIndex(idx);
      }
    };

    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
        e.preventDefault();
        targetLeft += e.deltaX;
        if (!smoothRaf) smoothRaf = requestAnimationFrame(smoothScroll);
      }
    };

    const onScroll = () => {
      if (!dragging && !smoothRaf) {
        checkWrap();
        updateActiveCard();
      }
    };

    track.addEventListener("scroll", onScroll, { passive: true });
    track.addEventListener("pointerdown", onDown);
    track.addEventListener("click", onClick, true);
    track.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    window.addEventListener("resize", centerInitial);

    centerInitial();

    return () => {
      if (smoothRaf) cancelAnimationFrame(smoothRaf);
      track.removeEventListener("scroll", onScroll);
      track.removeEventListener("pointerdown", onDown);
      track.removeEventListener("click", onClick, true);
      track.removeEventListener("wheel", onWheel);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      window.removeEventListener("resize", centerInitial);
    };
  }, [total]);

  return (
    <section ref={containerRef} id="works" className="relative flex h-dvh flex-col justify-between overflow-hidden bg-brand-bg pt-[calc(4.5rem+env(safe-area-inset-top,0px))] md:pt-24 pb-6">
      <div className="mx-auto flex w-full max-w-6xl shrink-0 items-end justify-between px-6 mb-3 sm:mb-4">
        <div>
          <Badge variant="outline" className="mb-2 sm:mb-3 border-brand-border/50 font-mono text-[11px] font-normal uppercase tracking-[0.25em] text-brand-border">
            {t.port.label}
          </Badge>
          <h2 className="font-heading text-2xl font-bold tracking-tight text-brand-text sm:text-3xl md:text-4xl lg:text-5xl">{t.port.title}</h2>
        </div>

        <div className="flex items-center gap-3">
          <span className="shrink-0 whitespace-nowrap font-mono text-xs tracking-widest text-brand-text/60">
            {String(activeIndex + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
          </span>
          <div className="hidden items-center gap-1.5 lg:flex">
            <button
              type="button"
              onClick={() => navigateRef.current(-1)}
              aria-label="Previous card"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-brand-border/40 bg-white/70 text-brand-text backdrop-blur-md transition-colors hover:bg-brand-text hover:text-white active:scale-95"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => navigateRef.current(1)}
              aria-label="Next card"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-brand-border/40 bg-white/70 text-brand-text backdrop-blur-md transition-colors hover:bg-brand-text hover:text-white active:scale-95"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <div
        ref={trackRef}
        data-lenis-prevent-horizontal="true"
        className="flex min-h-0 flex-1 w-full cursor-grab touch-pan-y select-none items-stretch gap-6 overflow-x-auto overflow-y-hidden overscroll-x-contain px-[12vw] py-2 [scrollbar-width:none] active:cursor-grabbing sm:gap-8 [&::-webkit-scrollbar]:hidden"
      >
        {slides.map(({ item, originalIndex, copyIndex }) => (
          <Card
            key={`${item.t}-${copyIndex}-${originalIndex}`}
            data-orig-index={originalIndex}
            className="port-card group relative h-full w-[76vw] sm:w-[54vw] md:w-[40vw] lg:w-[32vw] max-w-[460px] shrink-0 cursor-pointer overflow-hidden rounded-3xl border-brand-border/20 bg-brand-surface shadow-lg transition-all duration-500 hover:shadow-2xl data-[active=true]:scale-[1.02] data-[active=true]:shadow-2xl"
          >
            <div className="absolute inset-0 overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={IMAGES[originalIndex % IMAGES.length]}
                alt={item.t}
                draggable={false}
                className="port-img absolute inset-y-0 -left-[8%] h-full w-[116%] max-w-none object-cover grayscale transition-all duration-700 group-hover:scale-105 group-hover:grayscale-0 group-data-[active=true]:scale-105 group-data-[active=true]:grayscale-0"
              />
            </div>
            <div className="absolute inset-0 z-10 bg-gradient-to-t from-brand-text/70 via-transparent to-transparent" />
            <div className="absolute left-5 top-5 z-10 flex gap-2">
              <Badge className="rounded-full bg-white/70 font-mono text-[10px] font-normal uppercase tracking-widest text-brand-text opacity-100 backdrop-blur-md transition-opacity duration-500 group-hover:opacity-0 group-data-[active=true]:opacity-0 hover:bg-white/70">
                {t.port.before}
              </Badge>
              <Badge className="absolute left-0 rounded-full bg-brand-text font-mono text-[10px] font-normal uppercase tracking-widest text-white opacity-0 transition-opacity duration-500 group-hover:opacity-100 group-data-[active=true]:opacity-100 hover:bg-brand-text">
                {t.port.healed}
              </Badge>
            </div>
            <div className="absolute inset-x-0 bottom-0 z-10 p-5 md:p-6 lg:p-7 text-white">
              <span className="font-mono text-xs tracking-widest text-white/60">{String(originalIndex + 1).padStart(2, "0")}</span>
              <h3 className="font-heading text-xl md:text-2xl font-semibold">{item.t}</h3>
              <p className="text-sm text-white/75">{item.d}</p>
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
