"use client";

import Link from "next/link";
import { useLanguage } from "@/components/LanguageProvider";
import { SocialLinks } from "@/components/SocialLinks";

/**
 * Shared footer rendered once from app/layout.tsx. Language switching lives
 * in the header's "more" menu (HeaderMoreMenu) instead of here, so it isn't
 * duplicated in two places.
 */
export function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="border-t border-glass-border px-4 py-8 sm:px-6">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-5 text-center">
        <span className="text-base font-semibold tracking-tight text-foreground">
          IQ<span className="text-accent">.</span>Pulse
        </span>
        <p className="max-w-md text-sm text-muted-foreground">{t.footer.tagline}</p>

        <SocialLinks />

        <nav
          aria-label={t.footer.navAriaLabel}
          className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm"
        >
          <Link
            href="/terminos"
            className="rounded text-muted-foreground underline-offset-4 hover:text-foreground hover:underline focus-visible:outline-none"
          >
            {t.footer.terms}
          </Link>
          <span aria-hidden="true" className="text-foreground/30">
            ·
          </span>
          <Link
            href="/privacidad"
            className="rounded text-muted-foreground underline-offset-4 hover:text-foreground hover:underline focus-visible:outline-none"
          >
            {t.footer.privacy}
          </Link>
        </nav>
      </div>
    </footer>
  );
}
