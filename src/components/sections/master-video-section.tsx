"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { MetricBadge } from "@/components/ui/metric-badge";
import { SectionHeader } from "@/components/ui/section-header";
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
            force3D: true,
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
              force3D: true,
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
          className="relative flex h-dvh min-h-dvh w-full flex-col justify-between overflow-hidden px-5 sm:px-6 md:px-8 lg:px-12 pt-[calc(1.5rem+env(safe-area-inset-top,0px))] sm:pt-[calc(2rem+env(safe-area-inset-top,0px))] md:pt-20 lg:pt-24 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))] md:pb-6 lg:pb-8"
        >
          <div className="master-block mx-auto flex h-full w-full max-w-6xl flex-col items-start justify-between">
            <SectionHeader
              badge={t.master.label}
              title={t.master.title}
              className="master-copy mb-3 sm:mb-4 md:mb-6"
            />

            <div className="master-media relative mx-auto mt-2 mb-auto sm:my-auto w-full max-w-full flex-1 min-h-0 flex items-center justify-center">
              <div className="master-portrait relative aspect-[16/10] h-full max-h-[56vh] sm:max-h-[60vh] md:max-h-[62vh] xl:max-h-[680px] w-auto max-w-full overflow-hidden rounded-3xl bg-brand-elevated shadow-2xl transform-gpu">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/images/image (3).png"
                  alt={t.master.label}
                  className="master-img absolute inset-x-0 top-0 h-[112%] w-full object-cover will-change-transform transform-gpu"
                />
                {t.master.metrics.map((m, i) => (
                  <div key={m.d} className={`master-badge absolute z-10 ${badges[i]}`}>
                    <div className="master-badge-card will-change-transform transform-gpu">
                      <MetricBadge value={m.t} label={m.d} />
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
