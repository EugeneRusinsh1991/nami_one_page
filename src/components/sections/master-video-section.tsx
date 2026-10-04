"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/components/providers/language-provider";

const BADGE_PLACEMENTS = [
  "-left-3 top-4 sm:-left-4 sm:top-6 md:-left-10 md:top-8",
  "-right-3 top-[22%] sm:-right-4 md:-right-10",
  "-left-3 top-[52%] sm:-left-4 md:-left-12",
  "-right-3 bottom-[20%] sm:-right-4 md:-right-10",
  "left-4 -bottom-4 sm:left-6 sm:-bottom-5 md:left-10 md:-bottom-5",
];

const BADGE_PLACEMENTS_2 = [
  "-right-3 top-4 sm:-right-4 sm:top-6 md:-right-10 md:top-8",
  "-left-3 top-[22%] sm:-left-4 md:-left-10",
  "-right-3 top-[52%] sm:-right-4 md:-right-12",
  "-left-3 bottom-[20%] sm:-left-4 md:-left-10",
  "right-4 -bottom-4 sm:right-6 sm:-bottom-5 md:right-10 md:-bottom-5",
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
            scrollTrigger: { trigger: media, start: "top bottom", end: "bottom top", scrub: true },
          });
        }

        badges.forEach((el, i) => {
          const card = el.firstElementChild;
          if (card) {
            const isRight = el.className.includes("-right");
            const isLeft = el.className.includes("-left");
            const isBottom = el.className.includes("bottom");
            const isTop = el.className.includes("top-4") || el.className.includes("top-3");

            const fromX = isRight ? 18 : isLeft ? -18 : 0;
            const fromY = isBottom ? 20 : isTop ? -15 : 12;

            gsap.fromTo(
              card,
              {
                x: fromX,
                y: fromY,
                scale: 1.1,
                opacity: 0,
              },
              {
                x: 0,
                y: 0,
                scale: 1,
                opacity: 1,
                duration: 0.85,
                delay: 0.3 + i * 0.08,
                ease: "power2.out",
                scrollTrigger: { trigger: block, start: "top 70%" },
              }
            );
          }
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
          className="relative flex h-dvh min-h-dvh w-full flex-col justify-start md:justify-center md:items-center overflow-hidden px-5 pt-[calc(4.5rem+env(safe-area-inset-top,0px))] pb-[calc(2rem+env(safe-area-inset-bottom,0px))] sm:px-6 md:py-16"
        >
          <div className="master-block mx-auto flex h-full w-full max-w-6xl flex-col items-center justify-between md:grid md:grid-cols-2 md:items-center md:gap-16">
            <div
              className={`master-media relative mx-auto my-auto -translate-y-4 sm:-translate-y-6 md:translate-y-0 w-fit max-w-full order-2 ${
                mirrored ? "md:order-2" : "md:order-1"
              }`}
            >
              <div className="master-portrait relative aspect-[4/5] h-[58vh] max-h-[560px] max-w-[calc(100vw-3.25rem)] sm:h-[64vh] sm:max-h-[620px] sm:max-w-none md:h-[68vh] md:max-h-[680px] lg:h-[72vh] w-auto overflow-hidden rounded-[2rem] bg-brand-elevated shadow-2xl">
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
              className={`master-copy flex w-full flex-col items-start order-1 shrink-0 ${
                mirrored
                  ? "max-w-md md:order-1 md:ml-auto md:items-end md:text-right"
                  : "max-w-md md:order-2 md:items-start md:text-left"
              }`}
            >
              <Badge variant="outline" className="w-fit mb-3 sm:mb-5 border-brand-border/50 font-mono text-[10px] sm:text-[11px] font-normal uppercase tracking-[0.25em] text-brand-border">
                {t.master.label}
              </Badge>
              <h2 className="font-heading text-2xl font-bold tracking-tight text-brand-text sm:text-4xl md:text-5xl">{t.master.title}</h2>
            </div>
          </div>
        </section>
      ))}
    </div>
  );
}
