"use client";

import type { ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Compass, Sprout, UserRound } from "lucide-react";
import { GlassCard } from "@/components/GlassCard";
import { AmbientBlob } from "@/components/AmbientBlob";
import { Emoji3D } from "@/components/Emoji3D";
import { useLanguage } from "@/components/LanguageProvider";
import { springTransition, tapScale } from "@/lib/motion";
import { cn } from "@/lib/utils";

/**
 * Bento card: dark glass surface with a lift + border-glow hover, used to
 * break the manifesto essay into distinct, scannable chunks instead of one
 * wall of text. Still editorial prose inside — this only changes the frame,
 * not the copy's register.
 */
function ManifestoCard({
  icon: Icon,
  emoji,
  title,
  children,
  className,
}: {
  icon: typeof Compass;
  emoji: string;
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      whileTap={tapScale}
      transition={springTransition}
      className={cn("h-full", className)}
    >
      <GlassCard className="relative flex h-full flex-col gap-3 rounded-2xl border-0 p-6 shadow-sm transition-shadow hover:shadow-md">
        <Emoji3D emoji={emoji} size="sm" className="absolute -top-3 -right-3" />
        <span className="flex h-11 w-11 items-center justify-center rounded-full border border-glass-border bg-white/5">
          <Icon className="h-5 w-5 text-accent" aria-hidden="true" />
        </span>
        <h3 className="text-sm font-semibold uppercase tracking-[0.15em] text-accent">
          {title}
        </h3>
        <div className="flex flex-col gap-3 text-base leading-relaxed text-muted-foreground">
          {children}
        </div>
      </GlassCard>
    </motion.div>
  );
}

/**
 * Editorial manifesto section, now framed as an asymmetric bento grid of
 * glass cards instead of a single centered text block — same essay copy,
 * split into three logical chunks so it reads as distinct ideas rather than
 * one dense wall of prose.
 */
export function ManifestoSection() {
  const shouldReduceMotion = useReducedMotion();
  const { t } = useLanguage();

  return (
    <section
      aria-labelledby="manifiesto-heading"
      className="relative mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-16 sm:px-6 sm:py-24"
    >
      <AmbientBlob className="-right-24 top-1/3 h-80 w-80" durationSeconds={28} />
      <h2
        id="manifiesto-heading"
        className="text-sm font-semibold uppercase tracking-[0.2em] text-accent"
      >
        {t.manifesto.heading} <span aria-hidden="true">✨</span>
      </h2>

      <motion.div
        initial={shouldReduceMotion ? false : "hidden"}
        whileInView="show"
        viewport={{ once: true, amount: 0.3 }}
        variants={{ hidden: {}, show: { transition: { staggerChildren: 0.12 } } }}
        className="grid grid-cols-1 gap-4 sm:grid-cols-2"
      >
        <motion.div
          variants={{ hidden: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0, transition: springTransition } }}
          className="sm:col-span-2"
        >
          <ManifestoCard icon={Compass} emoji="🧭" title={t.manifesto.card1.title}>
            <p>{t.manifesto.card1.body}</p>
          </ManifestoCard>
        </motion.div>

        <motion.div variants={{ hidden: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0, transition: springTransition } }}>
          <ManifestoCard icon={UserRound} emoji="🙋" title={t.manifesto.card2.title}>
            <p>{t.manifesto.card2.body}</p>
          </ManifestoCard>
        </motion.div>

        <motion.div variants={{ hidden: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0, transition: springTransition } }}>
          <ManifestoCard icon={Sprout} emoji="🌱" title={t.manifesto.card3.title}>
            <p>{t.manifesto.card3.body}</p>
          </ManifestoCard>
        </motion.div>
      </motion.div>
    </section>
  );
}
