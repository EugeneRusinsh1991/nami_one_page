import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Navbar } from "@/components/layout/navbar";
import { ClientGuideHero } from "@/components/sections/client-guide/client-guide-hero";
import { ClientGuideFaq } from "@/components/sections/client-guide/client-guide-faq";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Гайд для клієнта & FAQ | NAMI PMU",
  description:
    "Вичерпний гід та часті запитання для клієнтів перманентного макіяжу: безпека, протипоказання, підготовка, контактні лінзи та догляд після процедури в NAMI PMU Studio.",
  alternates: {
    canonical: "/client-guide",
  },
  openGraph: {
    title: "Гайд для клієнта & FAQ | NAMI PMU",
    description:
      "Відповіді на всі питання перед візитом на перманентний макіяж: безпека, матеріали, протипоказання та етапи загоєння.",
    url: "/client-guide",
  },
};

export default function ClientGuidePage() {
  return (
    <main className="relative min-h-screen bg-brand-bg text-brand-text">
      <Navbar />
      <ClientGuideHero />
      <ClientGuideFaq />

      <footer className="border-t border-brand-border/20 bg-brand-surface/60 py-8 px-4 text-center sm:py-10 pb-[calc(2rem+var(--app-safe-bottom,0px))]">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row text-xs text-brand-text/60">
          <p>© {new Date().getFullYear()} NAMI PMU STUDIO. Всі права захищені.</p>
          <Button asChild variant="ghost" size="sm" className="h-auto p-0 text-xs text-brand-text/70 hover:text-brand-text">
            <Link href="/" className="inline-flex items-center gap-1.5">
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Повернутися на головну</span>
            </Link>
          </Button>
        </div>
      </footer>
    </main>
  );
}
