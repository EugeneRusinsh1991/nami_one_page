export const IMAGES = [
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

export function getCardCenterOffset(metric: SliderCardMetric, trackWidth: number): number {
  return metric.offsetLeft - (trackWidth - metric.offsetWidth) / 2;
}

export function findClosestMetric(
  metrics: SliderCardMetric[],
  currentCenter: number
): { closestMetric: SliderCardMetric | null; minDiff: number } {
  let closestMetric: SliderCardMetric | null = null;
  let minDiff = Infinity;

  for (const cardMetric of metrics) {
    const diff = Math.abs(cardMetric.centerOffset - currentCenter);
    if (diff < minDiff) {
      minDiff = diff;
      closestMetric = cardMetric;
    }
  }

  return { closestMetric, minDiff };
}

export function calculateWrapAdjustment(scrollLeft: number, setWidth: number): number {
  if (setWidth <= 0) return 0;
  if (scrollLeft < setWidth * 0.5) return setWidth;
  if (scrollLeft >= setWidth * 1.5) return -setWidth;
  return 0;
}
