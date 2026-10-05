import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, useGSAP);
  ScrollTrigger.config({
    ignoreMobileResize: true,
    autoRefreshEvents: "visibilitychange,DOMContentLoaded,load",
  });
}

export interface RevealOptions {
  y?: number;
  scale?: number;
  duration?: number;
  stagger?: number;
  delay?: number;
  start?: string;
}

function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

function revealOnScroll(
  targets: gsap.TweenTarget,
  trigger: gsap.DOMTarget,
  options?: RevealOptions
): gsap.core.Tween | null {
  if (prefersReducedMotion()) {
    return null;
  }

  const {
    y = 30,
    scale = 1,
    duration = 0.9,
    stagger = 0,
    delay = 0,
    start = "top 85%",
  } = options ?? {};

  return gsap.from(targets, {
    y,
    scale,
    opacity: 0,
    duration,
    stagger,
    delay,
    ease: "power3.out",
    clearProps: "transform",
    scrollTrigger: {
      trigger,
      start,
      once: true,
    },
  });
}

export { gsap, ScrollTrigger, useGSAP, prefersReducedMotion, revealOnScroll };
