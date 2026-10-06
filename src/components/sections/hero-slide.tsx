import type { ReactNode } from "react";
import { Heading } from "@/components/ui/typography";
import { cn } from "@/lib/utils";
import { ACCENT_CLASS } from "./hero-video-utils";

export interface HeroSlideProps {
  index: number;
  title: string;
  className?: string;
  headingClassName?: string;
  as?: "h1" | "h2";
  badgeSrc?: string;
  badgeAlt?: string;
  isAccentWord: (wordIndex: number) => boolean;
  children?: ReactNode;
}

export function HeroSlide({
  index,
  title,
  className,
  headingClassName,
  as = "h2",
  badgeSrc,
  badgeAlt = "NAMI STUDIO",
  isAccentWord,
  children,
}: HeroSlideProps): React.JSX.Element {
  const isSlide0 = index === 0;

  return (
    <div
      className={cn(
        "hero-slide relative z-10 mx-auto flex h-full max-w-5xl flex-col items-center justify-center px-6 text-center will-change-transform transform-gpu",
        `hero-slide-${index}`,
        className
      )}
      style={{
        paddingTop: "calc(var(--app-safe-top) + var(--header-safe-gap, 1.25rem))",
        paddingBottom: "calc(var(--app-safe-bottom) + 1.5rem)",
      }}
    >
      {badgeSrc && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={badgeSrc}
          alt={badgeAlt}
          className="hero-badge mb-8 h-7 w-auto object-contain sm:h-8"
        />
      )}

      <div className="relative isolate flex flex-col items-center">
        <div
          aria-hidden="true"
          className="hero-halo pointer-events-none absolute -inset-x-[20%] -inset-y-[35%] -z-10 bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0.68),transparent_72%)] blur-3xl will-change-[transform,opacity]"
        />
        <Heading
          as={as}
          size="display"
          className={cn(
            "font-semibold tracking-[-0.025em] text-white [text-shadow:0_2px_16px_rgba(0,0,0,0.6)]",
            headingClassName
          )}
        >
          {title.split(" ").map((word, i) => {
            const accent = isAccentWord(i);
            if (isSlide0) {
              return (
                <span key={`${word}-${i}`} className="block overflow-hidden px-[0.1em] py-[0.05em]">
                  <span className={cn("hero-word inline-block", accent && ACCENT_CLASS)}>
                    {word}
                  </span>
                </span>
              );
            }
            return (
              <span key={`${word}-${i}`} className={cn("block", accent && ACCENT_CLASS)}>
                {word}
              </span>
            );
          })}
        </Heading>
      </div>

      {children}
    </div>
  );
}
