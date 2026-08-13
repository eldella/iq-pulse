"use client";

import { createContext, useContext, useEffect, useSyncExternalStore, type ReactNode } from "react";
import { dictionary, type Dictionary, type Lang } from "@/lib/i18n/dictionary";

const STORAGE_KEY = "iqpulse-lang";
const listeners = new Set<() => void>();

function isLang(value: string | null): value is Lang {
  return value === "es" || value === "en";
}

function getSnapshot(): Lang {
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return isLang(stored) ? stored : "es";
}

function getServerSnapshot(): Lang {
  return "es";
}

function subscribe(callback: () => void) {
  listeners.add(callback);
  window.addEventListener("storage", callback);
  return () => {
    listeners.delete(callback);
    window.removeEventListener("storage", callback);
  };
}

function setLang(value: Lang) {
  window.localStorage.setItem(STORAGE_KEY, value);
  listeners.forEach((notify) => notify());
}

type LanguageContextValue = {
  lang: Lang;
  t: Dictionary;
  toggleLang: () => void;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

/**
 * Client-side language switch (no URL/locale routing) - persisted to
 * localStorage via the same useSyncExternalStore pattern as AuthProvider,
 * so it reads correctly on the client without a hydration mismatch (server
 * always renders "es", matching `<html lang="es">` in layout.tsx).
 */
export function LanguageProvider({ children }: { children: ReactNode }) {
  const lang = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  // <html lang> is hardcoded "es" in layout.tsx (a Server Component, so it
  // can't read the client-only localStorage language state) - keep it in
  // sync here instead, so screen readers use the right pronunciation rules
  // once the client has hydrated. suppressHydrationWarning on <html>
  // (layout.tsx) is what makes this safe to mutate post-hydration.
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const value: LanguageContextValue = {
    lang,
    t: dictionary[lang],
    toggleLang: () => setLang(lang === "es" ? "en" : "es"),
  };

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }
  return ctx;
}
