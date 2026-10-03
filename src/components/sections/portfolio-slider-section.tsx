"use client";

import { useEffect, useRef } from "react";
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

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const bar = containerRef.current?.querySelector<HTMLElement>(".port-bar");
    const cards = Array.from(track.querySelectorAll<HTMLElement>(".port-card"));
    let raf = 0;

    const update = () => {
      raf = 0;
      const max = track.scrollWidth - track.clientWidth;
      if (bar) bar.style.transform = `scaleX(${max > 0 ? Math.min(1, track.scrollLeft / max) : 0})`;

      const isMobileOrTablet = window.matchMedia("(hover: none), (pointer: coarse), (max-width: 1023px)").matches;
      const center = window.innerWidth / 2;
      let closest: HTMLElement | null = null;
      let minDiff = Infinity;
      if (isMobileOrTablet) {
        cards.forEach((card) => {
          const rect = card.getBoundingClientRect();
          const diff = Math.abs(rect.left + rect.width / 2 - center);
          if (diff < minDiff) {
            minDiff = diff;
            closest = card;
          }
        });
      }
      cards.forEach((card) => {
        const active = card === closest ? "true" : "false";
        if (card.dataset.active !== active) card.dataset.active = active;
      });
    };

    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };

    let dragging = false;
    let moved = false;
    let startX = 0;
    let startLeft = 0;

    const onDown = (e: PointerEvent) => {
      if (e.pointerType !== "mouse" || e.button !== 0) return;
      dragging = true;
      moved = false;
      startX = e.clientX;
      startLeft = track.scrollLeft;
    };
    const onMove = (e: PointerEvent) => {
      if (!dragging) return;
      const dx = e.clientX - startX;
      if (!moved && Math.abs(dx) > 4) {
        moved = true;
        track.style.scrollSnapType = "none";
      }
      if (moved) track.scrollLeft = startLeft - dx;
    };
    const onUp = () => {
      if (!dragging) return;
      dragging = false;
      track.style.scrollSnapType = "";
    };
    const onClick = (e: MouseEvent) => {
      if (moved) {
        e.preventDefault();
        e.stopPropagation();
        moved = false;
      }
    };

    track.addEventListener("scroll", schedule, { passive: true });
    track.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    track.addEventListener("click", onClick, true);
    window.addEventListener("resize", schedule);
    update();

    return () => {
      if (raf) cancelAnimationFrame(raf);
      track.removeEventListener("scroll", schedule);
      track.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      track.removeEventListener("click", onClick, true);
      window.removeEventListener("resize", schedule);
    };
  }, [t]);

  return (
    <section ref={containerRef} id="works" className="relative h-dvh overflow-hidden bg-brand-bg">
      <div className="absolute inset-x-0 top-[calc(5rem+env(safe-area-inset-top,0px))] z-10 md:top-24 mx-auto flex max-w-6xl items-end justify-between px-6">
        <div>
          <Badge variant="outline" className="mb-4 border-brand-border/50 font-mono text-[11px] font-normal uppercase tracking-[0.25em] text-brand-border">
            {t.port.label}
          </Badge>
          <h2 className="font-heading text-3xl font-bold tracking-tight text-brand-text sm:text-5xl">{t.port.title}</h2>
        </div>
      </div>

      <div
        ref={trackRef}
        className="flex h-full w-full cursor-grab touch-pan-x touch-pan-y snap-x snap-mandatory items-end gap-8 overflow-x-auto overflow-y-hidden overscroll-x-contain px-[8vw] pb-[calc(6rem+env(safe-area-inset-bottom,0px))] pt-52 [scrollbar-width:none] active:cursor-grabbing [&::-webkit-scrollbar]:hidden"
      >
        {t.port.cases.map((item, i) => (
          <Card
            key={item.t}
            className="port-card group relative h-full w-[78vw] max-w-[520px] shrink-0 snap-center overflow-hidden rounded-3xl border-brand-border/20 bg-brand-surface shadow-lg transition-shadow duration-500 hover:shadow-2xl data-[active=true]:shadow-2xl"
          >
            <div className="absolute inset-0 overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={IMAGES[i % IMAGES.length]}
                alt={item.t}
                draggable={false}
                className="port-img absolute inset-y-0 -left-[8%] h-full w-[116%] max-w-none object-cover grayscale transition-all duration-700 group-hover:scale-105 group-hover:grayscale-0 group-data-[active=true]:scale-105 group-data-[active=true]:grayscale-0"
              />
            </div>
            <div className="absolute inset-0 z-10 bg-gradient-to-t from-brand-text/70 via-transparent to-transparent" />
            <div className="absolute left-5 top-5 z-10 flex gap-2">
              <Badge className="rounded-full bg-white/70 font-mono text-[10px] font-normal uppercase tracking-widest text-brand-text opacity-100 backdrop-blur-md transition-opacity duration-500 group-hover:opacity-0 group-data-[active=true]:opacity-0 hover:bg-white/70">
                {t.port.before}
              </Badge>
              <Badge className="absolute left-0 rounded-full bg-brand-text font-mono text-[10px] font-normal uppercase tracking-widest text-white opacity-0 transition-opacity duration-500 group-hover:opacity-100 group-data-[active=true]:opacity-100 hover:bg-brand-text">
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
        <div className="port-bar h-full origin-left bg-brand-text" style={{ transform: "scaleX(0)" }} />
      </div>
    </section>
  );
}
