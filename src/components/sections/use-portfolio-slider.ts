"use client";

import { useEffect, useRef, useState } from "react";
import {
  computeSliderMetrics,
  getCardCenterOffset,
  findClosestMetric,
  calculateWrapAdjustment,
} from "./portfolio-slider-utils";

interface UsePortfolioSliderOptions {
  total: number;
  locale?: string;
}

export function usePortfolioSlider({ total, locale }: UsePortfolioSliderOptions) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const activeIndexRef = useRef(0);
  activeIndexRef.current = activeIndex;

  const targetDomIndexRef = useRef(total);
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
      const adjustment = calculateWrapAdjustment(track.scrollLeft, metrics.setWidth);
      if (adjustment !== 0) {
        track.scrollLeft += adjustment;
        targetLeft += adjustment;
        if (adjustment > 0) {
          targetDomIndexRef.current = Math.min(cards.length - 1, targetDomIndexRef.current + total);
        } else {
          targetDomIndexRef.current = Math.max(0, targetDomIndexRef.current - total);
        }
      }
    };

    const updateActiveCard = () => {
      const currentCenter = track.scrollLeft + track.clientWidth / 2;
      const { closestMetric } = findClosestMetric(metrics.cards, currentCenter);
      const closestCard = closestMetric ? cards[closestMetric.domIndex] ?? null : null;
      const closestOrig = closestMetric ? closestMetric.origIndex : 0;

      cards.forEach((card) => {
        const active = card === closestCard ? "true" : "false";
        if (card.dataset.active !== active) card.dataset.active = active;
      });

      if (closestMetric) {
        targetDomIndexRef.current = closestMetric.domIndex;
      }
      setActiveIndex((prev) => (prev !== closestOrig ? closestOrig : prev));
    };

    const coarsePointer = window.matchMedia("(pointer: coarse)").matches;
    const setNativeSnap = (on: boolean) => {
      if (coarsePointer) track.style.scrollSnapType = on ? "x mandatory" : "none";
    };
    setNativeSnap(true);

    const smoothScroll = () => {
      const diff = targetLeft - track.scrollLeft;
      if (Math.abs(diff) > 0.5) {
        track.scrollLeft += diff * 0.25;
        checkWrap();
        updateActiveCard();
        smoothRaf = requestAnimationFrame(smoothScroll);
      } else {
        track.scrollLeft = targetLeft;
        smoothRaf = 0;
        checkWrap();
        updateActiveCard();
        setNativeSnap(true);
      }
    };

    const getClosestCardIndex = () => {
      const currentCenter = track.scrollLeft + track.clientWidth / 2;
      const { closestMetric } = findClosestMetric(metrics.cards, currentCenter);
      return closestMetric ? closestMetric.domIndex : total;
    };

    const scrollToDomIndex = (targetDomIndex: number) => {
      setNativeSnap(false);
      let nextIndex = targetDomIndex;
      if (nextIndex < total) {
        track.scrollLeft += metrics.setWidth;
        targetLeft += metrics.setWidth;
        nextIndex += total;
      } else if (nextIndex >= total * 2) {
        track.scrollLeft -= metrics.setWidth;
        targetLeft -= metrics.setWidth;
        nextIndex -= total;
      }
      const boundedIndex = Math.max(0, Math.min(cards.length - 1, nextIndex));
      targetDomIndexRef.current = boundedIndex;
      const targetMetric = metrics.cards[boundedIndex];
      if (!targetMetric) return;
      targetLeft = getCardCenterOffset(targetMetric, track.clientWidth);
      if (smoothRaf) cancelAnimationFrame(smoothRaf);
      smoothRaf = requestAnimationFrame(smoothScroll);
    };

    const settle = () => {
      checkWrap();
      if (coarsePointer) updateActiveCard();
      else scrollToDomIndex(getClosestCardIndex());
    };

    let snapTimeout = 0;
    const scheduleSnap = () => {
      if (isPointerDown) return;
      window.clearTimeout(snapTimeout);
      snapTimeout = window.setTimeout(() => {
        if (!isPointerDown && smoothRaf === 0) settle();
      }, 140);
    };

    navigateRef.current = (step: number) => {
      const baseIndex = smoothRaf !== 0 ? targetDomIndexRef.current : getClosestCardIndex();
      scrollToDomIndex(baseIndex + step);
    };

    goToRef.current = (targetOrigIndex: number) => {
      const currentDom = smoothRaf !== 0 ? targetDomIndexRef.current : getClosestCardIndex();
      const currentMetric = metrics.cards[currentDom];
      const currentOrig = currentMetric ? currentMetric.origIndex : 0;
      let diff = targetOrigIndex - currentOrig;
      if (diff > total / 2) diff -= total;
      if (diff < -total / 2) diff += total;
      scrollToDomIndex(currentDom + diff);
    };

    const centerInitial = () => {
      const primaryFirstCard = metrics.cards[total];
      if (!primaryFirstCard) return;
      targetDomIndexRef.current = total;
      const initialOffset = getCardCenterOffset(primaryFirstCard, track.clientWidth);
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
      window.clearTimeout(snapTimeout);
      if (smoothRaf) {
        cancelAnimationFrame(smoothRaf);
        smoothRaf = 0;
      }
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
      if (!isPointerDown) return;
      isPointerDown = false;
      if (hasMoved) {
        scrollToDomIndex(getClosestCardIndex());
      }
    };

    const onTouchStart = () => {
      isPointerDown = true;
      window.clearTimeout(snapTimeout);
      if (smoothRaf) {
        cancelAnimationFrame(smoothRaf);
        smoothRaf = 0;
      }
      setNativeSnap(true);
    };

    const onTouchEnd = () => {
      isPointerDown = false;
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
        if (idx !== -1) scrollToDomIndex(idx);
      }
    };

    const onScroll = () => {
      if (!smoothRaf) {
        updateActiveCard();
        scheduleSnap();
      }
    };

    const onScrollEnd = () => {
      if (!isPointerDown && smoothRaf === 0) {
        window.clearTimeout(snapTimeout);
        settle();
      }
    };

    let lastWidth = track.clientWidth;
    const onResize = () => {
      if (track.clientWidth === lastWidth) return;
      lastWidth = track.clientWidth;
      metrics = computeSliderMetrics(track, cards, total);
      const currentDom = targetDomIndexRef.current ?? total;
      const targetMetric = metrics.cards[currentDom] || metrics.cards[total];
      if (targetMetric) {
        const offset = getCardCenterOffset(targetMetric, track.clientWidth);
        track.scrollLeft = offset;
        targetLeft = offset;
        updateActiveCard();
      }
    };
    const resizeObserver = new ResizeObserver(onResize);
    resizeObserver.observe(track);

    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) >= Math.abs(e.deltaX)) {
        return;
      }
      if (smoothRaf) {
        cancelAnimationFrame(smoothRaf);
        smoothRaf = 0;
      }
      track.scrollLeft += e.deltaX;
      targetLeft = track.scrollLeft;
      checkWrap();
      updateActiveCard();
      scheduleSnap();
    };

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

    centerInitial();

    return () => {
      if (smoothRaf) cancelAnimationFrame(smoothRaf);
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
    };
  }, [total, locale]);

  return {
    trackRef,
    activeIndex,
    navigate: (step: number) => navigateRef.current(step),
    goTo: (index: number) => goToRef.current(index),
  };
}
