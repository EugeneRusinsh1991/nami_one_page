"use client";

import { useRef } from "react";
import { Send, Instagram } from "lucide-react";
import { gsap, useGSAP } from "@/lib/gsap";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Heading, Text } from "@/components/ui/typography";
import { useLanguage } from "@/components/providers/language-provider";

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

export function CtaFooterSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { t } = useLanguage();

  useGSAP(
    () => {
      gsap.from(".cta-reveal", {
        y: 50,
        opacity: 0,
        duration: 1,
        stagger: 0.12,
        ease: "power3.out",
        scrollTrigger: { trigger: ".cta-panel", start: "top 85%" },
      });
      gsap.from(".footer-reveal", {
        y: 30,
        opacity: 0,
        duration: 0.9,
        stagger: 0.1,
        ease: "power3.out",
        scrollTrigger: { trigger: ".cta-footer", start: "top 98%" },
      });
    },
    { scope: containerRef, dependencies: [t], revertOnUpdate: true }
  );

  return (
    <section
      ref={containerRef}
      id="booking"
      className="relative flex h-dvh min-h-dvh w-full flex-col justify-between overflow-hidden bg-brand-surface"
    >
      <div className="flex flex-1 items-center justify-center px-6 py-6 sm:py-8 md:py-10">
        <Card variant="glass" className="cta-panel mx-auto w-full max-w-3xl rounded-[2rem] border-white/70 bg-white/60 p-6 text-center shadow-xl backdrop-blur-xl sm:p-10 md:p-12">
          <Heading as="h2" size="h2" className="cta-reveal font-bold">
            {t.cta.title}
          </Heading>

          <form onSubmit={(e) => e.preventDefault()} className="cta-reveal mx-auto mt-5 grid max-w-md gap-3 sm:mt-6">
            <Input placeholder={t.cta.name} className="h-11 rounded-full border-brand-border/30 bg-white/80 px-5 sm:h-12" />
            <Input placeholder={t.cta.phone} className="h-11 rounded-full border-brand-border/30 bg-white/80 px-5 sm:h-12" />
            <Button
              type="submit"
              variant="brand-primary"
              size="lg"
              className="h-11 sm:h-12"
            >
              {t.cta.send}
            </Button>
          </form>

          <div className="cta-reveal mt-4 flex justify-center gap-3 sm:mt-6">
            {SOCIAL_LINKS.slice(0, 2).map(({ label, href, icon: Icon }) => (
              <Button key={label} asChild variant="brand-outline-pill">
                <a href={href} target="_blank" rel="noreferrer">
                  <Icon className="h-4 w-4" /> {label}
                </a>
              </Button>
            ))}
          </div>
        </Card>
      </div>

      <footer className="cta-footer shrink-0 border-t border-brand-border/20 bg-brand-bg px-6 py-4 sm:py-6 md:py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-center text-center">
          <div className="footer-reveal">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/logo.png" alt="NAMI STUDIO" className="h-8 w-auto sm:h-9 md:h-10" />
          </div>
          <Text
            as="div"
            variant="subtle"
            className="footer-reveal mt-3 flex items-center justify-center gap-6 text-xs sm:text-sm md:mt-4"
          >
            {SOCIAL_LINKS.map(({ label, href, icon: Icon }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 transition-colors hover:text-brand-text"
              >
                <Icon className="h-4 w-4" />
                <span>{label}</span>
              </a>
            ))}
          </Text>
        </div>
        <Separator className="mx-auto my-3 max-w-6xl bg-brand-border/20 sm:my-4 md:my-5" />
        <Text as="p" variant="code" className="footer-reveal text-center text-[11px] sm:text-xs">
          {t.cta.rights}
        </Text>
      </footer>
    </section>
  );
}
