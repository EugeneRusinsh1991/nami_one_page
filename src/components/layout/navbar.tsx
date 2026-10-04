"use client";

import { useRef, useState } from "react";
import { Menu } from "lucide-react";
import { gsap, useGSAP } from "@/lib/gsap";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { LOCALES, useLanguage } from "@/components/providers/language-provider";
import { useLenis } from "@/components/providers/smooth-scroll-provider";

const LINKS = ["philosophy", "technique", "works", "master", "faq"] as const;

export function LanguageSwitcher({ className }: { className?: string }) {
  const { locale, setLocale } = useLanguage();
  return (
    <div className={cn("flex items-center font-mono text-xs tracking-widest", className)}>
      {LOCALES.map(({ code, label }, i) => (
        <span key={code} className="flex items-center">
          {i > 0 && <span className="mx-1.5 text-brand-accent">|</span>}
          <button
            type="button"
            onClick={() => setLocale(code)}
            aria-pressed={locale === code}
            className={cn(
              "transition-colors hover:text-brand-text active:scale-95",
              locale === code ? "font-semibold text-brand-text" : "text-brand-border"
            )}
          >
            {label}
          </button>
        </span>
      ))}
    </div>
  );
}

export function MobileHeroNav({ className }: { className?: string }) {
  const [open, setOpen] = useState(false);
  const { t } = useLanguage();
  const lenis = useLenis();

  const goTo = (id: string) => {
    setOpen(false);
    const el = document.getElementById(id);
    if (el) lenis?.scrollTo(el, { duration: 1.6 });
  };

  return (
    <div
      className={cn(
        "inline-flex h-11 items-center gap-3.5 rounded-full border border-brand-border/50 bg-white/80 px-5 text-brand-text backdrop-blur-md lg:hidden",
        className
      )}
    >
      <LanguageSwitcher />
      <span className="h-4 w-px bg-brand-border/40 md:hidden" />
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <button
            type="button"
            aria-label="Menu"
            className="flex h-7 w-7 items-center justify-center rounded-full text-brand-text transition-colors hover:bg-black/5 active:scale-95 md:hidden"
          >
            <Menu className="h-4 w-4" />
          </button>
        </SheetTrigger>
        <SheetContent side="right" className="bg-brand-bg">
          <SheetTitle className="sr-only">Menu</SheetTitle>
          <div className="mt-10 flex flex-col gap-6 font-heading text-2xl">
            {LINKS.map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => goTo(key)}
                className="text-left transition-colors hover:text-brand-text/70"
              >
                {t.nav[key]}
              </button>
            ))}
            <Button
              onClick={() => goTo("booking")}
              className="mt-4 rounded-full bg-brand-text text-white hover:bg-brand-text/85"
            >
              {t.nav.book}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

export function Navbar() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { t } = useLanguage();
  const lenis = useLenis();

  useGSAP(
    () => {
      gsap.from(".nav-pill", { y: -40, opacity: 0, duration: 1, ease: "power3.out", delay: 0.3 });
    },
    { scope: containerRef }
  );

  const goTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) lenis?.scrollTo(el, { duration: 1.6 });
  };

  return (
    <div
      ref={containerRef}
      className="pointer-events-none fixed inset-x-0 top-0 z-40 hidden justify-center px-4 pt-4 md:flex"
    >
      <header className="nav-pill pointer-events-auto flex w-full max-w-6xl items-center justify-between gap-4 md:gap-6 rounded-full border border-white/60 bg-white/55 px-5 py-2.5 shadow-[0_8px_32px_rgba(26,31,37,0.08)] backdrop-blur-xl transform-gpu will-change-transform">
        <button type="button" onClick={() => lenis?.scrollTo(0)} aria-label="NAMI STUDIO">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/logo.png" alt="NAMI STUDIO" className="h-8 w-auto" />
        </button>

        <nav className="flex items-center gap-4 lg:gap-7">
          {LINKS.map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => goTo(key)}
              className="group relative text-sm text-brand-text/80 transition-colors hover:text-brand-text"
            >
              {t.nav[key]}
              <span className="absolute -bottom-1 left-0 h-px w-0 bg-brand-text transition-all duration-300 group-hover:w-full" />
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          <LanguageSwitcher className="hidden lg:flex" />
          <Button
            size="sm"
            onClick={() => goTo("booking")}
            className="rounded-full bg-brand-text px-5 text-white hover:bg-brand-text/85"
          >
            {t.nav.book}
          </Button>
        </div>
      </header>
    </div>
  );
}
