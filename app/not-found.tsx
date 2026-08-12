"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { Emoji3D } from "@/components/Emoji3D";
import { useLanguage } from "@/components/LanguageProvider";
import { springTransition, tapScale } from "@/lib/motion";

export default function NotFound() {
  const { t } = useLanguage();
  const shouldReduceMotion = useReducedMotion();

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 px-4 py-24 text-center">
      <Emoji3D emoji="🧭" size="lg" className="mb-1" />
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-accent">404</p>
      <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
        {t.notFound.heading}
      </h1>
      <p className="max-w-md text-balance text-base text-muted-foreground">
        {t.notFound.subhead}
      </p>
      <motion.div
        whileHover={shouldReduceMotion ? undefined : { y: -2 }}
        whileTap={tapScale}
        transition={springTransition}
        className="mt-2"
      >
        <Link
          href="/"
          className="shine-hover inline-flex h-11 items-center gap-2 rounded-full bg-accent px-6 text-sm font-semibold text-accent-foreground shadow-lg shadow-accent/30 focus-visible:outline-none"
        >
          {t.notFound.cta}
        </Link>
      </motion.div>
    </main>
  );
}
