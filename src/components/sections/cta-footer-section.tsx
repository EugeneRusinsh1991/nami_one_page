"use client";

import { useRef, useState } from "react";
import { MapPin, Clock, Send, MessageCircle } from "lucide-react";
import { gsap, useGSAP } from "@/lib/gsap";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLanguage } from "@/components/providers/language-provider";

export function CtaFooterSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [zone, setZone] = useState("0");
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
          <p className="cta-reveal mt-4 text-brand-text/65">{t.cta.sub}</p>

          <Tabs value={zone} onValueChange={setZone} className="cta-reveal mt-10">
            <TabsList className="mx-auto h-auto rounded-full bg-brand-elevated p-1">
              {t.cta.zones.map((label, i) => (
                <TabsTrigger
                  key={label}
                  value={String(i)}
                  className="rounded-full px-6 py-2 data-[state=active]:bg-brand-text data-[state=active]:text-white"
                >
                  {label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          <form onSubmit={(e) => e.preventDefault()} className="cta-reveal mt-8 grid gap-3 sm:grid-cols-2">
            <Input placeholder={t.cta.name} className="h-12 rounded-full border-brand-border/30 bg-white/80 px-5" />
            <Input placeholder={t.cta.phone} className="h-12 rounded-full border-brand-border/30 bg-white/80 px-5" />
            <Button type="submit" size="lg" className="h-12 rounded-full bg-brand-text text-white transition-transform hover:-translate-y-0.5 hover:bg-brand-text/85 sm:col-span-2">
              {t.cta.send}
            </Button>
          </form>

          <div className="cta-reveal mt-6 flex justify-center gap-3">
            <Button asChild variant="outline" className="rounded-full border-brand-border/40 bg-transparent">
              <a href="https://t.me/" target="_blank" rel="noreferrer"><Send /> Telegram</a>
            </Button>
            <Button asChild variant="outline" className="rounded-full border-brand-border/40 bg-transparent">
              <a href="https://wa.me/" target="_blank" rel="noreferrer"><MessageCircle /> WhatsApp</a>
            </Button>
          </div>
        </div>
      </div>

      <footer className="cta-footer border-t border-brand-border/20 bg-brand-bg px-6 py-14">
        <div className="mx-auto grid max-w-6xl gap-10 md:grid-cols-3">
          <div className="footer-reveal">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/logo.png" alt="NAMI STUDIO" className="h-10 w-auto" />
          </div>
          <div className="footer-reveal space-y-3 text-sm text-brand-text/70">
            <p className="flex items-center gap-2"><MapPin className="h-4 w-4 text-brand-border" /> {t.cta.address}</p>
            <p className="flex items-center gap-2"><Clock className="h-4 w-4 text-brand-border" /> {t.cta.hours}</p>
            <a href="https://maps.google.com" target="_blank" rel="noreferrer" className="inline-block underline-offset-4 hover:underline">
              {t.cta.map}
            </a>
          </div>
          <div className="footer-reveal space-y-3 text-sm text-brand-text/70 md:text-right">
            <a href="#" className="underline-offset-4 hover:underline">{t.cta.privacy}</a>
          </div>
        </div>
        <Separator className="mx-auto my-8 max-w-6xl bg-brand-border/20" />
        <p className="footer-reveal text-center font-mono text-xs text-brand-accent">{t.cta.rights}</p>
      </footer>
    </section>
  );
}
