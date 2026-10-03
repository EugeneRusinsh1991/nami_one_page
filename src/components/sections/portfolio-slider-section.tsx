"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { useLanguage } from "@/components/providers/language-provider";

const IMAGES = [
  "/images/image (2).png",
  "/images/image (3).png",
  "/images/image (2).png",
  "/images/image (4).png",
  "/images/image (3).png",
  "/images/image (4).png",
  "/images/image (2).png",
  "/images/image (3).png",
];

export function PortfolioSliderSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const { t } = useLanguage();

  useGSAP(
    () => {
      const track = trackRef.current;
      if (!track) return;

      const getDistance = () => Math.max(0, track.scrollWidth - window.innerWidth);

      const tween = gsap.to(track, {
        x: () => -getDistance(),
        ease: "none",
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top top",
          end: () => `+=${getDistance() + window.innerHeight * 0.5}`,
          pin: true,
          scrub: true,
          invalidateOnRefresh: true,
        },
      });

      gsap.utils.toArray<HTMLElement>(".port-img").forEach((img) => {
        gsap.fromTo(
          img,
          { xPercent: -5 },
          {
            xPercent: 5,
            ease: "none",
            scrollTrigger: { trigger: img, containerAnimation: tween, start: "left right", end: "right left", scrub: true },
          }
        );
      });

      gsap.to(".port-bar", {
        scaleX: 1,
        ease: "none",
        scrollTrigger: { trigger: containerRef.current, start: "top top", end: () => `+=${getDistance()}`, scrub: true },
      });
    },
    { scope: containerRef, dependencies: [t], revertOnUpdate: true }
  );

  return (
    <section ref={containerRef} id="works" className="relative h-screen overflow-hidden bg-brand-bg">
      <div className="absolute inset-x-0 top-24 z-10 mx-auto flex max-w-6xl items-end justify-between px-6">
        <div>
          <Badge variant="outline" className="mb-4 border-brand-border/50 font-mono text-[11px] font-normal uppercase tracking-[0.25em] text-brand-border">
            {t.port.label}
          </Badge>
          <h2 className="font-heading text-3xl font-bold tracking-tight text-brand-text sm:text-5xl">{t.port.title}</h2>
        </div>
      </div>

      <div ref={trackRef} className="flex h-full w-max items-end gap-8 px-[8vw] pb-24 pt-52">
        {t.port.cases.map((item, i) => (
          <Card
            key={item.t}
            className="port-card group relative h-full w-[78vw] max-w-[520px] shrink-0 overflow-hidden rounded-3xl border-brand-border/20 bg-brand-surface shadow-lg transition-shadow duration-500 hover:shadow-2xl"
          >
            <div className="absolute inset-0 overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={IMAGES[i % IMAGES.length]}
                alt={item.t}
                className="port-img absolute inset-y-0 -left-[8%] h-full w-[116%] max-w-none object-cover grayscale transition-all duration-700 group-hover:scale-105 group-hover:grayscale-0"
              />
            </div>
            <div className="absolute inset-0 z-10 bg-gradient-to-t from-brand-text/70 via-transparent to-transparent" />
            <div className="absolute left-5 top-5 z-10 flex gap-2">
              <Badge className="rounded-full bg-white/70 font-mono text-[10px] font-normal uppercase tracking-widest text-brand-text opacity-100 backdrop-blur-md transition-opacity duration-500 group-hover:opacity-0 hover:bg-white/70">
                {t.port.before}
              </Badge>
              <Badge className="absolute left-0 rounded-full bg-brand-text font-mono text-[10px] font-normal uppercase tracking-widest text-white opacity-0 transition-opacity duration-500 group-hover:opacity-100 hover:bg-brand-text">
                {t.port.healed}
              </Badge>
            </div>
            <div className="absolute inset-x-0 bottom-0 z-10 p-7 text-white">
              <span className="font-mono text-xs tracking-widest text-white/60">{String(i + 1).padStart(2, "0")}</span>
              <h3 className="font-heading text-2xl font-semibold">{item.t}</h3>
              <p className="text-sm text-white/75">{item.d}</p>
            </div>
          </Card>
        ))}
      </div>

      <div className="absolute inset-x-6 bottom-8 mx-auto h-px max-w-6xl bg-brand-elevated">
        <div className="port-bar h-full origin-left scale-x-0 bg-brand-text" />
      </div>
    </section>
  );
}
