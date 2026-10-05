"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { MetricBadge } from "@/components/ui/metric-badge";
import { SectionHeader } from "@/components/ui/section-header";
import { useLanguage } from "@/components/providers/language-provider";

const BADGE_PLACEMENTS = [
  "-left-5 top-2.5 sm:-left-8 sm:top-6 lg:-left-12 lg:top-8",
  "-right-5 top-2.5 sm:-right-8 sm:top-6 lg:-right-12 lg:top-8",
  "-left-6 top-[48%] -translate-y-1/2 sm:-left-10 sm:top-1/2 lg:-left-14",
  "-right-5 bottom-2.5 sm:-right-8 sm:bottom-6 lg:-right-12 lg:bottom-8",
  "-left-5 bottom-2.5 sm:-left-8 sm:bottom-6 lg:-left-12 lg:bottom-8",
];

const BADGE_PLACEMENTS_2 = [
  "-right-5 top-2.5 sm:-right-8 sm:top-6 lg:-right-12 lg:top-8",
  "-left-5 top-2.5 sm:-left-8 sm:top-6 lg:-left-12 lg:top-8",
  "-right-6 top-[48%] -translate-y-1/2 sm:-right-10 sm:top-1/2 lg:-right-14",
  "-left-5 bottom-2.5 sm:-left-8 sm:bottom-6 lg:-left-12 lg:bottom-8",
  "-right-5 bottom-2.5 sm:-right-8 sm:bottom-6 lg:-right-12 lg:bottom-8",
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
          className="relative flex h-svh min-h-svh w-full flex-col justify-between overflow-hidden px-4 sm:px-6 md:px-8 lg:px-12 pt-[calc(1rem+env(safe-area-inset-top,0px))] sm:pt-[calc(2rem+env(safe-area-inset-top,0px))] md:pt-20 lg:pt-24 pb-[calc(1rem+env(safe-area-inset-bottom,0px))] sm:pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))] md:pb-6 lg:pb-8"
        >
          <div className="master-block mx-auto flex h-full w-full max-w-6xl flex-col items-start justify-between">
            <SectionHeader
              badge={t.master.label}
              title={t.master.title}
              className="master-copy mb-2 sm:mb-4 md:mb-6"
            />

            <div className="master-media relative mx-auto my-auto w-full max-w-full flex-1 min-h-0 flex items-center justify-center">
              <div className="master-portrait relative aspect-[1.12/1] h-full max-h-[50vh] sm:max-h-[58vh] md:max-h-[60vh] xl:max-h-[660px] w-auto max-w-[76%] sm:max-w-full transform-gpu">
                <div className="absolute inset-0 overflow-hidden rounded-2xl sm:rounded-3xl bg-brand-elevated shadow-2xl">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/images/image (3).png"
                    alt={t.master.label}
                    className="master-img absolute inset-x-0 top-0 h-[112%] w-full object-cover will-change-transform transform-gpu"
                  />
                </div>
                {t.master.metrics.map((m, i) => (
                  <div key={m.d} className={`master-badge absolute z-10 ${badges[i]}`}>
                    <div className="master-badge-card will-change-transform transform-gpu">
                      <MetricBadge
                        value={m.t}
                        label={m.d}
                        className="w-auto max-w-[135px] sm:max-w-[185px] lg:max-w-[220px] px-2.5 py-1.5 sm:px-4 sm:py-2.5 lg:px-5 lg:py-3 shadow-[0_12px_32px_-8px_rgba(26,31,37,0.28)]"
                        valueClassName="text-sm sm:text-base md:text-lg lg:text-xl font-bold whitespace-nowrap leading-none mb-0.5 sm:mb-1"
                        labelClassName="text-[10px] sm:text-[11px] lg:text-xs uppercase tracking-wider text-brand-text/70 leading-snug break-words hyphens-none"
                      />
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
