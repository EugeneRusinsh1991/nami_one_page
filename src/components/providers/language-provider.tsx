"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { de } from "@/lib/i18n/de";
import { en } from "@/lib/i18n/en";
import { ru } from "@/lib/i18n/ru";
import { uk } from "@/lib/i18n/uk";
import type { Dict } from "@/lib/i18n/types";

export type { Dict } from "@/lib/i18n/types";

export type Locale = "uk" | "ru" | "en" | "de";
export const LOCALES: { code: Locale; label: string }[] = [
  { code: "uk", label: "UA" },
  { code: "ru", label: "RU" },
  { code: "en", label: "EN" },
  { code: "de", label: "DE" },
];

const dictionaries: Record<Locale, Dict> = { uk, ru, en, de };

type Ctx = { locale: Locale; setLocale: (l: Locale) => void; t: Dict };
const LanguageContext = createContext<Ctx | null>(null);

const STORAGE_KEY = "nami_locale";

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("uk");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as Locale | null;
      if (saved && saved in dictionaries) {
        setLocaleState(saved);
      }
    } catch {
      // ignore storage access errors
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    try {
      localStorage.setItem(STORAGE_KEY, l);
    } catch {
      // ignore storage access errors
    }
  }, []);
  const value = useMemo(() => ({ locale, setLocale, t: dictionaries[locale] }), [locale, setLocale]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}
