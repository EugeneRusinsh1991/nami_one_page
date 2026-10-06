"use client";

import { useRef } from "react";
import { revealOnScroll, useGSAP } from "@/lib/gsap";
import { SectionHeader } from "@/components/ui/section-header";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Text } from "@/components/ui/typography";
import { useLanguage } from "@/components/providers/language-provider";
import { cn } from "@/lib/utils";

export interface ClientGuideFaqProps {
  className?: string;
}

export function ClientGuideFaq({ className }: ClientGuideFaqProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { t } = useLanguage();

  useGSAP(
    () => {
      revealOnScroll(".faq-head", ".faq-head", { y: 30, duration: 1 });
      revealOnScroll(".faq-item", ".faq-list", {
        y: 20,
        stagger: 0.08,
        start: "top 85%",
      });
    },
    { scope: containerRef }
  );

  return (
    <section
      ref={containerRef}
      id="guide-faq"
      className={cn(
        "section-screen relative w-full bg-brand-bg",
        className
      )}
    >
      <div className="mx-auto flex h-full max-h-full w-full max-w-5xl flex-1 min-h-0 flex-col gap-10 overflow-y-auto px-4 sm:px-6 py-12 sm:py-16 md:py-20 pb-[calc(3rem+var(--app-safe-bottom,0px))] md:grid md:grid-cols-[1fr_1.4fr] md:gap-12 lg:gap-16 md:items-start">
        <div className="faq-head w-full max-w-md md:sticky md:top-24">
          <SectionHeader
            align="left"
            badge={t.clientGuide.faq.label}
            title={t.clientGuide.faq.title}
            titleClassName="break-words font-heading text-2xl sm:text-3xl md:text-4xl font-medium tracking-tight"
            className="w-full items-start text-left"
          />
        </div>

        <Accordion
          type="single"
          collapsible
          defaultValue="item-0"
          className="faq-list w-full divide-y divide-brand-border/30"
        >
          {t.clientGuide.faq.items.map((item, i) => (
            <AccordionItem
              key={i}
              value={`item-${i}`}
              className="faq-item border-brand-border/30 py-1"
            >
              <AccordionTrigger className="py-4 sm:py-5 text-left font-heading text-base sm:text-lg font-medium text-brand-text transition-colors hover:text-brand-text/70 hover:no-underline gap-4">
                <div className="flex flex-col items-start gap-1.5 text-left pr-2">
                  {item.badge && (
                    <span className="inline-flex items-center rounded-full bg-brand-surface border border-brand-border/40 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-brand-text/60">
                      {item.badge}
                    </span>
                  )}
                  <span className="leading-snug">{item.t}</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pb-4 pt-1 sm:pb-6">
                <Text
                  variant="subtle"
                  className="text-xs sm:text-sm md:text-base leading-relaxed text-brand-text/80"
                >
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
