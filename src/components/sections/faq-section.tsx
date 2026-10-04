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
      className="relative flex h-dvh min-h-dvh w-full items-start justify-center sm:items-center overflow-hidden bg-brand-bg px-6 pt-[calc(2rem+env(safe-area-inset-top,0px))] pb-[calc(2rem+env(safe-area-inset-bottom,0px))] sm:py-12 md:py-16"
    >
      <div className="mx-auto grid w-full max-w-6xl items-center gap-6 sm:gap-8 md:grid-cols-[1fr_1.4fr] md:gap-12">
        <SectionHeader
          align="right"
          badge={t.faq.label}
          title={t.faq.title}
          className="faq-head md:justify-self-end md:ml-auto max-w-md"
        />

        <Accordion
          type="single"
          collapsible
          defaultValue="item-0"
          className="faq-list w-full"
        >
          {t.faq.items.map((item, i) => (
            <AccordionItem key={item.t} value={`item-${i}`} className="faq-item border-brand-border/30">
              <AccordionTrigger className="py-4 md:py-5 text-left font-heading text-base md:text-lg font-semibold text-brand-text hover:no-underline">
                {item.t}
              </AccordionTrigger>
              <AccordionContent>
                <Text variant="subtle" className="text-sm md:text-base">
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
