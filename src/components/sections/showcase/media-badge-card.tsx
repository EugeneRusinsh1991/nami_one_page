"use client";

import { useRef } from "react";
import { gsap, useGSAP, prefersReducedMotion } from "@/lib/gsap";
import { Card } from "@/components/ui/card";
import { MetricBadge } from "@/components/ui/metric-badge";
import { cn } from "@/lib/utils";

export const MASTER_CARD_CONFIG = {
  width: "w-[58vw] sm:w-[38vw] md:w-[28vw] lg:w-[22vw] max-w-[320px]",
  height: "h-[calc(100%-3.25rem)] sm:h-full",
  container: "h-[calc(100%-3.25rem)] sm:h-full w-[58vw] sm:w-[38vw] md:w-[28vw] lg:w-[22vw] max-w-[320px] shrink-0",
  shadow: "shadow-2xl",
  radius: "rounded-2xl md:rounded-3xl",
  sectionPadding: "pt-[calc(1.25rem+env(safe-area-inset-top,0px))] sm:pt-[calc(2rem+env(safe-area-inset-top,0px))] md:pt-20 lg:pt-24 pb-0 md:pb-6",
  headerMargin: "mb-2 sm:mb-3 md:mb-4",
  mediaPadding: "py-2.5 sm:py-2",
  bottomBarPadding: "pt-1 pb-1 sm:pt-3 md:pb-0",
} as const;

export const BADGE_PLACEMENTS = [
  "-left-7 top-[7%] sm:-left-9 sm:top-[8%] lg:-left-12 lg:top-[9%]",
  "-right-4 top-[24%] sm:-right-6 sm:top-[25%] lg:-right-8 lg:top-[26%]",
  "-left-5 top-[48%] -translate-y-1/2 sm:-left-7 sm:top-[48%] lg:-left-10",
  "-right-7 bottom-[24%] sm:-right-10 sm:bottom-[25%] lg:-right-14 lg:bottom-[26%]",
  "-left-6 bottom-[7%] sm:-left-8 sm:bottom-[8%] lg:-left-11 lg:bottom-[9%]",
];

export const BADGE_PLACEMENTS_MIRRORED = [
  "-right-7 top-[7%] sm:-right-9 sm:top-[8%] lg:-right-12 lg:top-[9%]",
  "-left-4 top-[24%] sm:-left-6 sm:top-[25%] lg:-left-8 lg:top-[26%]",
  "-right-5 top-[48%] -translate-y-1/2 sm:-right-7 sm:top-[48%] lg:-right-10",
  "-left-7 bottom-[24%] sm:-left-10 sm:bottom-[25%] lg:-left-14 lg:bottom-[26%]",
  "-right-6 bottom-[7%] sm:-right-8 sm:bottom-[8%] lg:-right-11 lg:bottom-[9%]",
];

export interface MetricItem {
  t: string;
  d: string;
}

export interface MediaBadgeCardProps {
  image: string;
  alt: string;
  metrics: MetricItem[];
  badges?: string[];
  mirrored?: boolean;
  hasLink?: boolean;
  className?: string;
}

export function MediaBadgeCard({
  image,
  alt,
  metrics,
  badges,
  mirrored = false,
  hasLink = false,
  className,
}: MediaBadgeCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const activeBadges = badges ?? (mirrored ? BADGE_PLACEMENTS_MIRRORED : BADGE_PLACEMENTS);

  useGSAP(
    () => {
      if (!cardRef.current) return;

      const img = cardRef.current.querySelector(".media-badge-img");
      if (img) {
        gsap.to(img, {
          yPercent: -8,
          ease: "none",
          force3D: true,
          scrollTrigger: {
            trigger: cardRef.current,
            start: "top bottom",
            end: "bottom top",
            scrub: true,
          },
        });
      }

      const rings = cardRef.current.querySelectorAll(".media-badge-ring");
      if (rings.length > 0) {
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
              scrollTrigger: {
                trigger: cardRef.current,
                start: "top 80%",
                once: true,
              },
            }
          );
        } else {
          gsap.set(rings, { xPercent: -50, yPercent: -50 });
        }
      }

      const cards = cardRef.current.querySelectorAll<HTMLElement>(".media-badge-card");
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
            scrollTrigger: {
              trigger: cardRef.current,
              start: "top 70%",
            },
          }
        );
      }
    },
    { scope: cardRef }
  );

  return (
    <div
      ref={cardRef}
      className={cn(
        "media-portrait relative transform-gpu",
        hasLink ? "aspect-[9/16]" : "aspect-[1/2]",
        "h-auto max-h-full w-[68vw] sm:w-[46vw] md:w-[34vw] lg:w-[28vw] max-w-[340px] md:max-w-[380px] lg:max-w-[400px]",
        className
      )}
    >
      <div
        aria-hidden
        className="media-badge-ring master-ring guide-ring pointer-events-none absolute left-1/2 top-1/2 h-[118%] w-[118%] rounded-[3rem] border border-brand-border/25 sm:rounded-[4rem]"
      />
      <div
        aria-hidden
        className="media-badge-ring master-ring guide-ring pointer-events-none absolute left-1/2 top-1/2 h-[136%] w-[136%] rounded-[4rem] border border-brand-border/15 sm:rounded-[5rem]"
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
          src={image}
          alt={alt}
          className="media-badge-img master-img guide-img absolute inset-x-0 top-0 h-[112%] w-full object-cover will-change-transform transform-gpu"
        />
      </Card>
      {metrics.map((m, i) => (
        <div key={i} className={cn("media-badge absolute z-10", activeBadges[i] || "")}>
          <div className="media-badge-card master-badge-card guide-badge-card will-change-transform transform-gpu">
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
  );
}
