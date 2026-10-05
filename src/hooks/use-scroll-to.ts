"use client";

import { useCallback } from "react";
import { useLenis } from "@/components/providers/smooth-scroll-provider";
import { ScrollTrigger } from "@/lib/gsap";
import { runSceneTransition } from "./scene-transition";

export interface ScrollToOptions {
  duration?: number;
  offset?: number;
  immediate?: boolean;
  lock?: boolean;
  onComplete?: () => void;
}

export interface UseScrollToReturn {
  scrollToId: (id: string, options?: ScrollToOptions) => boolean;
  scrollToTop: (options?: ScrollToOptions) => void;
  scrollToTarget: (target: number | HTMLElement, options?: ScrollToOptions) => void;
  isReady: boolean;
}

export const DEFAULT_NAV_SCROLL_DURATION = 1.6;

export function useScrollTo(): UseScrollToReturn {
  const lenis = useLenis();

  const scrollToTarget = useCallback(
    (target: number | HTMLElement, options?: ScrollToOptions) => {
      if (typeof window === "undefined") return;

      if (lenis && !options?.immediate) {
        void runSceneTransition(() => {
          lenis.scrollTo(target, {
            offset: options?.offset,
            immediate: true,
            force: true,
          });
          ScrollTrigger.update();
          options?.onComplete?.();
        });
        return;
      }

      if (lenis) {
        lenis.scrollTo(target, {
          duration: options?.duration ?? DEFAULT_NAV_SCROLL_DURATION,
          offset: options?.offset,
          immediate: options?.immediate,
          lock: options?.lock,
          onComplete: options?.onComplete,
        });
        return;
      }

      const top =
        (typeof target === "number"
          ? target
          : target.getBoundingClientRect().top + window.scrollY) + (options?.offset ?? 0);

      window.scrollTo({
        top,
        behavior: options?.immediate ? "auto" : "smooth",
      });
      options?.onComplete?.();
    },
    [lenis]
  );

  const scrollToId = useCallback(
    (id: string, options?: ScrollToOptions): boolean => {
      if (typeof document === "undefined") return false;
      const targetId = id.startsWith("#") ? id.slice(1) : id;
      const el = document.getElementById(targetId);
      if (!el) {
        return false;
      }
      scrollToTarget(el, options);
      return true;
    },
    [scrollToTarget]
  );

  const scrollToTop = useCallback(
    (options?: ScrollToOptions) => {
      scrollToTarget(0, options);
    },
    [scrollToTarget]
  );

  return {
    scrollToId,
    scrollToTop,
    scrollToTarget,
    isReady: Boolean(lenis),
  };
}
