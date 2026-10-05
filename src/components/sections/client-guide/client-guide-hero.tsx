"use client";

import { useRef } from "react";
import { gsap, useGSAP, prefersReducedMotion } from "@/lib/gsap";
import { Card, MASTER_CARD_CONFIG } from "@/components/ui/card";
import { MetricBadge } from "@/components/ui/metric-badge";
import { SectionHeader } from "@/components/ui/section-header";
import { useLanguage } from "@/components/providers/language-provider";
import { cn } from "@/lib/utils";

const BADGE_PLACEMENTS = [
  "-left-7 top-[7%] sm:-left-9 sm:top-[8%] lg:-left-12 lg:top-[9%]",
  "-right-4 top-[24%] sm:-right-6 sm:top-[25%] lg:-right-8 lg:top-[26%]",
  "-left-5 top-[48%] -translate-y-1/2 sm:-left-7 sm:top-[48%] lg:-left-10",
  "-right-7 bottom-[24%] sm:-right-10 sm:bottom-[25%] lg:-right-14 lg:bottom-[26%]",
  "-left-6 bottom-[7%] sm:-left-8 sm:bottom-[8%] lg:-left-11 lg:bottom-[9%]",
];

export interface ClientGuideHeroProps {
  className?: string;
}

export function ClientGuideHero({ className }: ClientGuideHeroProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { t } = useLanguage();

  useGSAP(
    () => {
      const copy = containerRef.current?.querySelector(".guide-copy");
      const media = containerRef.current?.querySelector(".guide-media");
      const img = containerRef.current?.querySelector(".guide-img");

      if (copy) {
        gsap.from(copy.children, {
          y: 30,
          opacity: 0,
          stagger: 0.12,
          duration: 1,
          ease: "power3.out",
          scrollTrigger: { trigger: copy, start: "top 85%" },
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

      if (!prefersReducedMotion()) {
        const decors = containerRef.current?.querySelectorAll(".guide-decor");
        if (decors && decors.length > 0) {
          gsap.to(decors, {
            yPercent: 12,
            ease: "none",
            scrollTrigger: { trigger: containerRef.current, start: "top bottom", end: "bottom top", scrub: true },
          });
        }

        const dots = containerRef.current?.querySelectorAll(".guide-dots");
        if (dots && dots.length > 0) {
          gsap.to(dots, {
            yPercent: -20,
            ease: "none",
            scrollTrigger: { trigger: containerRef.current, start: "top bottom", end: "bottom top", scrub: true },
          });
        }
      }

      const rings = containerRef.current?.querySelectorAll(".guide-ring");
      if (rings && rings.length > 0) {
        if (!prefersReducedMotion()) {
          gsap.fromTo(
            rings,
            { scale: 0.92, opacity: 0, xPercent: -50, yPercent: -50 },
            {
              scale: 1,
              opacity: 1,
              xPercent: -50,
              yPercent: -50,
              duration: 1.2,
              ease: "power3.out",
              stagger: 0.12,
              scrollTrigger: { trigger: media ?? containerRef.current, start: "top 80%", once: true },
            }
          );
        } else {
          gsap.set(rings, { xPercent: -50, yPercent: -50 });
        }
      }

      const cards = containerRef.current?.querySelectorAll<HTMLElement>(".guide-badge-card");
      if (cards && cards.length > 0) {
        gsap.fromTo(
          cards,
          {
            y: -16,
            scale: 1.06,
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
            scrollTrigger: { trigger: containerRef.current, start: "top 70%" },
          }
        );
      }
    },
    { scope: containerRef }
  );

  return (
    <section
      ref={containerRef}
      className={cn(
        "client-guide-hero relative w-full overflow-hidden bg-brand-surface px-4 sm:px-6 py-12 sm:py-16 md:py-20 lg:py-24 isolate",
        className
      )}
    >
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="guide-decor absolute -top-24 -left-20 h-72 w-72 rounded-full bg-brand-bg blur-3xl sm:h-96 sm:w-96" />
        <div className="guide-decor absolute -bottom-24 -right-20 h-72 w-72 rounded-full bg-brand-elevated/70 blur-3xl sm:h-96 sm:w-96" />
        <div className="guide-dots absolute top-[8%] right-4 hidden h-32 w-32 opacity-40 [background-image:radial-gradient(#7C8794_1.5px,transparent_1.5px)] [background-size:14px_14px] sm:block sm:h-40 sm:w-40 sm:right-10" />
        <span className="absolute bottom-2 left-3 hidden select-none whitespace-nowrap text-[8rem] font-bold uppercase leading-none tracking-tighter text-brand-accent/20 sm:block lg:text-[12rem]">
          {t.clientGuide.hero.label}
        </span>
      </div>

      <div className="relative mx-auto flex w-full max-w-6xl flex-col items-center gap-12 md:grid md:grid-cols-2 md:gap-12 lg:gap-16">
        <div className="guide-copy w-full max-w-lg shrink-0 text-left md:justify-self-start">
          <SectionHeader
            align="left"
            badge={t.clientGuide.hero.label}
            title={t.clientGuide.hero.title}
            titleClassName="break-words font-heading text-3xl sm:text-4xl md:text-5xl font-medium tracking-tight"
            className="w-full items-start text-left"
          />
        </div>

        <div className="guide-media relative flex w-full items-center justify-center py-6 sm:py-8 md:py-0">
          <div
            className={cn(
              "guide-portrait relative transform-gpu",
              "h-auto aspect-[1/2] max-h-[580px] w-[62vw] sm:w-[44vw] md:w-[32vw] lg:w-[26vw] max-w-[320px] md:max-w-[340px] lg:max-w-[360px]"
            )}
          >
            <div
              aria-hidden
              className="guide-ring pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[118%] w-[118%] rounded-[3rem] border border-brand-border/25 sm:rounded-[4rem]"
            />
            <div
              aria-hidden
              className="guide-ring pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[136%] w-[136%] rounded-[4rem] border border-brand-border/15 sm:rounded-[5rem]"
            />
            <Card
              variant="elevated"
              className={cn(
                "absolute inset-0 overflow-hidden",
                MASTER_CARD_CONFIG.radius,
                MASTER_CARD_CONFIG.shadow
              )}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/image (3).png"
                alt={t.clientGuide.hero.label}
                className="guide-img absolute inset-x-0 top-0 h-[112%] w-full object-cover will-change-transform transform-gpu"
              />
            </Card>
            {t.clientGuide.hero.metrics.map((m, i) => (
              <div key={i} className={cn("guide-badge absolute z-10", BADGE_PLACEMENTS[i] || "")}>
                <div className="guide-badge-card will-change-transform transform-gpu">
                  <MetricBadge
                    value={m.t}
                    label={m.d}
                    className="w-auto min-w-[110px] max-w-[155px] sm:min-w-[135px] sm:max-w-[195px] lg:min-w-[160px] lg:max-w-[230px] px-3.5 py-2 sm:px-4 sm:py-2.5 lg:px-5 lg:py-3"
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
  );
}
