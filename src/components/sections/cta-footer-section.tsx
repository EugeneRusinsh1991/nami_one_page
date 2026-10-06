"use client";

import { useRef } from "react";
import { Send, Instagram } from "lucide-react";
import { revealOnScroll, useGSAP } from "@/lib/gsap";
import { cn } from "@/lib/utils";
import { Heading } from "@/components/ui/typography";
import { useLanguage } from "@/components/providers/language-provider";
import { BookingCalendar } from "@/components/sections/booking/booking-calendar";
import { sendBookingRequest } from "@/lib/config/booking";

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M19.589 6.686a4.793 4.793 0 0 1-3.77-4.245V2h-3.445v13.672a2.896 2.896 0 0 1-5.201 1.743l-.008-.012a2.895 2.895 0 0 1 3.16-4.508c.287.086.58.127.874.122V9.403a6.348 6.348 0 0 0-1.025-.083 6.342 6.342 0 0 0-6.342 6.342 6.342 6.342 0 0 0 10.82 4.484c1.196-1.196 1.868-2.818 1.868-4.509V8.625a8.21 8.21 0 0 0 4.887 1.583V6.75a4.79 4.79 0 0 1-1.819-.064h-.004z" />
    </svg>
  );
}

interface SocialLink {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const SOCIAL_LINKS: SocialLink[] = [
  { label: "Telegram", href: "https://t.me/", icon: Send },
  { label: "Instagram", href: "https://instagram.com/", icon: Instagram },
  { label: "TikTok", href: "https://tiktok.com/", icon: TikTokIcon },
];

export function CtaBlock({ className }: { className?: string }) {
  const { t } = useLanguage();

  return (
    <div className={cn("flex flex-1 min-h-0 items-center justify-center px-4 sm:px-6 py-4 sm:py-10", className)}>
      <div className="cta-panel mx-auto w-full max-w-4xl">
        <Heading as="h2" size="h2" className="cta-reveal mx-auto min-h-[2.4em] text-center text-balance md:max-w-[16ch]">
          {t.cta.title}
        </Heading>
        <p className="cta-reveal mx-auto mt-1.5 min-h-8 max-w-xl text-center text-xs sm:min-h-10 sm:text-sm text-brand-text/70">
          {t.cta.sub}
        </p>

        <div className="cta-reveal mt-3 sm:mt-5">
          <BookingCalendar
            onBookingSubmitted={async (data) => {
              await sendBookingRequest(data);
            }}
          />
        </div>
      </div>
    </div>
  );
}

export function Footer({ className }: { className?: string }) {
  return (
    <footer className={cn("cta-footer shrink-0 border-t border-brand-border/20 bg-brand-bg px-4 sm:px-6 pt-2 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] sm:pt-3 sm:pb-[calc(1rem+env(safe-area-inset-bottom,0px))]", className)}>
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-center text-center">
        <div className="footer-reveal">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/logo.png" alt="NAMI STUDIO" className="h-7 w-auto sm:h-9 md:h-10" />
        </div>
        <div className="footer-reveal mt-1.5 sm:mt-2.5 flex items-center justify-center gap-3 sm:gap-4 text-brand-text/70">
          {SOCIAL_LINKS.map(({ label, href, icon: Icon }) => (
            <a
              key={label}
              href={href}
              target="_blank"
              rel="noreferrer"
              aria-label={label}
              className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full transition-colors hover:text-brand-text hover:-translate-y-0.5"
            >
              <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}

export function CtaFooterSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { t } = useLanguage();

  useGSAP(
    () => {
      revealOnScroll(".cta-reveal", ".cta-panel", {
        y: 50,
        duration: 1,
        stagger: 0.12,
      });
      revealOnScroll(".footer-reveal", ".cta-footer", {
        y: 30,
        stagger: 0.1,
        start: "top 98%",
      });
    },
    { scope: containerRef }
  );

  return (
    <section
      ref={containerRef}
      id="booking"
      className="section-screen flex flex-col justify-between bg-brand-surface"
    >
      <CtaBlock />
      <Footer />
    </section>
  );
}
