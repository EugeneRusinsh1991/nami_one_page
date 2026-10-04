"use client";

import { useRef } from "react";
import { Droplets, Fingerprint, Ruler, Sparkles } from "lucide-react";
import { gsap, useGSAP } from "@/lib/gsap";
import { cn } from "@/lib/utils";
import { SectionHeader } from "@/components/ui/section-header";
import { Card } from "@/components/ui/card";
import { Heading, Text } from "@/components/ui/typography";
import { useLanguage } from "@/components/providers/language-provider";

const ICONS = [Ruler, Droplets, Fingerprint, Sparkles];
const SPANS = [
  "col-span-1 row-span-2 col-start-1 row-start-1 md:col-span-2 md:row-span-2 md:col-start-1 md:row-start-1",
  "col-span-2 row-span-1 col-start-1 row-start-3 md:col-span-2 md:row-span-1 md:col-start-3 md:row-start-1",
  "col-span-1 row-span-1 col-start-2 row-start-1 md:col-span-1 md:row-span-1 md:col-start-3 md:row-start-2",
  "col-span-1 row-span-1 col-start-2 row-start-2 md:col-span-1 md:row-span-1 md:col-start-4 md:row-start-2",
];

export function PhilosophySection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { t } = useLanguage();

  useGSAP(
    () => {
      gsap.fromTo(
        ".philo-head",
        { y: 30, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.9,
          ease: "power3.out",
          scrollTrigger: { trigger: ".philo-head", start: "top 85%", once: true },
        }
      );
      gsap.fromTo(
        ".philo-card",
        { y: 40, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.9,
          ease: "power3.out",
          stagger: 0.08,
          force3D: true,
          scrollTrigger: { trigger: ".philo-grid", start: "top 85%", once: true },
        }
      );
      gsap.to(".philo-img", {
        yPercent: -6,
        ease: "none",
        force3D: true,
        scrollTrigger: { trigger: ".philo-grid", start: "top bottom", end: "bottom top", scrub: true },
      });
    },
    { scope: containerRef, dependencies: [t], revertOnUpdate: true }
  );

  return (
    <section
      ref={containerRef}
      id="philosophy"
      className="relative z-20 h-dvh min-h-dvh max-h-dvh overflow-hidden rounded-t-[2rem] bg-brand-bg px-5 pt-[calc(1.5rem+env(safe-area-inset-top,0px))] pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))] shadow-[0_-20px_60px_rgba(26,31,37,0.06)] md:rounded-t-[2.5rem] md:px-6 md:pt-20 md:pb-8 lg:pt-24 lg:pb-10"
    >
      <div className="mx-auto flex h-full w-full max-w-6xl flex-col justify-start sm:justify-center">
        <SectionHeader
          badge={t.philo.label}
          title={t.philo.title}
          className="philo-head mb-3 shrink-0 max-w-2xl sm:mb-4 md:mb-8 lg:mb-10"
        />

        <div className="philo-grid grid w-full h-[52dvh] max-h-[440px] min-h-[320px] grid-cols-2 grid-rows-3 gap-2.5 sm:gap-3 md:h-[56dvh] md:max-h-[500px] md:grid-cols-4 md:grid-rows-2 md:auto-rows-[minmax(0,1fr)] md:gap-4 lg:h-[58dvh] lg:max-h-[540px]">
          {t.philo.cards.map((card, i) => {
            const Icon = ICONS[i];
            return (
              <Card
                key={card.t}
                variant="surface"
                className={cn(
                  "philo-card will-change-transform transform-gpu group relative flex flex-col justify-between p-3 sm:p-4 md:p-6 lg:p-7",
                  SPANS[i]
                )}
              >
                {i === 1 && (
                  <div className="pointer-events-none absolute inset-y-0 right-0 w-2/5 overflow-hidden rounded-r-2xl md:w-1/2 md:rounded-r-3xl">
                    <div className="philo-img absolute inset-x-0 top-0 h-[115%] w-full will-change-transform transform-gpu">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src="/images/image (4).png"
                        alt=""
                        className="h-full w-full object-cover opacity-75 transition-transform duration-700 group-hover:scale-105 md:opacity-80"
                      />
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-r from-brand-surface via-brand-surface/40 to-transparent transition-colors duration-500 group-hover:from-brand-elevated" />
                  </div>
                )}
                <Icon
                  className="relative z-10 h-5 w-5 shrink-0 text-brand-border transition-transform duration-500 group-hover:rotate-12 md:h-8 md:w-8"
                  strokeWidth={1.25}
                />
                <div className={cn("relative z-10 max-w-xs", i === 1 && "max-w-[62%] md:max-w-[45%]")}>
                  <Heading as="h3" size="h4" className="mb-0.5 text-xs font-semibold leading-snug sm:text-sm md:mb-2 md:text-xl">
                    {card.t}
                  </Heading>
                  <Text variant="subtle" className="text-[11px] leading-snug sm:text-xs md:text-sm md:leading-relaxed line-clamp-3 md:line-clamp-none">
                    {card.d}
                  </Text>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
