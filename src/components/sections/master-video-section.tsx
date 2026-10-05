"use client";

import { useRef } from "react";
import { ArrowUpRight } from "lucide-react";
import { gsap, useGSAP, prefersReducedMotion } from "@/lib/gsap";
import { Button } from "@/components/ui/button";
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

const BADGE_PLACEMENTS_2 = [
  "-right-7 top-[7%] sm:-right-9 sm:top-[8%] lg:-right-12 lg:top-[9%]",
  "-left-4 top-[24%] sm:-left-6 sm:top-[25%] lg:-left-8 lg:top-[26%]",
  "-right-5 top-[48%] -translate-y-1/2 sm:-right-7 sm:top-[48%] lg:-right-10",
  "-left-7 bottom-[24%] sm:-left-10 sm:bottom-[25%] lg:-left-14 lg:bottom-[26%]",
  "-right-6 bottom-[7%] sm:-right-8 sm:bottom-[8%] lg:-right-11 lg:bottom-[9%]",
];

export function MasterVideoSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { t } = useLanguage();

  const BLOCKS = [
    {
      id: "master",
      image: "/images/image (3).png",
      data: t.master,
      badges: BADGE_PLACEMENTS,
      mirrored: false,
    },
    {
      id: "studio",
      image: "/images/image (4).png",
      data: t.studio,
      badges: BADGE_PLACEMENTS_2,
      mirrored: true,
    },
    {
      id: "academy",
      image: "/images/image (2).png",
      data: t.academy,
      badges: BADGE_PLACEMENTS,
      mirrored: false,
    },
  ];

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

        if (!prefersReducedMotion()) {
          gsap.to(block.querySelectorAll(".master-decor"), {
            yPercent: 12,
            ease: "none",
            scrollTrigger: { trigger: block, start: "top bottom", end: "bottom top", scrub: true },
          });
          gsap.to(block.querySelectorAll(".master-dots"), {
            yPercent: -20,
            ease: "none",
            scrollTrigger: { trigger: block, start: "top bottom", end: "bottom top", scrub: true },
          });
        }

        const rings = block.querySelectorAll(".master-ring");
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
                scrollTrigger: { trigger: media ?? block, start: "top 80%", once: true },
              }
            );
          } else {
            gsap.set(rings, { xPercent: -50, yPercent: -50 });
          }
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
    <div ref={containerRef} className="relative w-full bg-brand-surface">
      {BLOCKS.map(({ id, image, data, badges, mirrored }) => (
        <section
          key={id}
          id={id}
          className={cn(
            "master-block relative flex min-h-[100dvh] w-full flex-col justify-between overflow-hidden bg-brand-surface px-4 sm:px-6 isolate",
            MASTER_CARD_CONFIG.sectionPadding
          )}
        >
          <div aria-hidden className="pointer-events-none absolute inset-0">
            <div
              className={cn(
                "master-decor absolute -top-24 h-72 w-72 rounded-full bg-brand-bg blur-3xl sm:h-96 sm:w-96",
                mirrored ? "-right-20" : "-left-20"
              )}
            />
            <div
              className={cn(
                "master-decor absolute -bottom-24 h-72 w-72 rounded-full bg-brand-elevated/70 blur-3xl sm:h-96 sm:w-96",
                mirrored ? "-left-20" : "-right-20"
              )}
            />
            <div
              className={cn(
                "master-dots absolute top-[8%] hidden h-32 w-32 opacity-40 [background-image:radial-gradient(#7C8794_1.5px,transparent_1.5px)] [background-size:14px_14px] sm:block sm:h-40 sm:w-40",
                mirrored ? "left-4 sm:left-10" : "right-4 sm:right-10"
              )}
            />
            <span
              className={cn(
                "absolute bottom-2 hidden select-none whitespace-nowrap text-[8rem] font-bold uppercase leading-none tracking-tighter text-brand-accent/20 sm:block lg:text-[12rem]",
                mirrored ? "right-3 sm:right-10" : "left-3 sm:left-10"
              )}
            >
              {data.label}
            </span>
          </div>
          <div className="relative mx-auto flex flex-1 h-full max-h-full w-full max-w-6xl flex-col justify-between md:grid md:grid-cols-2 md:gap-12 lg:gap-16 md:items-center">
            <div
              className={cn(
                "master-copy shrink-0 w-full max-w-md",
                MASTER_CARD_CONFIG.headerMargin,
                mirrored
                  ? "order-1 md:order-2 md:justify-self-start md:mr-auto"
                  : "order-1 md:order-1 md:justify-self-end md:ml-auto"
              )}
            >
              <SectionHeader
                align="left"
                badge={data.label}
                title={data.title}
                titleClassName="break-words"
                className={cn(
                  "w-full items-start text-left",
                  mirrored ? "md:items-start md:text-left" : "md:items-end md:text-right"
                )}
              />
            </div>

            <div
              className={cn(
                "master-media relative flex flex-1 min-h-0 w-full flex-col items-center justify-center py-1 sm:py-2 md:py-0",
                mirrored
                  ? "order-2 md:order-1"
                  : "order-2 md:order-2"
              )}
            >
              <div
                className={cn(
                  "master-portrait relative transform-gpu",
                  Boolean(data.link) ? "aspect-[9/16]" : "aspect-[1/2]",
                  "h-auto max-h-full w-[68vw] sm:w-[46vw] md:w-[34vw] lg:w-[28vw] max-w-[340px] md:max-w-[380px] lg:max-w-[400px]"
                )}
              >
                <div aria-hidden className="master-ring pointer-events-none absolute left-1/2 top-1/2 h-[118%] w-[118%] rounded-[3rem] border border-brand-border/25 sm:rounded-[4rem]" />
                <div aria-hidden className="master-ring pointer-events-none absolute left-1/2 top-1/2 h-[136%] w-[136%] rounded-[4rem] border border-brand-border/15 sm:rounded-[5rem]" />
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
                    alt={data.label}
                    className="master-img absolute inset-x-0 top-0 h-[112%] w-full object-cover will-change-transform transform-gpu"
                  />
                </Card>
                {data.metrics.map((m, i) => (
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

              {data.link && (
                <div className="mt-3 sm:mt-3.5 w-[68vw] sm:w-[46vw] md:w-[34vw] lg:w-[28vw] max-w-[340px] md:max-w-[380px] lg:max-w-[400px] shrink-0 z-20">
                  <Button asChild variant="brand-primary" size="default" className="w-full shadow-md hover:-translate-y-0.5 transition-transform">
                    <a
                      href={data.link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex w-full items-center justify-center gap-2"
                    >
                      <span>{data.link.text}</span>
                      <ArrowUpRight className="h-4 w-4 shrink-0" />
                    </a>
                  </Button>
                </div>
              )}
            </div>

            <div
              aria-hidden="true"
              className={cn(
                "order-3 w-full shrink-0 md:hidden",
                Boolean(data.link) ? "h-6 sm:h-8" : "h-10 sm:h-12",
                MASTER_CARD_CONFIG.bottomBarPadding
              )}
            />
          </div>
        </section>
      ))}
    </div>
  );
}
