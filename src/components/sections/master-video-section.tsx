"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/components/providers/language-provider";

const BADGE_PLACEMENTS = [
  "left-3 top-3 sm:left-6 sm:top-6 lg:left-8 lg:top-8",
  "right-3 top-3 sm:right-6 sm:top-6 lg:right-8 lg:top-8",
  "left-3 top-[50%] -translate-y-1/2 sm:left-6 lg:left-8",
  "right-3 bottom-3 sm:right-6 sm:bottom-6 lg:right-8 lg:bottom-8",
  "left-3 bottom-3 sm:left-6 sm:bottom-6 lg:left-8 lg:bottom-8",
];

const BADGE_PLACEMENTS_2 = [
  "right-3 top-3 sm:right-6 sm:top-6 lg:right-8 lg:top-8",
  "left-3 top-3 sm:left-6 sm:top-6 lg:left-8 lg:top-8",
  "right-3 top-[50%] -translate-y-1/2 sm:right-6 lg:right-8",
  "left-3 bottom-3 sm:left-6 sm:bottom-6 lg:left-8 lg:bottom-8",
  "right-3 bottom-3 sm:right-6 sm:bottom-6 lg:right-8 lg:bottom-8",
];

const BLOCKS = [
  { id: "master-1", badges: BADGE_PLACEMENTS, mirrored: false },
  { id: "master-2", badges: BADGE_PLACEMENTS_2, mirrored: true },
];

export function MasterVideoSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { t } = useLanguage();

  useGSAP(
    () => {
      gsap.utils.toArray<HTMLElement>(".master-block").forEach((block) => {
        const copy = block.querySelector(".master-copy");
        const media = block.querySelector(".master-media");
        const portrait = block.querySelector(".master-portrait");
        const img = block.querySelector(".master-img");
        const badges = block.querySelectorAll<HTMLElement>(".master-badge");

        if (copy) {
          gsap.from(copy.children, {
            y: 40,
            opacity: 0,
            stagger: 0.12,
            duration: 1,
            ease: "power3.out",
            scrollTrigger: { trigger: copy, start: "top 80%" },
          });
        }


        if (img && media) {
          gsap.to(img, {
            yPercent: -8,
            ease: "none",
            scrollTrigger: { trigger: media, start: "top bottom", end: "bottom top", scrub: true },
          });
        }

        const cards = block.querySelectorAll<HTMLElement>(".master-badge-card");
        if (cards.length > 0) {
          gsap.fromTo(
            cards,
            {
              y: -18,
              scale: 1.08,
              opacity: 0,
            },
            {
              y: 0,
              scale: 1,
              opacity: 1,
              duration: 0.8,
              delay: 0.2,
              stagger: 0.08,
              ease: "sine.out",
              scrollTrigger: { trigger: block, start: "top 70%" },
            }
          );
        }
      });
    },
    { scope: containerRef, dependencies: [t], revertOnUpdate: true }
  );

  return (
    <div ref={containerRef} id="master" className="relative w-full bg-brand-surface">
      {BLOCKS.map(({ id, badges }) => (
        <section
          key={id}
          id={id}
          className="relative flex h-dvh min-h-dvh w-full flex-col justify-between overflow-hidden px-5 sm:px-6 md:px-8 lg:px-12 pt-[calc(4.5rem+env(safe-area-inset-top,0px))] md:pt-24 pb-6 md:pb-8"
        >
          <div className="master-block mx-auto flex h-full w-full max-w-6xl flex-col items-start justify-between">
            <div className="master-copy flex w-full flex-col items-start shrink-0 mb-3 sm:mb-4 md:mb-6">
              <Badge variant="outline" className="w-fit mb-2 sm:mb-3 border-brand-border/50 font-mono text-[11px] font-normal uppercase tracking-[0.25em] text-brand-border">
                {t.master.label}
              </Badge>
              <h2 className="font-heading text-2xl font-bold tracking-tight text-brand-text sm:text-3xl md:text-4xl lg:text-5xl">{t.master.title}</h2>
            </div>

            <div className="master-media relative mx-auto my-auto w-full max-w-full flex-1 min-h-0 flex items-center justify-center">
              <div className="master-portrait relative aspect-[16/10] h-full max-h-[56vh] sm:max-h-[60vh] md:max-h-[62vh] xl:max-h-[680px] w-auto max-w-full overflow-hidden rounded-3xl bg-brand-elevated shadow-2xl">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/images/image (3).png"
                  alt={t.master.label}
                  className="master-img absolute inset-x-0 top-0 h-[112%] w-full object-cover"
                />
                {t.master.metrics.map((m, i) => (
                  <div key={m.d} className={`master-badge absolute z-10 ${badges[i]}`}>
                    <div className="master-badge-card will-change-transform">
                      <div className="rounded-2xl border border-white bg-white/90 px-3 py-1.5 sm:px-3.5 sm:py-2 md:px-3.5 md:py-2 lg:px-5 lg:py-3 shadow-[0_18px_40px_-12px_rgba(26,31,37,0.35)] ring-1 ring-brand-border/20 backdrop-blur-2xl transition-transform duration-300 hover:scale-105">
                        <div className="font-heading text-base sm:text-lg lg:text-xl font-bold text-brand-text">{m.t}</div>
                        <div className="font-mono text-[8px] sm:text-[9px] lg:text-[10px] uppercase tracking-widest text-brand-text/60">{m.d}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      ))}
    </div>
  );
}
