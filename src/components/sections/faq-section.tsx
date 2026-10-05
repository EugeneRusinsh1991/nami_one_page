"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { SectionHeader } from "@/components/ui/section-header";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Text } from "@/components/ui/typography";
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
    { scope: containerRef, dependencies: [t], revertOnUpdate: true }
  );

  return (
    <section
      ref={containerRef}
      id="faq"
      className="relative flex h-svh min-h-svh max-h-svh w-full items-center justify-center overflow-hidden bg-brand-bg px-4 sm:px-6 pt-[calc(1.5rem+env(safe-area-inset-top,0px))] pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))] sm:py-12 md:py-16"
    >
      <div className="mx-auto flex h-full max-h-full w-full max-w-6xl flex-col justify-center gap-4 sm:gap-8 md:grid md:grid-cols-[1fr_1.4fr] md:gap-12 md:items-center">
        <SectionHeader
          align="right"
          badge={t.faq.label}
          title={t.faq.title}
          className="faq-head shrink-0 md:justify-self-end md:ml-auto max-w-md"
        />

        <Accordion
          type="single"
          collapsible
          defaultValue="item-0"
          className="faq-list w-full max-h-[58svh] overflow-y-auto sm:max-h-none sm:overflow-visible pr-1 sm:pr-0 overscroll-contain"
        >
          {t.faq.items.map((item, i) => (
            <AccordionItem key={item.t} value={`item-${i}`} className="faq-item border-brand-border/30">
              <AccordionTrigger className="py-2.5 sm:py-3.5 md:py-5 text-left font-heading text-sm sm:text-base md:text-lg font-semibold text-brand-text hover:no-underline">
                {item.t}
              </AccordionTrigger>
              <AccordionContent className="pb-2.5 pt-0 sm:pb-4">
                <Text variant="subtle" className="text-xs sm:text-sm md:text-base leading-relaxed">
                  {item.d}
                </Text>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
