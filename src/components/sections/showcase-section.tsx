"use client";

import { useRef } from "react";
import { ArrowUpRight } from "lucide-react";
import { gsap, useGSAP, prefersReducedMotion } from "@/lib/gsap";
import { Button } from "@/components/ui/button";
import { MASTER_CARD_CONFIG } from "@/components/ui/card";
import { MediaBadgeCard, type MetricItem } from "@/components/ui/media-badge-card";
import { SectionHeader } from "@/components/ui/section-header";
import { useLanguage } from "@/components/providers/language-provider";
import { cn } from "@/lib/utils";

export interface ShowcaseData {
  label: string;
  title: string;
  text?: string;
  metrics: MetricItem[];
  link?: {
    text: string;
    href: string;
  };
}

export interface ShowcaseSectionProps {
  id: string;
  image: string;
  data: ShowcaseData;
  mirrored?: boolean;
  className?: string;
}

export function ShowcaseSection({
  id,
  image,
  data,
  mirrored = false,
  className,
}: ShowcaseSectionProps) {
  const sectionRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const section = sectionRef.current;
      if (!section) return;

      const copy = section.querySelector(".showcase-copy");
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
        gsap.to(section.querySelectorAll(".showcase-decor"), {
          yPercent: 12,
          ease: "none",
          scrollTrigger: { trigger: section, start: "top bottom", end: "bottom top", scrub: true },
        });
        gsap.to(section.querySelectorAll(".showcase-dots"), {
          yPercent: -20,
          ease: "none",
          scrollTrigger: { trigger: section, start: "top bottom", end: "bottom top", scrub: true },
        });
      }
    },
    { scope: sectionRef }
  );

  return (
    <section
      ref={sectionRef}
      id={id}
      className={cn(
        "showcase-block relative flex h-svh min-h-svh max-h-svh h-[100svh] min-h-[100svh] max-h-[100svh] flex-none shrink-0 w-full flex-col justify-between overflow-hidden bg-brand-surface isolate",
        className
      )}
    >
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div
          className={cn(
            "showcase-decor absolute -top-24 h-72 w-72 rounded-full bg-brand-bg blur-3xl sm:h-96 sm:w-96",
            mirrored ? "-right-20" : "-left-20"
          )}
        />
        <div
          className={cn(
            "showcase-decor absolute -bottom-24 h-72 w-72 rounded-full bg-brand-elevated/70 blur-3xl sm:h-96 sm:w-96",
            mirrored ? "-left-20" : "-right-20"
          )}
        />
        <div
          className={cn(
            "showcase-dots absolute top-[8%] hidden h-32 w-32 opacity-40 [background-image:radial-gradient(#7C8794_1.5px,transparent_1.5px)] [background-size:14px_14px] sm:block sm:h-40 sm:w-40",
            mirrored ? "left-4 sm:left-10" : "right-4 sm:right-10"
          )}
        />
        <span
          className={cn(
            "absolute bottom-2 hidden select-none whitespace-nowrap text-[8rem] font-bold uppercase leading-none tracking-tighter text-brand-accent/20 sm:block lg:text-[12rem]",
            mirrored ? "right-3 sm:right-10" : "left-3 sm:left-10"
          )}
        >
          {data.label}
        </span>
      </div>

      <div className="relative z-10 mx-auto flex h-full w-full max-w-6xl flex-1 flex-col justify-between px-4 sm:px-6 pt-[calc(1rem+env(safe-area-inset-top,0px))] pb-[calc(1rem+env(safe-area-inset-bottom,0px))] sm:py-10 md:py-16 md:grid md:grid-cols-2 md:gap-12 lg:gap-16 md:items-center">
        <div
          className={cn(
            "showcase-copy shrink-0 w-full max-w-md",
            MASTER_CARD_CONFIG.headerMargin,
            mirrored
              ? "order-1 md:order-2 md:justify-self-start md:mr-auto"
              : "order-1 md:order-1 md:justify-self-end md:ml-auto"
          )}
        >
          <SectionHeader
            align="left"
            badge={data.label}
            title={data.title}
            titleClassName="break-words"
            className={cn(
              "w-full items-start text-left",
              mirrored ? "md:items-start md:text-left" : "md:items-end md:text-right"
            )}
          />
        </div>

        <div
          className={cn(
            "showcase-media relative flex flex-1 min-h-0 w-full flex-col items-center justify-center my-auto py-1 sm:py-2 md:py-0",
            mirrored ? "order-2 md:order-1" : "order-2 md:order-2"
          )}
        >
          <MediaBadgeCard
            image={image}
            alt={data.label}
            metrics={data.metrics}
            mirrored={mirrored}
            hasLink={Boolean(data.link)}
          />

          {data.link && (
            <div className="mt-2.5 sm:mt-3.5 w-[68vw] sm:w-[46vw] md:w-[34vw] lg:w-[28vw] max-w-[340px] md:max-w-[380px] lg:max-w-[400px] shrink-0 z-20">
              <Button asChild variant="brand-primary" size="default" className="w-full shadow-md hover:-translate-y-0.5 transition-transform">
                <a
                  href={data.link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex w-full items-center justify-center gap-2"
                >
                  <span>{data.link.text}</span>
                  <ArrowUpRight className="h-4 w-4 shrink-0" />
                </a>
              </Button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export function MasterSection() {
  const { t } = useLanguage();
  return (
    <ShowcaseSection
      id="master"
      image="/images/image (3).png"
      data={t.master}
      mirrored={false}
    />
  );
}

export function StudioSection() {
  const { t } = useLanguage();
  return (
    <ShowcaseSection
      id="studio"
      image="/images/image (4).png"
      data={t.studio}
      mirrored={true}
    />
  );
}

export function AcademySection() {
  const { t } = useLanguage();
  return (
    <ShowcaseSection
      id="academy"
      image="/images/image (2).png"
      data={t.academy}
      mirrored={false}
    />
  );
}
