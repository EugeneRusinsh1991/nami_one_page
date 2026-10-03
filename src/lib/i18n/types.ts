export type Pair = { t: string; d: string };

export interface Dict {
  nav: { philosophy: string; technique: string; works: string; master: string; faq: string; book: string };
  hero: { badge: string; title: string; sub: string; cta1: string; cta2: string; scroll: string };
  philo: { label: string; title: string; cards: Pair[] };
  tech: { label: string; steps: Pair[] };
  port: { label: string; title: string; before: string; healed: string; cases: Pair[] };
  master: { label: string; title: string; text: string; metrics: Pair[] };
  faq: { label: string; title: string; items: Pair[] };
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
  };
}
