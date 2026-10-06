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

export interface ActiveCardStateUpdate {
  activeDomIndex: number;
  activeOrigIndex: number;
}

export interface SliderEngineOptions {
  track: HTMLElement;
  cards: HTMLElement[];
  total: number;
  onIndexChange?: (indices: ActiveCardStateUpdate) => void;
}

export interface SliderEngine {
  readonly currentScrollLeft: number;
  setScrollLeft: (pos: number) => void;
  setTargetLeft: (pos: number) => void;
  getTargetDomIndex: () => number;
  setTargetDomIndex: (index: number) => void;
  isAnimating: () => boolean;
  cancelSmooth: () => void;
  checkWrap: () => boolean;
  getClosestCardIndex: (scrollPos?: number) => number;
  scrollToDomIndex: (targetDomIndex: number) => void;
  navigate: (step: number) => void;
  goTo: (targetOrigIndex: number) => void;
  settle: () => void;
  centerInitial: () => void;
  syncScrollPosition: (scrollPos: number) => void;
  updateActiveCard: (scrollPos?: number) => ActiveCardStateUpdate | null;
  recomputeMetrics: () => SliderTrackMetrics;
  setSnap: (on: boolean) => void;
  destroy: () => void;
}

export function computeMetrics(
  track: HTMLElement,
  cards: HTMLElement[],
  total: number
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
  const middleCard = metrics[total];
  const setWidth = firstCard && middleCard ? middleCard.offsetLeft - firstCard.offsetLeft : 0;

  return {
    trackWidth,
    setWidth,
    cards: metrics,
  };
}

function getCardCenterOffset(metric: SliderCardMetric, trackWidth: number): number {
  return metric.offsetLeft - (trackWidth - metric.offsetWidth) / 2;
}

function findClosestMetric(
  metrics: SliderCardMetric[],
  currentCenter: number
): SliderCardMetric | null {
  let closestMetric: SliderCardMetric | null = null;
  let minDiff = Infinity;

  for (const cardMetric of metrics) {
    const diff = Math.abs(cardMetric.centerOffset - currentCenter);
    if (diff < minDiff) {
      minDiff = diff;
      closestMetric = cardMetric;
    }
  }

  return closestMetric;
}

function isCoarsePointer(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(pointer: coarse)").matches;
}

export function createSliderEngine({
  track,
  cards,
  total,
  onIndexChange,
}: SliderEngineOptions): SliderEngine {
  let currentScrollLeft = track.scrollLeft;
  let targetLeft = currentScrollLeft;
  let targetDomIndex = total;
  let smoothRaf = 0;
  let activeDomIndex = -1;
  let activeOrigIndex = -1;

  let metrics = computeMetrics(track, cards, total);

  const setSnap = (on: boolean) => {
    if (!isCoarsePointer()) return;
    const snapVal = on ? "x mandatory" : "none";
    if (track.style.scrollSnapType !== snapVal) {
      track.style.scrollSnapType = snapVal;
    }
  };

  const recomputeMetrics = (): SliderTrackMetrics => {
    metrics = computeMetrics(track, cards, total);
    return metrics;
  };

  const updateActiveCard = (scrollPos = currentScrollLeft): ActiveCardStateUpdate | null => {
    const currentCenter = scrollPos + metrics.trackWidth / 2;
    const closest = findClosestMetric(metrics.cards, currentCenter);
    if (!closest) return null;

    const newDomIndex = closest.domIndex;
    const newOrigIndex = closest.origIndex;

    if (newDomIndex !== activeDomIndex) {
      if (activeDomIndex >= 0 && cards[activeDomIndex]) {
        cards[activeDomIndex].dataset.active = "false";
      }
      if (cards[newDomIndex]) {
        cards[newDomIndex].dataset.active = "true";
      }
    }

    const indices: ActiveCardStateUpdate = {
      activeDomIndex: newDomIndex,
      activeOrigIndex: newOrigIndex,
    };

    if (newOrigIndex !== activeOrigIndex || newDomIndex !== activeDomIndex) {
      activeDomIndex = newDomIndex;
      activeOrigIndex = newOrigIndex;
      onIndexChange?.(indices);
    }

    return indices;
  };

  const checkWrap = (): boolean => {
    const { setWidth } = metrics;
    if (setWidth <= 0) return false;

    let adjustment = 0;
    if (currentScrollLeft < setWidth * 0.5) {
      adjustment = setWidth;
    } else if (currentScrollLeft >= setWidth * 1.5) {
      adjustment = -setWidth;
    }

    if (adjustment !== 0) {
      currentScrollLeft += adjustment;
      targetLeft += adjustment;
      track.scrollLeft = currentScrollLeft;
      if (adjustment > 0) {
        targetDomIndex = Math.min(cards.length - 1, targetDomIndex + total);
      } else {
        targetDomIndex = Math.max(0, targetDomIndex - total);
      }
      return true;
    }

    return false;
  };

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
      setSnap(true);
    }
  };

  const cancelSmooth = () => {
    if (smoothRaf) {
      cancelAnimationFrame(smoothRaf);
      smoothRaf = 0;
    }
  };

  const getClosestCardIndex = (scrollPos = currentScrollLeft): number => {
    const currentCenter = scrollPos + metrics.trackWidth / 2;
    const closest = findClosestMetric(metrics.cards, currentCenter);
    return closest ? closest.domIndex : total;
  };

  const scrollToDomIndex = (targetIndex: number) => {
    setSnap(false);
    let nextIndex = targetIndex;
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
    targetDomIndex = boundedIndex;
    const targetMetric = metrics.cards[boundedIndex];
    if (!targetMetric) return;

    targetLeft = getCardCenterOffset(targetMetric, metrics.trackWidth);
    cancelSmooth();
    smoothRaf = requestAnimationFrame(smoothScroll);
  };

  const settle = () => {
    checkWrap();
    if (isCoarsePointer()) {
      updateActiveCard(currentScrollLeft);
    } else {
      scrollToDomIndex(getClosestCardIndex(currentScrollLeft));
    }
  };

  const navigate = (step: number) => {
    const baseIndex = smoothRaf !== 0 ? targetDomIndex : getClosestCardIndex(currentScrollLeft);
    scrollToDomIndex(baseIndex + step);
  };

  const goTo = (targetOrigIndex: number) => {
    const currentDom = smoothRaf !== 0 ? targetDomIndex : getClosestCardIndex(currentScrollLeft);
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
    targetDomIndex = total;
    const initialOffset = getCardCenterOffset(primaryFirstCard, metrics.trackWidth);
    currentScrollLeft = initialOffset;
    targetLeft = initialOffset;
    track.scrollLeft = initialOffset;
    updateActiveCard(initialOffset);
  };

  const syncScrollPosition = (scrollPos: number) => {
    currentScrollLeft = scrollPos;
    targetLeft = scrollPos;
  };

  return {
    get currentScrollLeft() {
      return currentScrollLeft;
    },
    setScrollLeft: (pos: number) => {
      currentScrollLeft = pos;
    },
    setTargetLeft: (pos: number) => {
      targetLeft = pos;
    },
    getTargetDomIndex: () => targetDomIndex,
    setTargetDomIndex: (index: number) => {
      targetDomIndex = index;
    },
    isAnimating: () => smoothRaf !== 0,
    cancelSmooth,
    checkWrap,
    getClosestCardIndex,
    scrollToDomIndex,
    navigate,
    goTo,
    settle,
    centerInitial,
    syncScrollPosition,
    updateActiveCard,
    recomputeMetrics,
    setSnap,
    destroy: cancelSmooth,
  };
}
