"use client";

import { useRef } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { gsap, useGSAP, prefersReducedMotion } from "@/lib/gsap";
import { Button } from "@/components/ui/button";
import { MediaBadgeCard, MASTER_CARD_CONFIG } from "@/components/sections/showcase/media-badge-card";
import { SectionHeader } from "@/components/ui/section-header";
import { useLanguage } from "@/components/providers/language-provider";
import { cn } from "@/lib/utils";

export interface ClientGuideHeroProps {
  className?: string;
}

export function ClientGuideHero({ className }: ClientGuideHeroProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { t } = useLanguage();
  const data = t.clientGuide.hero;

  useGSAP(
    () => {
      const copy = containerRef.current?.querySelector(".guide-copy");

      if (copy) {
        gsap.from(copy.children, {
          y: 40,
          opacity: 0,
          stagger: 0.12,
          duration: 1,
          ease: "power3.out",
          scrollTrigger: { trigger: copy, start: "top 80%" },
        });
      }

      if (!prefersReducedMotion()) {
        const decors = containerRef.current?.querySelectorAll(".guide-decor");
        if (decors && decors.length > 0) {
          gsap.to(decors, {
            yPercent: 12,
            ease: "none",
            scrollTrigger: { trigger: containerRef.current, start: "top bottom", end: "bottom top", scrub: true },
          });
        }

        const dots = containerRef.current?.querySelectorAll(".guide-dots");
        if (dots && dots.length > 0) {
          gsap.to(dots, {
            yPercent: -20,
            ease: "none",
            scrollTrigger: { trigger: containerRef.current, start: "top bottom", end: "bottom top", scrub: true },
          });
        }
      }
    },
    { scope: containerRef }
  );

  const linkData = data.link || {
    href: "/",
    text: t.clientGuide.meta.backToHome || "Повернутися на головну",
  };

  return (
    <section
      ref={containerRef}
      id="client-guide-hero"
      className={cn(
        "client-guide-hero section-screen relative flex w-full flex-col justify-between overflow-hidden bg-brand-surface px-4 sm:px-6 isolate",
        MASTER_CARD_CONFIG.sectionPadding,
        className
      )}
    >
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="guide-decor absolute -top-24 -left-20 h-72 w-72 rounded-full bg-brand-bg blur-3xl sm:h-96 sm:w-96" />
        <div className="guide-decor absolute -bottom-24 -right-20 h-72 w-72 rounded-full bg-brand-elevated/70 blur-3xl sm:h-96 sm:w-96" />
        <div className="guide-dots absolute top-[8%] right-4 hidden h-32 w-32 opacity-40 [background-image:radial-gradient(#7C8794_1.5px,transparent_1.5px)] [background-size:14px_14px] sm:block sm:h-40 sm:w-40 sm:right-10" />
        <span className="absolute bottom-2 left-3 hidden select-none whitespace-nowrap text-[8rem] font-bold uppercase leading-none tracking-tighter text-brand-accent/20 sm:block lg:text-[12rem]">
          {data.label}
        </span>
      </div>

      <div className="relative mx-auto flex flex-1 h-full max-h-full w-full max-w-6xl flex-col justify-between md:grid md:grid-cols-2 md:gap-12 lg:gap-16 md:items-center">
        <div
          className={cn(
            "guide-copy shrink-0 w-full max-w-md",
            MASTER_CARD_CONFIG.headerMargin,
            "order-1 md:order-1 md:justify-self-end md:ml-auto"
          )}
        >
          <SectionHeader
            align="left"
            badge={data.label}
            title={data.title}
            titleClassName="break-words"
            className="w-full items-start text-left md:items-end md:text-right"
          />
        </div>

        <div className="guide-media relative flex flex-1 min-h-0 w-full flex-col items-center justify-center py-1 sm:py-2 md:py-0 order-2 md:order-2">
          <MediaBadgeCard
            image="/images/image (3).png"
            alt={data.label}
            metrics={data.metrics}
            hasLink={Boolean(linkData)}
          />

          {linkData && (
            <div className="mt-3 sm:mt-3.5 w-[68vw] sm:w-[46vw] md:w-[34vw] lg:w-[28vw] max-w-[340px] md:max-w-[380px] lg:max-w-[400px] shrink-0 z-20">
              <Button asChild variant="brand-primary" size="default" className="w-full shadow-md hover:-translate-y-0.5 transition-transform">
                <Link
                  href={linkData.href}
                  className="inline-flex w-full items-center justify-center gap-2"
                >
                  <ArrowLeft className="h-4 w-4 shrink-0" />
                  <span>{linkData.text}</span>
                </Link>
              </Button>
            </div>
          )}
        </div>

        <div
          aria-hidden="true"
          className={cn(
            "order-3 w-full shrink-0 md:hidden",
            Boolean(linkData) ? "h-6 sm:h-8" : "h-10 sm:h-12",
            MASTER_CARD_CONFIG.bottomBarPadding
          )}
        />
      </div>
    </section>
  );
}
