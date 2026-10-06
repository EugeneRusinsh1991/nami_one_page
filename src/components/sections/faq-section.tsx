"use client";

import { useRef } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { revealOnScroll, useGSAP } from "@/lib/gsap";
import { SectionHeader } from "@/components/ui/section-header";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/typography";
import { useLanguage } from "@/components/providers/language-provider";

export function FaqSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { t } = useLanguage();

  useGSAP(
    () => {
      revealOnScroll(".faq-head", ".faq-head", { y: 40, duration: 1 });
      revealOnScroll(".faq-item", ".faq-list", {
        y: 30,
        stagger: 0.1,
        start: "top 80%",
      });
    },
    { scope: containerRef }
  );

  return (
    <section
      ref={containerRef}
      id="faq"
      className="section-screen flex items-center justify-center bg-brand-bg px-4 sm:px-6 pt-[calc(1.5rem+var(--app-safe-top,0px))] pb-[calc(1.5rem+var(--app-safe-bottom,0px))] sm:py-12 md:py-16"
    >
      <div className="mx-auto flex h-full max-h-full w-full max-w-6xl flex-col justify-center gap-4 sm:gap-8 md:grid md:grid-cols-[1fr_1.4fr] md:gap-12 md:items-center min-h-0 flex-1">
        <SectionHeader
          align="right"
          badge={t.faq.label}
          title={t.faq.title}
          className="faq-head shrink-0 md:justify-self-end md:ml-auto max-w-md"
        />

        <div className="w-full flex flex-col items-start min-h-0 flex-1 justify-center md:flex-initial">
          <Accordion
            type="single"
            collapsible
            defaultValue="item-0"
            className="faq-list w-full"
          >
            {t.faq.items.map((item, i) => (
              <AccordionItem key={i} value={`item-${i}`} className="faq-item border-brand-border/30">
                <AccordionTrigger className="py-2.5 sm:py-3.5 md:py-5 text-left font-heading text-sm sm:text-base md:text-lg font-semibold text-brand-text transition-colors hover:text-brand-text/70 hover:no-underline">
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

          <div className="w-full mt-4 sm:mt-6 md:mt-10 shrink-0">
            <Button
              asChild
              variant="brand-primary"
              size="default"
              className="w-full shadow-md hover:-translate-y-0.5 transition-transform"
            >
              <Link
                href="/client-guide"
                className="inline-flex w-full items-center justify-center gap-2"
              >
                <span>{t.faq.guideButton}</span>
                <ArrowUpRight className="h-4 w-4 shrink-0" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
