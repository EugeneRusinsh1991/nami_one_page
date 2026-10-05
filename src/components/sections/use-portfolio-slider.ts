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
}

export function usePortfolioSlider({ total }: UsePortfolioSliderOptions) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const activeIndexRef = useRef(0);
  activeIndexRef.current = activeIndex;

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
      }
    };

    const updateActiveCard = () => {
      const currentCenter = track.scrollLeft + metrics.trackWidth / 2;
      const { closestMetric } = findClosestMetric(metrics.cards, currentCenter);
      const closestCard = closestMetric ? cards[closestMetric.domIndex] ?? null : null;
      const closestOrig = closestMetric ? closestMetric.origIndex : 0;

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
      const { closestMetric } = findClosestMetric(metrics.cards, currentCenter);
      return closestMetric ? closestMetric.domIndex : total;
    };

    const scrollToDomIndex = (targetDomIndex: number) => {
      const boundedIndex = Math.max(0, Math.min(cards.length - 1, targetDomIndex));
      const targetMetric = metrics.cards[boundedIndex];
      if (!targetMetric) return;
      targetLeft = getCardCenterOffset(targetMetric, metrics.trackWidth);
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

    const centerInitial = () => {
      const primaryFirstCard = metrics.cards[total];
      if (!primaryFirstCard) return;
      const initialOffset = getCardCenterOffset(primaryFirstCard, metrics.trackWidth);
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
        const offset = getCardCenterOffset(activeCardDom, metrics.trackWidth);
        track.scrollLeft = offset;
        targetLeft = offset;
      }
    };

    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) >= Math.abs(e.deltaX)) {
        return;
      }
      track.scrollLeft += e.deltaX;
      targetLeft = track.scrollLeft;
      checkWrap();
      updateActiveCard();
    };

    track.addEventListener("scroll", onScroll, { passive: true });
    track.addEventListener("click", onClick);
    track.addEventListener("wheel", onWheel, { passive: true });
    track.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerUp);
    window.addEventListener("resize", onResize);

    centerInitial();

    return () => {
      if (smoothRaf) cancelAnimationFrame(smoothRaf);
      track.removeEventListener("scroll", onScroll);
      track.removeEventListener("click", onClick);
      track.removeEventListener("wheel", onWheel);
      track.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);
      window.removeEventListener("resize", onResize);
    };
  }, [total]);

  return {
    trackRef,
    activeIndex,
    navigate: (step: number) => navigateRef.current(step),
    goTo: (index: number) => goToRef.current(index),
  };
}
