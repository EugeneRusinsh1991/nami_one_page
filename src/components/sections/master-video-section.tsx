"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useLanguage } from "@/components/providers/language-provider";

const BADGE_PLACEMENTS = [
  "-left-4 top-8 md:-left-10",
  "-right-4 top-[22%] md:-right-10",
  "-left-2 top-[52%] md:-left-14",
  "-right-2 bottom-[18%] md:-right-12",
  "left-6 -bottom-5 md:left-12",
];

const BADGE_PLACEMENTS_2 = [
  "-right-4 top-10 md:-right-10",
  "-left-4 top-[24%] md:-left-12",
  "-right-3 top-[54%] md:-right-12",
  "-left-3 bottom-[20%] md:-left-10",
  "right-6 -bottom-5 md:right-12",
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

        if (portrait && media) {
          gsap.fromTo(
            portrait,
            { clipPath: "inset(12% 12% 12% 12% round 2rem)" },
            {
              clipPath: "inset(0% 0% 0% 0% round 2rem)",
              ease: "none",
              scrollTrigger: { trigger: media, start: "top 90%", end: "center center", scrub: true },
            }
          );
        }

        if (img && media) {
          gsap.to(img, {
            yPercent: -8,
            ease: "none",
            scrollTrigger: { trigger: media, start: "top bottom", end: "bottom top", scrub: true },
          });
        }

        badges.forEach((el, i) => {
          gsap.from(el, {
            y: 30,
            opacity: 0,
            duration: 0.8,
            delay: 0.15 + i * 0.08,
            ease: "power3.out",
            scrollTrigger: { trigger: media, start: "top 85%" },
          });
        });
      });
    },
    { scope: containerRef, dependencies: [t], revertOnUpdate: true }
  );

  return (
    <div ref={containerRef} id="master" className="relative w-full bg-brand-surface">
      {BLOCKS.map(({ id, badges, mirrored }) => (
        <section
          key={id}
          id={id}
          className="relative flex h-dvh min-h-dvh w-full items-center justify-center overflow-hidden px-6 py-8 sm:py-12 md:py-16"
        >
          <div className="master-block mx-auto grid w-full max-w-6xl items-center gap-6 sm:gap-8 md:grid-cols-2 md:gap-16">
            <div
              className={`master-media relative mx-auto w-fit max-w-full order-2 ${
                mirrored ? "md:order-2" : "md:order-1"
              }`}
            >
              <div className="master-portrait relative aspect-[4/5] h-[38vh] sm:h-[45vh] md:h-[62vh] lg:h-[68vh] max-h-[620px] w-auto overflow-hidden rounded-[2rem] bg-brand-elevated">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/images/image (3).png"
                  alt={t.master.label}
                  className="master-img absolute inset-x-0 top-0 h-[112%] w-full object-cover"
                />
              </div>
              {t.master.metrics.map((m, i) => (
                <div key={m.d} className={`master-badge absolute z-10 ${badges[i]}`}>
                  <div className="rounded-2xl border border-white bg-white/90 px-3.5 py-2 sm:px-5 sm:py-3 shadow-[0_18px_40px_-12px_rgba(26,31,37,0.35)] ring-1 ring-brand-border/20 backdrop-blur-2xl transition-transform duration-300 hover:scale-105">
                    <div className="font-heading text-lg sm:text-xl font-bold text-brand-text">{m.t}</div>
                    <div className="font-mono text-[9px] sm:text-[10px] uppercase tracking-widest text-brand-text/60">{m.d}</div>
                  </div>
                </div>
              ))}
            </div>

            <div
              className={`master-copy flex flex-col order-1 ${
                mirrored
                  ? "max-w-md md:order-1 md:ml-auto md:items-end md:text-right"
                  : "max-w-md md:order-2"
              }`}
            >
              <Badge variant="outline" className="mb-3 sm:mb-5 border-brand-border/50 font-mono text-[10px] sm:text-[11px] font-normal uppercase tracking-[0.25em] text-brand-border">
                {t.master.label}
              </Badge>
              <h2 className="mb-3 sm:mb-6 font-heading text-2xl font-bold tracking-tight text-brand-text sm:text-4xl md:text-5xl">{t.master.title}</h2>
              <Separator className="mb-3 sm:mb-6 w-12 sm:w-16 bg-brand-text" />
              <p className="max-w-md text-sm sm:text-base leading-relaxed text-brand-text/70">{t.master.text}</p>
            </div>
          </div>
        </section>
      ))}
    </div>
  );
}
