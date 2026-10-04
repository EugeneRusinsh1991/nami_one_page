"use client";

import { useRef } from "react";
import { Send, Instagram } from "lucide-react";
import { gsap, useGSAP } from "@/lib/gsap";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useLanguage } from "@/components/providers/language-provider";

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M19.589 6.686a4.793 4.793 0 0 1-3.77-4.245V2h-3.445v13.672a2.896 2.896 0 0 1-5.201 1.743l-.008-.012a2.895 2.895 0 0 1 3.16-4.508c.287.086.58.127.874.122V9.403a6.348 6.348 0 0 0-1.025-.083 6.342 6.342 0 0 0-6.342 6.342 6.342 6.342 0 0 0 10.82 4.484c1.196-1.196 1.868-2.818 1.868-4.509V8.625a8.21 8.21 0 0 0 4.887 1.583V6.75a4.79 4.79 0 0 1-1.819-.064h-.004z" />
    </svg>
  );
}

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
        <div className="cta-panel mx-auto w-full max-w-3xl rounded-[2rem] border border-white/70 bg-white/60 p-6 text-center shadow-xl backdrop-blur-xl sm:p-10 md:p-12">
          <h2 className="cta-reveal font-heading text-2xl font-bold tracking-tight text-brand-text sm:text-4xl md:text-5xl">
            {t.cta.title}
          </h2>

          <form onSubmit={(e) => e.preventDefault()} className="cta-reveal mx-auto mt-5 grid max-w-md gap-3 sm:mt-6">
            <Input placeholder={t.cta.name} className="h-11 rounded-full border-brand-border/30 bg-white/80 px-5 sm:h-12" />
            <Input placeholder={t.cta.phone} className="h-11 rounded-full border-brand-border/30 bg-white/80 px-5 sm:h-12" />
            <Button
              type="submit"
              size="lg"
              className="h-11 rounded-full bg-brand-text text-white transition-transform hover:-translate-y-0.5 hover:bg-brand-text/85 sm:h-12"
            >
              {t.cta.send}
            </Button>
          </form>

          <div className="cta-reveal mt-4 flex justify-center gap-3 sm:mt-6">
            <Button asChild variant="outline" className="rounded-full border-brand-border/40 bg-transparent">
              <a href="https://t.me/" target="_blank" rel="noreferrer">
                <Send className="h-4 w-4" /> Telegram
              </a>
            </Button>
            <Button asChild variant="outline" className="rounded-full border-brand-border/40 bg-transparent">
              <a href="https://instagram.com/" target="_blank" rel="noreferrer">
                <Instagram className="h-4 w-4" /> Instagram
              </a>
            </Button>
          </div>
        </div>
      </div>

      <footer className="cta-footer shrink-0 border-t border-brand-border/20 bg-brand-bg px-6 py-4 sm:py-6 md:py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-center text-center">
          <div className="footer-reveal">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/logo.png" alt="NAMI STUDIO" className="h-8 w-auto sm:h-9 md:h-10" />
          </div>
          <div className="footer-reveal mt-3 flex items-center justify-center gap-6 text-xs sm:text-sm text-brand-text/70 md:mt-4">
            <a
              href="https://t.me/"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 transition-colors hover:text-brand-text"
            >
              <Send className="h-4 w-4" />
              <span>Telegram</span>
            </a>
            <a
              href="https://instagram.com/"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 transition-colors hover:text-brand-text"
            >
              <Instagram className="h-4 w-4" />
              <span>Instagram</span>
            </a>
            <a
              href="https://tiktok.com/"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 transition-colors hover:text-brand-text"
            >
              <TikTokIcon className="h-4 w-4" />
              <span>TikTok</span>
            </a>
          </div>
        </div>
        <Separator className="mx-auto my-3 max-w-6xl bg-brand-border/20 sm:my-4 md:my-5" />
        <p className="footer-reveal text-center font-mono text-[11px] sm:text-xs text-brand-accent">{t.cta.rights}</p>
      </footer>
    </section>
  );
}
