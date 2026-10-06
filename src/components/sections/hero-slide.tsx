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
        "hero-slide isolate will-change-transform transform-gpu absolute inset-0 z-10 mx-auto flex h-[100dvh] max-w-5xl flex-col items-center text-center",
        `hero-slide-${index}`,
        isSlide0
          ? "justify-start px-6 safe-offset-mobile md:justify-center"
          : "pointer-events-none opacity-0",
        index === 1 && "justify-center px-6 pt-[env(safe-area-inset-top,0px)] pb-[calc(5rem+env(safe-area-inset-bottom,0px))] md:py-0",
        index === 2 && "justify-start px-6 safe-offset-mobile md:justify-center",
        className
      )}
    >
      {badgeSrc && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={badgeSrc}
          alt={badgeAlt}
          className="hero-badge mb-8 h-7 w-auto object-contain sm:h-8"
        />
      )}

      <Heading
        as={as}
        size="display"
        className={cn(
          "font-semibold tracking-[-0.025em] text-white [text-shadow:0_2px_16px_rgba(0,0,0,0.6)] relative before:pointer-events-none before:absolute before:-inset-x-[15%] before:-inset-y-[30%] before:-z-10 before:content-[''] before:bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0.65),transparent_72%)] before:blur-2xl",
          isSlide0 && "min-h-[144px] md:min-h-0",
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

      {children}
    </div>
  );
}
