"use client";

import { cn } from "@/lib/utils";
import { LOCALES, useLanguage } from "@/components/providers/language-provider";

export interface LanguageSwitcherProps {
  className?: string;
}

export function LanguageSwitcher({ className }: LanguageSwitcherProps) {
  const { locale, setLocale } = useLanguage();

  return (
    <div className={cn("flex items-center font-mono text-xs tracking-widest", className)}>
      {LOCALES.map(({ code, label }, i) => (
        <span key={code} className="flex items-center">
          {i > 0 && <span className="mx-1.5 text-brand-accent">|</span>}
          <button
            type="button"
            onClick={() => setLocale(code)}
            aria-pressed={locale === code}
            className={cn(
              "transition-colors hover:text-brand-text active:scale-95",
              locale === code ? "font-semibold text-brand-text" : "text-brand-border"
            )}
          >
            {label}
          </button>
        </span>
      ))}
    </div>
  );
}
