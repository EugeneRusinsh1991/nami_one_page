"use client";

import { useEffect, useRef, useState } from "react";
import {
  createSliderEngine,
  type ActiveCardStateUpdate,
} from "./portfolio-slider-engine";

export interface UsePortfolioSliderOptions {
  total: number;
  locale?: string;
}

export interface UsePortfolioSliderReturn {
  trackRef: React.RefObject<HTMLDivElement | null>;
  activeIndex: number;
  navigate: (step: number) => void;
  goTo: (index: number) => void;
}

export function usePortfolioSlider({
  total,
  locale,
}: UsePortfolioSliderOptions): UsePortfolioSliderReturn {
  const trackRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const navigateRef = useRef<(step: number) => void>(() => {});
  const goToRef = useRef<(index: number) => void>(() => {});

  useEffect(() => {
    const track = trackRef.current;
    if (!track || total === 0) return;

    const cards = Array.from(track.querySelectorAll<HTMLElement>(".port-card"));
    if (cards.length === 0) return;

    track.style.willChange = "scroll-position";
    cards.forEach((card) => {
      card.style.willChange = "transform, opacity";
    });

    const engine = createSliderEngine({
      track,
      cards,
      total,
      onIndexChange: ({ activeOrigIndex }: ActiveCardStateUpdate) => {
        setActiveIndex(activeOrigIndex);
      },
    });

    navigateRef.current = (step) => engine.navigate(step);
    goToRef.current = (index) => engine.goTo(index);

    let isMouseDragging = false;
    let isTouchActive = false;
    let snapTimeout = 0;
    let scrollRaf = 0;
    let dragRaf = 0;
    let wheelRaf = 0;

    let startX = 0;
    let startScrollLeft = 0;
    let hasMoved = false;

    const scheduleSnap = () => {
      if (isMouseDragging || isTouchActive) return;
      window.clearTimeout(snapTimeout);
      snapTimeout = window.setTimeout(() => {
        if (!isMouseDragging && !isTouchActive && !engine.isAnimating()) {
          engine.settle();
        }
      }, 140);
    };

    const onPointerDown = (e: PointerEvent) => {
      if (e.pointerType !== "mouse" || e.button !== 0) return;
      isMouseDragging = true;
      hasMoved = false;
      startX = e.clientX;
      const currentPos = track.scrollLeft;
      engine.syncScrollPosition(currentPos);
      startScrollLeft = currentPos;
      window.clearTimeout(snapTimeout);
      engine.cancelSmooth();
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!isMouseDragging || e.pointerType !== "mouse") return;
      const dx = e.clientX - startX;
      if (Math.abs(dx) > 4) {
        hasMoved = true;
        const nextPos = startScrollLeft - dx;
        if (!dragRaf) {
          dragRaf = requestAnimationFrame(() => {
            dragRaf = 0;
            if (!isMouseDragging) return;
            engine.setScrollLeft(nextPos);
            track.scrollLeft = nextPos;
            engine.setTargetLeft(nextPos);
            engine.checkWrap();
            engine.updateActiveCard(engine.currentScrollLeft);
          });
        }
      }
    };

    const onPointerUp = (e: PointerEvent) => {
      if (!isMouseDragging || (e.pointerType && e.pointerType !== "mouse")) return;
      isMouseDragging = false;
      if (dragRaf) {
        cancelAnimationFrame(dragRaf);
        dragRaf = 0;
      }
      if (hasMoved) {
        const currentPos = track.scrollLeft;
        engine.syncScrollPosition(currentPos);
        engine.scrollToDomIndex(engine.getClosestCardIndex(currentPos));
      }
    };

    const onTouchStart = () => {
      isTouchActive = true;
      window.clearTimeout(snapTimeout);
      engine.cancelSmooth();
      engine.setSnap(true);
    };

    const onTouchEnd = () => {
      isTouchActive = false;
      engine.syncScrollPosition(track.scrollLeft);
      scheduleSnap();
    };

    const onClick = (e: MouseEvent) => {
      if (hasMoved) {
        hasMoved = false;
        return;
      }
      const targetCard = (e.target as HTMLElement).closest<HTMLElement>(".port-card");
      if (targetCard) {
        const idx = cards.indexOf(targetCard);
        if (idx !== -1) {
          engine.scrollToDomIndex(idx);
        }
      }
    };

    const onScroll = () => {
      if (!engine.isAnimating()) {
        if (!scrollRaf) {
          scrollRaf = requestAnimationFrame(() => {
            scrollRaf = 0;
            const currentPos = track.scrollLeft;
            engine.syncScrollPosition(currentPos);
            engine.updateActiveCard(currentPos);
            scheduleSnap();
          });
        }
      }
    };

    const onScrollEnd = () => {
      if (!isMouseDragging && !isTouchActive && !engine.isAnimating()) {
        window.clearTimeout(snapTimeout);
        engine.syncScrollPosition(track.scrollLeft);
        engine.settle();
      }
    };

    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) >= Math.abs(e.deltaX)) {
        return;
      }
      engine.cancelSmooth();
      const nextWheelScroll =
        (wheelRaf ? engine.currentScrollLeft : track.scrollLeft) + e.deltaX;
      engine.setScrollLeft(nextWheelScroll);

      if (!wheelRaf) {
        wheelRaf = requestAnimationFrame(() => {
          wheelRaf = 0;
          const currentPos = engine.currentScrollLeft;
          track.scrollLeft = currentPos;
          engine.setTargetLeft(currentPos);
          engine.checkWrap();
          engine.updateActiveCard(currentPos);
          scheduleSnap();
        });
      }
    };

    let lastWidth = track.clientWidth;
    const resizeObserver = new ResizeObserver(() => {
      if (track.clientWidth === lastWidth) return;
      lastWidth = track.clientWidth;
      const metrics = engine.recomputeMetrics();
      const currentDom = engine.getTargetDomIndex() ?? total;
      const targetMetric = metrics.cards[currentDom] || metrics.cards[total];
      if (targetMetric) {
        const offset = targetMetric.offsetLeft - (metrics.trackWidth - targetMetric.offsetWidth) / 2;
        engine.syncScrollPosition(offset);
        track.scrollLeft = offset;
        engine.updateActiveCard(offset);
      }
    });

    track.addEventListener("scroll", onScroll, { passive: true });
    track.addEventListener("scrollend", onScrollEnd);
    track.addEventListener("touchstart", onTouchStart, { passive: true });
    track.addEventListener("touchend", onTouchEnd, { passive: true });
    track.addEventListener("touchcancel", onTouchEnd, { passive: true });
    track.addEventListener("click", onClick);
    track.addEventListener("wheel", onWheel, { passive: true });
    track.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerUp);

    resizeObserver.observe(track);
    engine.centerInitial();
    engine.setSnap(true);

    return () => {
      if (scrollRaf) cancelAnimationFrame(scrollRaf);
      if (dragRaf) cancelAnimationFrame(dragRaf);
      if (wheelRaf) cancelAnimationFrame(wheelRaf);
      window.clearTimeout(snapTimeout);

      track.removeEventListener("scroll", onScroll);
      track.removeEventListener("scrollend", onScrollEnd);
      track.removeEventListener("touchstart", onTouchStart);
      track.removeEventListener("touchend", onTouchEnd);
      track.removeEventListener("touchcancel", onTouchEnd);
      track.removeEventListener("click", onClick);
      track.removeEventListener("wheel", onWheel);
      track.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);

      resizeObserver.disconnect();
      engine.destroy();
    };
  }, [total, locale]);

  return {
    trackRef,
    activeIndex,
    navigate: (step: number) => navigateRef.current(step),
    goTo: (index: number) => goToRef.current(index),
  };
}
