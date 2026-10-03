"use client";

import { useRef } from "react";
import { Droplets, Fingerprint, Ruler, Sparkles } from "lucide-react";
import { gsap, useGSAP } from "@/lib/gsap";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { useLanguage } from "@/components/providers/language-provider";

const ICONS = [Ruler, Droplets, Fingerprint, Sparkles];
const SPANS = [
  "md:col-span-2 md:row-span-2",
  "md:col-span-2",
  "md:col-span-1",
  "md:col-span-1",
];

export function PhilosophySection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { t } = useLanguage();

  useGSAP(
    () => {
      gsap.from(".philo-head", {
        y: 40,
        opacity: 0,
        duration: 1,
        ease: "power3.out",
        scrollTrigger: { trigger: ".philo-head", start: "top 85%" },
      });
      gsap.from(".philo-card", {
        y: 60,
        opacity: 0,
        duration: 1,
        ease: "power3.out",
        stagger: 0.12,
        scrollTrigger: { trigger: ".philo-grid", start: "top 80%" },
      });
      gsap.to(".philo-img", {
        yPercent: -6,
        ease: "none",
        scrollTrigger: { trigger: ".philo-grid", start: "top bottom", end: "bottom top", scrub: true },
      });
    },
    { scope: containerRef, dependencies: [t], revertOnUpdate: true }
  );

  return (
    <section
      ref={containerRef}
      id="philosophy"
      className="relative z-20 -mt-6 rounded-t-[2.5rem] bg-brand-bg px-6 py-28 shadow-[0_-20px_60px_rgba(26,31,37,0.06)]"
    >
      <div className="mx-auto max-w-6xl">
        <div className="philo-head mb-14 max-w-2xl">
          <Badge variant="outline" className="mb-5 border-brand-border/50 font-mono text-[11px] font-normal uppercase tracking-[0.25em] text-brand-border">
            {t.philo.label}
          </Badge>
          <h2 className="font-heading text-3xl font-bold tracking-tight text-brand-text sm:text-5xl">{t.philo.title}</h2>
        </div>

        <div className="philo-grid grid auto-rows-[minmax(240px,auto)] grid-cols-1 gap-4 md:grid-cols-4">
          {t.philo.cards.map((card, i) => {
            const Icon = ICONS[i];
            return (
              <Card
                key={card.t}
                className={cn(
                  "philo-card group relative flex flex-col justify-between overflow-hidden rounded-3xl border-brand-border/20 bg-brand-surface p-7 transition-all duration-500 hover:-translate-y-1 hover:bg-brand-elevated hover:shadow-xl",
                  SPANS[i]
                )}
              >
                {i === 1 && (
                  <div className="pointer-events-none absolute inset-y-0 right-0 w-1/2 overflow-hidden rounded-r-3xl">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="/images/image (4).png"
                      alt=""
                      className="philo-img absolute inset-x-0 top-0 h-[115%] w-full object-cover opacity-80 transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-brand-surface via-brand-surface/40 to-transparent transition-colors duration-500 group-hover:from-brand-elevated" />
                  </div>
                )}
                <Icon className="relative z-10 h-8 w-8 text-brand-border transition-transform duration-500 group-hover:rotate-12" strokeWidth={1.25} />
                <div className={cn("relative z-10 max-w-xs", i === 1 && "md:max-w-[45%]")}>
                  <h3 className="mb-2 font-heading text-xl font-semibold text-brand-text">{card.t}</h3>
                  <p className="text-sm leading-relaxed text-brand-text/65">{card.d}</p>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
