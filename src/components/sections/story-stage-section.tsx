import type { CSSProperties, ReactNode, RefObject } from "react";
import { cn } from "@/lib/utils";

export interface StoryStageSectionProps {
  id: string;
  sectionRef: RefObject<HTMLElement | null>;
  stage: ReactNode;
  slots: readonly ReactNode[];
  className?: string;
}

export function StoryStageSection({
  id,
  sectionRef,
  stage,
  slots,
  className,
}: StoryStageSectionProps): React.JSX.Element {
  return (
    <section
      ref={sectionRef}
      id={id}
      className={cn("section-story", className)}
      style={{ "--story-slots": slots.length } as CSSProperties}
    >
      <div className="story-stage">{stage}</div>
      <div className="story-track">
        {slots.map((slot, i) => (
          <div key={i} className={`story-slot story-slot-${i}`}>
            {slot}
          </div>
        ))}
      </div>
    </section>
  );
}
