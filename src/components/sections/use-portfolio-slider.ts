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

    track.style.willChange = "scroll-position";
    cards.forEach((card) => {
      card.style.willChange = "transform, opacity";
    });

    let metrics = computeSliderMetrics(track, cards, total);
    let currentScrollLeft = track.scrollLeft;
    let targetLeft = currentScrollLeft;
    let smoothRaf = 0;
    let scrollRaf = 0;
    let dragRaf = 0;
    let wheelRaf = 0;
    let activeDomIndex = -1;

    const checkWrap = () => {
      const adjustment = calculateWrapAdjustment(currentScrollLeft, metrics.setWidth);
      if (adjustment !== 0) {
        currentScrollLeft += adjustment;
        targetLeft += adjustment;
        track.scrollLeft = currentScrollLeft;
        if (adjustment > 0) {
          targetDomIndexRef.current = Math.min(cards.length - 1, targetDomIndexRef.current + total);
        } else {
          targetDomIndexRef.current = Math.max(0, targetDomIndexRef.current - total);
        }
      }
    };

    const updateActiveCard = (scrollPos = currentScrollLeft) => {
      const currentCenter = scrollPos + metrics.trackWidth / 2;
      const { closestMetric } = findClosestMetric(metrics.cards, currentCenter);
      if (!closestMetric) return;

      const newDomIndex = closestMetric.domIndex;
      const closestOrig = closestMetric.origIndex;
      targetDomIndexRef.current = newDomIndex;

      if (newDomIndex !== activeDomIndex) {
        if (activeDomIndex >= 0 && cards[activeDomIndex]) {
          cards[activeDomIndex].dataset.active = "false";
        }
        if (cards[newDomIndex]) {
          cards[newDomIndex].dataset.active = "true";
        }
        activeDomIndex = newDomIndex;
      }

      if (activeIndexRef.current !== closestOrig) {
        activeIndexRef.current = closestOrig;
        setActiveIndex(closestOrig);
      }
    };

    const coarsePointer = window.matchMedia("(pointer: coarse)").matches;
    const setNativeSnap = (on: boolean) => {
      if (coarsePointer) {
        const snapVal = on ? "x mandatory" : "none";
        if (track.style.scrollSnapType !== snapVal) {
          track.style.scrollSnapType = snapVal;
        }
      }
    };
    setNativeSnap(true);

    const smoothScroll = () => {
      const diff = targetLeft - currentScrollLeft;
      if (Math.abs(diff) > 0.5) {
        currentScrollLeft += diff * 0.25;
        track.scrollLeft = currentScrollLeft;
        checkWrap();
        updateActiveCard(currentScrollLeft);
        smoothRaf = requestAnimationFrame(smoothScroll);
      } else {
        currentScrollLeft = targetLeft;
        track.scrollLeft = currentScrollLeft;
        smoothRaf = 0;
        checkWrap();
        updateActiveCard(currentScrollLeft);
        setNativeSnap(true);
      }
    };

    const getClosestCardIndex = (scrollPos = currentScrollLeft) => {
      const currentCenter = scrollPos + metrics.trackWidth / 2;
      const { closestMetric } = findClosestMetric(metrics.cards, currentCenter);
      return closestMetric ? closestMetric.domIndex : total;
    };

    const scrollToDomIndex = (targetDomIndex: number) => {
      setNativeSnap(false);
      let nextIndex = targetDomIndex;
      if (nextIndex < total) {
        currentScrollLeft += metrics.setWidth;
        targetLeft += metrics.setWidth;
        track.scrollLeft = currentScrollLeft;
        nextIndex += total;
      } else if (nextIndex >= total * 2) {
        currentScrollLeft -= metrics.setWidth;
        targetLeft -= metrics.setWidth;
        track.scrollLeft = currentScrollLeft;
        nextIndex -= total;
      }
      const boundedIndex = Math.max(0, Math.min(cards.length - 1, nextIndex));
      targetDomIndexRef.current = boundedIndex;
      const targetMetric = metrics.cards[boundedIndex];
      if (!targetMetric) return;
      targetLeft = getCardCenterOffset(targetMetric, metrics.trackWidth);
      if (smoothRaf) cancelAnimationFrame(smoothRaf);
      smoothRaf = requestAnimationFrame(smoothScroll);
    };

    const settle = () => {
      checkWrap();
      if (coarsePointer) updateActiveCard(currentScrollLeft);
      else scrollToDomIndex(getClosestCardIndex(currentScrollLeft));
    };

    let isMouseDragging = false;
    let isTouchActive = false;
    let snapTimeout = 0;
    const scheduleSnap = () => {
      if (isMouseDragging || isTouchActive) return;
      window.clearTimeout(snapTimeout);
      snapTimeout = window.setTimeout(() => {
        if (!isMouseDragging && !isTouchActive && smoothRaf === 0) settle();
      }, 140);
    };

    navigateRef.current = (step: number) => {
      const baseIndex = smoothRaf !== 0 ? targetDomIndexRef.current : getClosestCardIndex(currentScrollLeft);
      scrollToDomIndex(baseIndex + step);
    };

    goToRef.current = (targetOrigIndex: number) => {
      const currentDom = smoothRaf !== 0 ? targetDomIndexRef.current : getClosestCardIndex(currentScrollLeft);
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
      const initialOffset = getCardCenterOffset(primaryFirstCard, metrics.trackWidth);
      currentScrollLeft = initialOffset;
      targetLeft = initialOffset;
      track.scrollLeft = initialOffset;
      updateActiveCard(initialOffset);
    };

    let startX = 0;
    let startScrollLeft = 0;
    let hasMoved = false;

    const onPointerDown = (e: PointerEvent) => {
      if (e.pointerType !== "mouse" || e.button !== 0) return;
      isMouseDragging = true;
      hasMoved = false;
      startX = e.clientX;
      currentScrollLeft = track.scrollLeft;
      startScrollLeft = currentScrollLeft;
      window.clearTimeout(snapTimeout);
      if (smoothRaf) {
        cancelAnimationFrame(smoothRaf);
        smoothRaf = 0;
      }
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
            currentScrollLeft = nextPos;
            track.scrollLeft = currentScrollLeft;
            targetLeft = currentScrollLeft;
            checkWrap();
            updateActiveCard(currentScrollLeft);
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
        currentScrollLeft = track.scrollLeft;
        scrollToDomIndex(getClosestCardIndex(currentScrollLeft));
      }
    };

    const onTouchStart = () => {
      isTouchActive = true;
      window.clearTimeout(snapTimeout);
      if (smoothRaf) {
        cancelAnimationFrame(smoothRaf);
        smoothRaf = 0;
      }
      setNativeSnap(true);
    };

    const onTouchEnd = () => {
      isTouchActive = false;
      currentScrollLeft = track.scrollLeft;
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
        if (!scrollRaf) {
          scrollRaf = requestAnimationFrame(() => {
            scrollRaf = 0;
            currentScrollLeft = track.scrollLeft;
            updateActiveCard(currentScrollLeft);
            scheduleSnap();
          });
        }
      }
    };

    const onScrollEnd = () => {
      if (!isMouseDragging && !isTouchActive && smoothRaf === 0) {
        window.clearTimeout(snapTimeout);
        currentScrollLeft = track.scrollLeft;
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
        const offset = getCardCenterOffset(targetMetric, metrics.trackWidth);
        currentScrollLeft = offset;
        track.scrollLeft = offset;
        targetLeft = offset;
        updateActiveCard(offset);
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
      const nextWheelScroll = (wheelRaf ? currentScrollLeft : track.scrollLeft) + e.deltaX;
      currentScrollLeft = nextWheelScroll;
      if (!wheelRaf) {
        wheelRaf = requestAnimationFrame(() => {
          wheelRaf = 0;
          track.scrollLeft = currentScrollLeft;
          targetLeft = currentScrollLeft;
          checkWrap();
          updateActiveCard(currentScrollLeft);
          scheduleSnap();
        });
      }
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
    };
  }, [total, locale]);

  return {
    trackRef,
    activeIndex,
    navigate: (step: number) => navigateRef.current(step),
    goTo: (index: number) => goToRef.current(index),
  };
}
