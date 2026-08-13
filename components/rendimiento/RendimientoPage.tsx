"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { useLanguage } from "@/components/LanguageProvider";
import { springTransition } from "@/lib/motion";

/**
 * Own nav destination for the "General vs Vos" comparison - the
 * comparison itself isn't shown yet (pulled per feedback that mixing %
 * and seconds on one chart was confusing even after a few redesign
 * passes; a two-section version exists in git history, commit
 * c2983b8, ready to pick back up later) - see the ready commit rather
 * than rebuilding from scratch when this comes back.
 */
export function RendimientoPage() {
  const { t } = useLanguage();
  const shouldReduceMotion = useReducedMotion();

  return (
    <main className="flex flex-1 flex-col items-center gap-6 px-4 py-16 sm:px-6">
      <motion.div
        initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0, transition: springTransition }}
        className="flex flex-col items-center gap-3 text-center"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-accent">
          {t.stats.performance.eyebrow}
        </p>
        <h1 className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
          {t.stats.performance.heading}
        </h1>
        <p className="max-w-2xl text-balance text-lg text-muted-foreground">
          {t.stats.performance.subhead}
        </p>
      </motion.div>

      <Link
        href="/perfil"
        className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
      >
        {t.hero.viewProfile}
      </Link>
    </main>
  );
}
