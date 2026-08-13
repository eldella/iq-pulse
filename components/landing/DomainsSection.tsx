"use client";

import { BrainCircuit, Gauge, Puzzle } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { AmbientBlob } from "@/components/AmbientBlob";
import { GlassCard } from "@/components/GlassCard";
import { useLanguage } from "@/components/LanguageProvider";
import { springTransition, tapScale } from "@/lib/motion";

/**
 * Icon-forward, three-item grid - deliberately NOT another prose essay like
 * Manifesto/Sustainment. Short label + one line each, so it reads as a
 * quick scan instead of another wall of text, and doubles as a preview of
 * what a future real assessment engine would actually measure.
 */
export function DomainsSection() {
  const shouldReduceMotion = useReducedMotion();
  const { t } = useLanguage();

  const domains = [
    { id: "reasoning", Icon: Puzzle, ...t.domains.item1 },
    { id: "memory", Icon: BrainCircuit, ...t.domains.item2 },
    { id: "speed", Icon: Gauge, ...t.domains.item3 },
  ];

  return (
    <section
      aria-labelledby="domains-heading"
      className="relative mx-auto flex w-full max-w-4xl flex-col items-center gap-10 px-4 py-16 text-center sm:px-6 sm:py-24"
    >
      <AmbientBlob className="right-0 top-0 h-72 w-72" durationSeconds={22} />

      <div className="flex flex-col items-center gap-2">
        <h2
          id="domains-heading"
          className="text-xs font-semibold uppercase tracking-[0.15em] text-accent"
        >
          {t.domains.heading}
        </h2>
        <p className="max-w-md text-balance text-base text-muted-foreground">
          {t.domains.subhead}
        </p>
      </div>

      <motion.div
        initial={shouldReduceMotion ? false : "hidden"}
        whileInView="show"
        viewport={{ once: true, amount: 0.3 }}
        variants={{ hidden: {}, show: { transition: { staggerChildren: 0.1 } } }}
        className="grid w-full grid-cols-1 gap-8 sm:grid-cols-3"
      >
        {domains.map(({ id, Icon, title, body }) => (
          <motion.div
            key={id}
            variants={{
              hidden: { opacity: 0, y: 20 },
              show: { opacity: 1, y: 0, transition: springTransition },
            }}
            whileHover={{ y: -4 }}
            whileTap={tapScale}
            transition={springTransition}
          >
            <GlassCard
              variant="plain"
              className="flex h-full flex-col items-center gap-3 p-6 text-center shadow-sm transition-shadow hover:shadow-md"
            >
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-accent/10 text-accent">
                <Icon className="h-6 w-6" aria-hidden="true" />
              </span>
              <h3 className="text-base font-semibold text-foreground">{title}</h3>
              <p className="max-w-xs text-sm text-pretty leading-relaxed text-muted-foreground">
                {body}
              </p>
            </GlassCard>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}
