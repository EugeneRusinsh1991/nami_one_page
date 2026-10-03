"use client";

import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import Lenis from "lenis";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { useLanguage } from "@/components/providers/language-provider";

const LenisContext = createContext<Lenis | null>(null);

export const useLenis = () => useContext(LenisContext);

interface SmoothScrollProviderProps {
  children: React.ReactNode;
}

function getScrollBreakpoints(): number[] {
  if (typeof window === "undefined" || typeof document === "undefined") return [0];

  const points: number[] = [0];

  // 1. Static section anchors by section id
  const sectionIds = ["hero", "philosophy", "technique", "works", "master", "faq", "booking"];
  sectionIds.forEach((id) => {
    const el = document.getElementById(id);
    if (el) {
      const rect = el.getBoundingClientRect();
      const top = rect.top + (window.scrollY || window.pageYOffset || document.documentElement.scrollTop);
      points.push(Math.round(top));
    }
  });

  // 2. ScrollTriggers for pinned sections (Hero, Technique, Works)
  ScrollTrigger.getAll().forEach((st) => {
    if (st.vars.pin || st.pin) {
      points.push(Math.round(st.start));
      points.push(Math.round(st.end));

      const triggerEl = st.trigger as HTMLElement | null;
      const totalDistance = st.end - st.start;

      // Technique steps (3 steps)
      if (triggerEl?.id === "technique" && totalDistance > 0) {
        points.push(Math.round(st.start + totalDistance * 0.5));
      }

      // Works cards (8 cards)
      if (triggerEl?.id === "works" && totalDistance > 0) {
        const track = triggerEl.querySelector<HTMLElement>("[class*='w-max']");
        const cards = triggerEl.querySelectorAll<HTMLElement>(".port-card");
        if (track && cards.length > 0) {
          const maxTrackScroll = Math.max(0, track.scrollWidth - window.innerWidth);
          if (maxTrackScroll > 0) {
            cards.forEach((card) => {
              const cardCenter = card.offsetLeft + card.offsetWidth / 2;
              const targetTrackX = Math.max(0, Math.min(maxTrackScroll, cardCenter - window.innerWidth / 2));
              const cardY = st.start + (targetTrackX / maxTrackScroll) * totalDistance;
              points.push(Math.round(cardY));
            });
          }
        }
      }
    }
  });

  // 3. Sort and merge points closer than 60px
  const sorted = Array.from(new Set(points))
    .filter((p) => p >= 0 && Number.isFinite(p))
    .sort((a, b) => a - b);

  const merged: number[] = [];
  sorted.forEach((p) => {
    if (merged.length === 0 || p - merged[merged.length - 1] > 60) {
      merged.push(p);
    }
  });

  return merged;
}

export function SmoothScrollProvider({ children }: SmoothScrollProviderProps) {
  const [lenis, setLenis] = useState<Lenis | null>(null);
  const { locale } = useLanguage();

  useEffect(() => {
    const lenisInstance = new Lenis({
      duration: 1.0,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: "vertical",
      gestureOrientation: "vertical",
      smoothWheel: true,
      wheelMultiplier: 1,
      syncTouch: true,
      syncTouchLerp: 0.08,
      touchMultiplier: 0.85,
      touchInertiaExponent: 1.25,
    });

    // Intercept user-initiated gestures and clamp target to the next immediate breakpoint
    const origScrollTo = lenisInstance.scrollTo.bind(lenisInstance);

    lenisInstance.scrollTo = (target: any, opts: any = {}) => {
      if (opts.programmatic !== false || typeof target !== "number") {
        return origScrollTo(target, opts);
      }

      const current = lenisInstance.scroll;
      const breakpoints = getScrollBreakpoints();
      const tolerance = 25;

      let clampedTarget = target;

      if (target > current + tolerance) {
        // Scrolling down: clamp to the immediate next breakpoint ahead
        const nextBp = breakpoints.find((bp) => bp > current + tolerance);
        if (nextBp !== undefined && target > nextBp) {
          clampedTarget = nextBp;
        }
      } else if (target < current - tolerance) {
        // Scrolling up: clamp to the immediate preceding breakpoint behind
        const prevBps = breakpoints.filter((bp) => bp < current - tolerance);
        if (prevBps.length > 0) {
          const prevBp = prevBps[prevBps.length - 1];
          if (target < prevBp) {
            clampedTarget = prevBp;
          }
        }
      }

      return origScrollTo(clampedTarget, opts);
    };

    setLenis(lenisInstance);

    // Synchronize Lenis scroll with GSAP ScrollTrigger
    lenisInstance.on("scroll", ScrollTrigger.update);

    const updateTicker = (time: number) => {
      lenisInstance.raf(time * 1000);
    };

    gsap.ticker.add(updateTicker);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(updateTicker);
      lenisInstance.destroy();
      setLenis(null);
    };
  }, []);

  useEffect(() => {
    if (!lenis) return;

    let inner = 0;
    const outer = requestAnimationFrame(() => {
      inner = requestAnimationFrame(() => {
        ScrollTrigger.refresh();
        lenis.resize();
      });
    });

    return () => {
      cancelAnimationFrame(outer);
      cancelAnimationFrame(inner);
    };
  }, [locale, lenis]);

  return (
    <LenisContext.Provider value={lenis}>
      {children}
    </LenisContext.Provider>
  );
}
