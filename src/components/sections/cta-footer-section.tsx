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
        scrollTrigger: { trigger: ".cta-panel", start: "top 80%" },
      });
      gsap.from(".footer-reveal", {
        y: 30,
        opacity: 0,
        duration: 0.9,
        stagger: 0.1,
        ease: "power3.out",
        scrollTrigger: { trigger: ".cta-footer", start: "top 92%" },
      });
    },
    { scope: containerRef }
  );

  return (
    <section ref={containerRef} id="booking" className="bg-brand-surface">
      <div className="px-6 py-28">
        <div className="cta-panel mx-auto max-w-3xl rounded-[2rem] border border-white/70 bg-white/60 p-8 text-center shadow-xl backdrop-blur-xl sm:p-14">
          <h2 className="cta-reveal font-heading text-3xl font-bold tracking-tight text-brand-text sm:text-5xl">{t.cta.title}</h2>

          <form onSubmit={(e) => e.preventDefault()} className="cta-reveal mx-auto mt-8 grid max-w-md gap-3">
            <Input placeholder={t.cta.name} className="h-12 rounded-full border-brand-border/30 bg-white/80 px-5" />
            <Input placeholder={t.cta.phone} className="h-12 rounded-full border-brand-border/30 bg-white/80 px-5" />
            <Button type="submit" size="lg" className="h-12 rounded-full bg-brand-text text-white transition-transform hover:-translate-y-0.5 hover:bg-brand-text/85">
              {t.cta.send}
            </Button>
          </form>

          <div className="cta-reveal mt-6 flex justify-center gap-3">
            <Button asChild variant="outline" className="rounded-full border-brand-border/40 bg-transparent">
              <a href="https://t.me/" target="_blank" rel="noreferrer"><Send className="h-4 w-4" /> Telegram</a>
            </Button>
            <Button asChild variant="outline" className="rounded-full border-brand-border/40 bg-transparent">
              <a href="https://instagram.com/" target="_blank" rel="noreferrer"><Instagram className="h-4 w-4" /> Instagram</a>
            </Button>
          </div>
        </div>
      </div>

      <footer className="cta-footer border-t border-brand-border/20 bg-brand-bg px-6 py-14">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-center text-center">
          <div className="footer-reveal">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/logo.png" alt="NAMI STUDIO" className="h-10 w-auto" />
          </div>
          <div className="footer-reveal mt-6 flex items-center justify-center gap-6 text-sm text-brand-text/70">
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
        <Separator className="mx-auto my-8 max-w-6xl bg-brand-border/20" />
        <p className="footer-reveal text-center font-mono text-xs text-brand-accent">{t.cta.rights}</p>
      </footer>
    </section>
  );
}
