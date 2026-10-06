"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/components/providers/language-provider";
import { useScrollTo } from "@/hooks/use-scroll-to";
import { LanguageSwitcher } from "@/components/layout/language-switcher";

export { LanguageSwitcher };

export interface NavItem {
  id: string;
  labelKey: "philosophy" | "technique" | "works" | "master" | "studio" | "academy" | "faq";
}

export const NAV_ITEMS: readonly NavItem[] = [
  { id: "philosophy", labelKey: "philosophy" },
  { id: "technique", labelKey: "technique" },
  { id: "works", labelKey: "works" },
  { id: "master", labelKey: "master" },
  { id: "studio", labelKey: "studio" },
  { id: "academy", labelKey: "academy" },
  { id: "faq", labelKey: "faq" },
] as const;

export function Navbar() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const { t } = useLanguage();
  const { scrollToId, scrollToTop } = useScrollTo();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    setIsMounted(true);

    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (containerRef.current?.contains(document.activeElement)) {
          (document.activeElement as HTMLElement)?.blur?.();
        }
      }
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  useGSAP(
    () => {
      if (!isMounted) return;
      const mm = gsap.matchMedia();
      mm.add("(min-width: 768px)", () => {
        gsap.from(".nav-pill", {
          y: -40,
          opacity: 0,
          duration: 1,
          ease: "power3.out",
          delay: 0.3,
          clearProps: "transform,opacity",
        });

        NAV_ITEMS.forEach(({ id }) => {
          const el = document.getElementById(id);
          if (el) {
            ScrollTrigger.create({
              trigger: el,
              start: "top 50%",
              end: "bottom 50%",
              onToggle: (self) =>
                setActiveId((prev) => (self.isActive ? id : prev === id ? null : prev)),
            });
          }
        });
      });
      return () => mm.revert();
    },
    { scope: containerRef, dependencies: [isMounted] }
  );

  const handleLogoClick = () => {
    if (pathname === "/") {
      scrollToTop();
    } else {
      router.push("/");
    }
  };

  const goTo = (id: string) => {
    if (pathname === "/") {
      scrollToId(id);
    } else {
      router.push(`/#${id}`);
    }
  };

  return (
    <div
      ref={containerRef}
      className="pointer-events-none fixed inset-x-0 top-0 z-50 isolate hidden justify-center px-4 pt-4 md:flex"
    >
      <header
        className={cn(
          "nav-pill pointer-events-auto flex w-full max-w-6xl items-center justify-between gap-4 md:gap-6 rounded-full border border-white/60 bg-white/70 px-5 py-2.5 shadow-[0_8px_32px_rgba(26,31,37,0.08)] backdrop-blur-md transform-gpu will-change-transform transition-colors duration-300",
          isMounted && isScrolled && "border-white/80 bg-white/90 shadow-[0_12px_40px_rgba(26,31,37,0.12)]"
        )}
      >
        <button type="button" onClick={handleLogoClick} aria-label="NAMI STUDIO">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/logo.png" alt="NAMI STUDIO" className="h-8 w-auto" />
        </button>

        <nav className="flex items-center gap-4 lg:gap-7">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => goTo(item.id)}
              className={cn(
                "group relative text-sm text-brand-text/80 transition-colors hover:text-brand-text",
                activeId === item.id && "text-brand-text"
              )}
            >
              {t.nav[item.labelKey]}
              <span
                className={cn(
                  "absolute -bottom-1 left-0 h-px bg-brand-text transition-all duration-300",
                  activeId === item.id ? "w-full" : "w-0 group-hover:w-full"
                )}
              />
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          <LanguageSwitcher className="hidden lg:flex" />
          <Button
            size="sm"
            variant="brand-primary"
            onClick={() => goTo("booking")}
            className="px-5"
          >
            {t.nav.book}
          </Button>
        </div>
      </header>
    </div>
  );
}
