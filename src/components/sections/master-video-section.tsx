"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { Card } from "@/components/ui/card";
import { MetricBadge } from "@/components/ui/metric-badge";
import { SectionHeader } from "@/components/ui/section-header";
import { useLanguage } from "@/components/providers/language-provider";
import { cn } from "@/lib/utils";

const BADGE_PLACEMENTS = [
  "-left-7 top-[7%] sm:-left-9 sm:top-[9%] lg:-left-12 lg:top-[10%]",
  "-right-4 top-[21%] sm:-right-6 sm:top-[22%] lg:-right-8 lg:top-[24%]",
  "-left-5 top-[47%] -translate-y-1/2 sm:-left-7 sm:top-[48%] lg:-left-10",
  "-right-7 bottom-[23%] sm:-right-10 sm:bottom-[24%] lg:-right-14 lg:bottom-[25%]",
  "-left-6 bottom-[8%] sm:-left-8 sm:bottom-[9%] lg:-left-11 lg:bottom-[10%]",
];

const BADGE_PLACEMENTS_2 = [
  "-right-7 top-[7%] sm:-right-9 sm:top-[9%] lg:-right-12 lg:top-[10%]",
  "-left-4 top-[21%] sm:-left-6 sm:top-[22%] lg:-left-8 lg:top-[24%]",
  "-right-5 top-[47%] -translate-y-1/2 sm:-right-7 sm:top-[48%] lg:-right-10",
  "-left-7 bottom-[23%] sm:-left-10 sm:bottom-[24%] lg:-left-14 lg:bottom-[25%]",
  "-right-6 bottom-[8%] sm:-right-8 sm:bottom-[9%] lg:-right-11 lg:bottom-[10%]",
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
    { scope: containerRef }
  );

  return (
    <div ref={containerRef} id="master" className="relative w-full bg-brand-surface">
      {BLOCKS.map(({ id, badges, mirrored }) => (
        <section
          key={id}
          id={id}
          className="master-block relative flex h-svh min-h-svh max-h-svh w-full items-center justify-center overflow-hidden bg-brand-surface px-4 sm:px-6 pt-[calc(1.5rem+env(safe-area-inset-top,0px))] pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))] sm:py-12 md:py-16"
        >
          <div className="mx-auto flex h-full max-h-full w-full max-w-6xl flex-col justify-center gap-6 sm:gap-8 md:grid md:grid-cols-2 md:gap-12 lg:gap-16 md:items-center">
            <SectionHeader
              align={mirrored ? "left" : "right"}
              badge={t.master.label}
              title={t.master.title}
              className={cn(
                "master-copy shrink-0 max-w-md",
                mirrored
                  ? "order-1 md:order-2 md:justify-self-start md:mr-auto"
                  : "order-1 md:order-1 md:justify-self-end md:ml-auto"
              )}
            />

            <div
              className={cn(
                "master-media relative flex w-full items-center justify-center",
                mirrored
                  ? "order-2 md:order-1"
                  : "order-2 md:order-2"
              )}
            >
              <div className="master-portrait relative h-[52svh] sm:h-[58svh] md:h-[62svh] lg:h-[68svh] max-h-[580px] aspect-[9/14] sm:aspect-[3/5] shrink-0 transform-gpu">
                <Card
                  variant="elevated"
                  className="absolute inset-0 overflow-hidden rounded-2xl md:rounded-3xl shadow-2xl"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/images/image (3).png"
                    alt={t.master.label}
                    className="master-img absolute inset-x-0 top-0 h-[112%] w-full object-cover will-change-transform transform-gpu"
                  />
                </Card>
                {t.master.metrics.map((m, i) => (
                  <div key={i} className={`master-badge absolute z-10 ${badges[i]}`}>
                    <div className="master-badge-card will-change-transform transform-gpu">
                      <MetricBadge
                        value={m.t}
                        label={m.d}
                        className="w-auto min-w-[112px] max-w-[155px] sm:min-w-[140px] sm:max-w-[205px] lg:min-w-[165px] lg:max-w-[245px] px-4 py-2.5 sm:px-5 sm:py-3 lg:px-6 lg:py-3.5"
                        valueClassName="text-sm sm:text-base md:text-lg lg:text-xl font-bold whitespace-nowrap leading-none mb-1 sm:mb-1.5"
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
