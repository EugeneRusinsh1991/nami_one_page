"use client";

import { useRef } from "react";
import { Droplets, Fingerprint, Ruler, Sparkles } from "lucide-react";
import { gsap, prefersReducedMotion, revealOnScroll, useGSAP } from "@/lib/gsap";
import { cn } from "@/lib/utils";
import { SectionHeader } from "@/components/ui/section-header";
import { Card } from "@/components/ui/card";
import { Heading } from "@/components/ui/typography";
import { useLanguage } from "@/components/providers/language-provider";

const ICONS = [Ruler, Droplets, Fingerprint, Sparkles];
const SPANS = [
  "col-span-1 row-span-2 col-start-1 row-start-1 md:col-span-2 md:row-span-2 md:col-start-1 md:row-start-1",
  "col-span-2 row-span-1 col-start-1 row-start-3 md:col-span-2 md:row-span-1 md:col-start-3 md:row-start-1",
  "col-span-1 row-span-1 col-start-2 row-start-1 md:col-span-1 md:row-span-1 md:col-start-3 md:row-start-2",
  "col-span-1 row-span-1 col-start-2 row-start-2 md:col-span-1 md:row-span-1 md:col-start-4 md:row-start-2",
];
const CARD_MEDIA = [
  {
    src: "/images/image (3).png",
    containerClass: "w-3/5 md:w-3/5",
    maskClass: "[mask-image:linear-gradient(to_right,transparent_0%,transparent_15%,black_60%,black_100%)] [-webkit-mask-image:linear-gradient(to_right,transparent_0%,transparent_15%,black_60%,black_100%)]",
    imgClass: "object-cover object-[center_15%] opacity-70 group-hover:scale-105 group-hover:opacity-60 group-hover:brightness-[0.92] md:opacity-80 md:group-hover:opacity-70",
    textClass: "max-w-[75%] md:max-w-[55%]",
  },
  {
    src: "/images/image (4).png",
    containerClass: "w-2/5 md:w-1/2",
    maskClass: "[mask-image:linear-gradient(to_right,transparent_0%,transparent_15%,black_55%,black_100%)] [-webkit-mask-image:linear-gradient(to_right,transparent_0%,transparent_15%,black_55%,black_100%)]",
    imgClass: "object-cover opacity-75 group-hover:scale-105 group-hover:opacity-65 group-hover:brightness-[0.92] md:opacity-80 md:group-hover:opacity-70",
    textClass: "max-w-[62%] md:max-w-[45%]",
  },
  {
    src: "/images/image (2).png",
    containerClass: "w-1/2 md:w-1/2",
    maskClass: "[mask-image:linear-gradient(to_right,transparent_0%,transparent_10%,black_50%,black_100%)] [-webkit-mask-image:linear-gradient(to_right,transparent_0%,transparent_10%,black_50%,black_100%)]",
    imgClass: "object-cover object-left opacity-60 group-hover:scale-105 group-hover:opacity-50 group-hover:brightness-[0.92] md:opacity-75 md:group-hover:opacity-65",
    textClass: "max-w-[80%]",
  },
  {
    src: "/images/image (4).png",
    containerClass: "w-1/2 md:w-1/2",
    maskClass: "[mask-image:linear-gradient(to_right,transparent_0%,transparent_10%,black_50%,black_100%)] [-webkit-mask-image:linear-gradient(to_right,transparent_0%,transparent_10%,black_50%,black_100%)]",
    imgClass: "object-cover object-[85%_center] opacity-60 group-hover:scale-105 group-hover:opacity-50 group-hover:brightness-[0.92] md:opacity-75 md:group-hover:opacity-65",
    textClass: "max-w-[80%]",
  },
];

export function PhilosophySection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { t } = useLanguage();

  useGSAP(
    () => {
      revealOnScroll(".philo-head", ".philo-head", { y: 30 });
      revealOnScroll(".philo-card", ".philo-grid", {
        y: 40,
        scale: 0.97,
        stagger: 0.08,
      });
      if (!prefersReducedMotion()) {
        gsap.to(".philo-img", {
          yPercent: -6,
          ease: "none",
          force3D: true,
          scrollTrigger: { trigger: ".philo-grid", start: "top bottom", end: "bottom top", scrub: true },
        });
      }
    },
    { scope: containerRef }
  );

  return (
    <section
      ref={containerRef}
      id="philosophy"
      className="section-screen z-20 flex flex-col justify-start md:justify-center rounded-t-[2rem] bg-brand-bg shadow-[0_-20px_60px_rgba(26,31,37,0.06)] md:rounded-t-[2.5rem]"
    >
      <div className="mx-auto flex h-[100svh] max-h-[100svh] md:h-full md:max-h-full w-full max-w-6xl flex-col justify-center px-4 pt-[calc(0.75rem+var(--app-safe-top,0px))] pb-[calc(0.75rem+var(--app-safe-bottom,0px))] sm:px-5 sm:pt-[calc(1.5rem+var(--app-safe-top,0px))] sm:pb-[calc(1.5rem+var(--app-safe-bottom,0px))] md:px-6 md:pt-20 md:pb-8 lg:pt-24 lg:pb-10">
        <SectionHeader
          badge={t.philo.label}
          title={t.philo.title}
          className="philo-head mb-2 shrink-0 max-w-2xl sm:mb-4 md:mb-8 lg:mb-10 isolate"
        />

        <div className="philo-grid isolate relative grid w-full min-h-0 flex-1 grid-cols-2 grid-rows-3 gap-2 sm:gap-3 md:grid-cols-4 md:grid-rows-2 md:auto-rows-[minmax(0,1fr)] md:gap-4">
          {t.philo.cards.map((card, i) => {
            const Icon = ICONS[i];
            const media = CARD_MEDIA[i];
            return (
              <Card
                key={i}
                variant="surface"
                className={cn(
                  "philo-card will-change-transform transform-gpu isolate group relative flex flex-col justify-between p-2 sm:p-4 md:p-6 lg:p-7 transition-shadow duration-500 hover:shadow-xl",
                  SPANS[i]
                )}
              >
                {media && (
                  <div
                    className={cn(
                      "pointer-events-none absolute inset-y-0 right-0 overflow-hidden rounded-r-2xl md:rounded-r-3xl isolate",
                      media.containerClass,
                      media.maskClass
                    )}
                  >
                    <div className="philo-img absolute inset-x-0 top-0 h-[115%] w-full will-change-transform transform-gpu">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={media.src}
                        alt=""
                        className={cn("h-full w-full transition-all duration-700", media.imgClass)}
                      />
                    </div>
                  </div>
                )}
                <Icon
                  className="relative z-10 h-4 w-4 shrink-0 text-brand-border transition-transform duration-500 group-hover:rotate-12 sm:h-5 sm:w-5 md:h-8 md:w-8"
                  strokeWidth={1.25}
                />
                <div className={cn("relative z-10 max-w-xs", media?.textClass)}>
                  <Heading as="h3" size="h4" className="text-sm font-semibold leading-tight sm:text-base md:text-2xl">
                    {card.t}
                  </Heading>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
