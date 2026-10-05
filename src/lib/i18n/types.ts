export type Pair = { t: string; d: string };
export type HeroSlide = { badge: string; title: string; sub: string };

export interface CalendarTranslations {
  approximateNotice: string;
  selectDateTitle: string;
  selectTimeTitle: string;
  selectedSlotsTitle: string;
  maxSlotsNotice: string;
  maxSlotsReached: string;
  noSlotsChosen: string;
  slotsCount: string;
  clearAll: string;
  nameLabel: string;
  phoneLabel: string;
  submitButton: string;
  submittingButton: string;
  validationErrorRequired: string;
  validationErrorSlot: string;
  modalTitle: string;
  modalDescription: string;
  modalClose: string;
  weekdays: string[];
  months: string[];
}

export interface ShowcaseSectionData {
  label: string;
  title: string;
  text?: string;
  metrics: Pair[];
  link?: {
    text: string;
    href: string;
  };
}

export interface ClientGuideFaqItem {
  t: string;
  d: string;
  badge?: string;
}

export interface ClientGuideData {
  meta: {
    title: string;
    backToHome: string;
    badge: string;
  };
  hero: ShowcaseSectionData;
  faq: {
    label: string;
    title: string;
    description?: string;
    items: ClientGuideFaqItem[];
  };
}

export interface Dict {
  nav: { philosophy: string; technique: string; works: string; master: string; studio: string; academy: string; faq: string; book: string };
  hero: { badge: string; title: string; sub: string; cta1: string; cta2: string; scroll: string; slides: HeroSlide[] };
  philo: { label: string; title: string; cards: Pair[] };
  tech: { label: string; steps: Pair[] };
  port: { label: string; title: string; before: string; healed: string; cases: Pair[] };
  master: ShowcaseSectionData;
  studio: ShowcaseSectionData;
  academy: ShowcaseSectionData;
  faq: { label: string; title: string; items: Pair[]; guideButton: string };
  clientGuide: ClientGuideData;
  cta: {
    title: string;
    sub: string;
    zones: string[];
    name: string;
    phone: string;
    send: string;
    address: string;
    hours: string;
    map: string;
    privacy: string;
    rights: string;
    calendar: CalendarTranslations;
  };
}
