"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { ScrollReveal } from "@/components/ScrollReveal";
import { springTransition } from "@/lib/motion";

/**
 * Shared shell for the Términos/Privacidad pages: same header, back link,
 * and typographic rhythm for both, so legal copy reads consistently without
 * pulling in a prose/typography plugin for two static pages.
 */
export function LegalPageShell({
  title,
  updatedOn,
  children,
}: {
  title: string;
  updatedOn: string;
  children: ReactNode;
}) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-16 sm:px-6 sm:py-24">
      <motion.div
        initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0, transition: springTransition }}
      >
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 rounded text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline focus-visible:outline-none"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Volver al inicio
        </Link>

        <h1 className="mt-6 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          {title}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Última actualización: {updatedOn}
        </p>
      </motion.div>

      <div className="mt-10 flex flex-col gap-8">{children}</div>
    </main>
  );
}

export function LegalSection({
  heading,
  children,
}: {
  heading: string;
  children: ReactNode;
}) {
  return (
    <ScrollReveal amount={0.5}>
      <section>
        <h2 className="text-lg font-semibold text-foreground">{heading}</h2>
        <div className="mt-2 flex flex-col gap-3 text-base leading-relaxed text-muted-foreground">
          {children}
        </div>
      </section>
    </ScrollReveal>
  );
}

export function LegalList({ items }: { items: readonly string[] }) {
  return (
    <ul className="list-disc space-y-2 pl-5">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}
