"use client";

import { Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { GlassCard } from "@/components/GlassCard";
import { useLanguage } from "@/components/LanguageProvider";
import { springTransition, tapScale } from "@/lib/motion";

/**
 * "Reto del mes" placeholder - the puzzle itself doesn't exist yet (no quiz
 * engine), so this is intentionally presented as a coming-soon card rather
 * than a fake interactive challenge, same honesty convention as the Discord
 * "soon" badge in SocialLinks.
 */
export function MonthlyChallengeCard() {
  const { t } = useLanguage();

  return (
    <motion.div
      whileHover={{ y: -3 }}
      whileTap={tapScale}
      transition={springTransition}
      className="w-full max-w-2xl"
    >
      <GlassCard
        variant="plain"
        className="flex flex-col items-center gap-3 p-8 text-center shadow-sm transition-shadow hover:shadow-md"
      >
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-accent/10 text-accent">
          <Sparkles className="h-5 w-5" aria-hidden="true" />
        </span>
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-accent">
          {t.stats.leaderboard.challenge.heading}
        </p>
        <h3 className="text-lg font-semibold text-foreground">
          {t.stats.leaderboard.challenge.title}
        </h3>
        <p className="max-w-md text-sm text-pretty leading-relaxed text-muted-foreground">
          {t.stats.leaderboard.challenge.body}
        </p>
        <span className="mt-1 rounded-full bg-surface-hover px-3 py-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {t.stats.leaderboard.challenge.cta}
        </span>
      </GlassCard>
    </motion.div>
  );
}
