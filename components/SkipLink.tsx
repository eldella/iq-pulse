"use client";

import { useLanguage } from "@/components/LanguageProvider";

/** Visually hidden until focused - lets keyboard users jump past the header/nav chrome. */
export function SkipLink() {
  const { t } = useLanguage();

  return (
    <a
      href="#main-content"
      className="sr-only focus-visible:not-sr-only focus-visible:fixed focus-visible:left-4 focus-visible:top-4 focus-visible:z-[1000] focus-visible:rounded-full focus-visible:bg-accent focus-visible:px-5 focus-visible:py-2.5 focus-visible:text-sm focus-visible:font-semibold focus-visible:text-accent-foreground"
    >
      {t.header.skipToContent}
    </a>
  );
}
