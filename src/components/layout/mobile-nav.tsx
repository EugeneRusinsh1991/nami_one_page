"use client";

import { useEffect, useState } from "react";
import { Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useLanguage } from "@/components/providers/language-provider";
import { useScrollTo } from "@/hooks/use-scroll-to";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { NAV_ITEMS } from "@/components/layout/navbar";

const MENU_LABELS: Record<string, string> = {
  uk: "Меню сайту",
  ru: "Меню сайта",
  de: "Website-Menü",
  en: "Site Menu",
};

export interface MobileHeroNavProps {
  className?: string;
}

export function MobileHeroNav({ className }: MobileHeroNavProps) {
  const [open, setOpen] = useState(false);
  const { locale, t } = useLanguage();
  const { scrollToId } = useScrollTo();

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const goTo = (id: string) => {
    setOpen(false);
    scrollToId(id);
  };

  return (
    <div className={cn("flex flex-col items-center gap-2.5 lg:hidden", className)}>
      <div className="inline-flex h-10 items-center rounded-full border border-brand-border/50 bg-white/80 px-4 text-brand-text backdrop-blur-md shadow-sm">
        <LanguageSwitcher />
      </div>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <button
            type="button"
            className="inline-flex h-10 items-center gap-2 rounded-full border border-brand-border/50 bg-white/80 px-4 text-xs font-mono uppercase tracking-widest text-brand-text backdrop-blur-md shadow-sm transition-all hover:bg-white/95 active:scale-95 md:hidden"
          >
            <Menu className="h-3.5 w-3.5" />
            <span>{MENU_LABELS[locale] || MENU_LABELS.uk}</span>
          </button>
        </SheetTrigger>
        <SheetContent side="right" className="bg-brand-bg">
          <SheetTitle className="sr-only">{MENU_LABELS[locale] || MENU_LABELS.uk}</SheetTitle>
          <div className="mt-10 flex flex-col gap-6 font-heading text-2xl">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => goTo(item.id)}
                className="text-left transition-colors hover:text-brand-text/70"
              >
                {t.nav[item.labelKey]}
              </button>
            ))}
            <Button
              variant="brand-primary"
              onClick={() => goTo("booking")}
              className="mt-4"
            >
              {t.nav.book}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
