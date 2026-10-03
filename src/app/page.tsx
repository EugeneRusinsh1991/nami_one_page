import { Navbar } from "@/components/layout/navbar";
import { HeroVideoSection } from "@/components/sections/hero-video-section";
import { PhilosophySection } from "@/components/sections/philosophy-section";
import { TechniqueVideoSection } from "@/components/sections/technique-video-section";
import { PortfolioSliderSection } from "@/components/sections/portfolio-slider-section";
import { MasterVideoSection } from "@/components/sections/master-video-section";
import { FaqSection } from "@/components/sections/faq-section";
import { CtaFooterSection } from "@/components/sections/cta-footer-section";

export default function Home() {
  return (
    <main className="relative">
      <Navbar />
      <HeroVideoSection />
      <PhilosophySection />
      <TechniqueVideoSection />
      <PortfolioSliderSection />
      <MasterVideoSection />
      <FaqSection />
      <CtaFooterSection />
    </main>
  );
}
