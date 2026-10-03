"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useLanguage } from "@/components/providers/language-provider";

export function FaqSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { t } = useLanguage();

  useGSAP(
    () => {
      gsap.from(".faq-head", {
        y: 40,
        opacity: 0,
        duration: 1,
        ease: "power3.out",
        scrollTrigger: { trigger: ".faq-head", start: "top 85%" },
      });
      gsap.from(".faq-item", {
        y: 30,
        opacity: 0,
        duration: 0.8,
        stagger: 0.1,
        ease: "power3.out",
        scrollTrigger: { trigger: ".faq-list", start: "top 80%" },
      });
    },
    { scope: containerRef }
  );

  return (
    <section ref={containerRef} id="faq" className="bg-brand-bg px-6 py-28">
      <div className="mx-auto grid max-w-6xl gap-12 md:grid-cols-[1fr_1.4fr]">
        <div className="faq-head">
          <Badge variant="outline" className="mb-5 border-brand-border/50 font-mono text-[11px] font-normal uppercase tracking-[0.25em] text-brand-border">
            {t.faq.label}
          </Badge>
          <h2 className="font-heading text-3xl font-bold tracking-tight text-brand-text sm:text-5xl">{t.faq.title}</h2>
        </div>

        <Accordion type="single" collapsible defaultValue="item-0" className="faq-list">
          {t.faq.items.map((item, i) => (
            <AccordionItem key={item.t} value={`item-${i}`} className="faq-item border-brand-border/30">
              <AccordionTrigger className="py-6 text-left font-heading text-lg font-semibold text-brand-text hover:no-underline">
                {item.t}
              </AccordionTrigger>
              <AccordionContent className="text-brand-text/65">{item.d}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
