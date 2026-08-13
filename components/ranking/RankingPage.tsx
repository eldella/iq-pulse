"use client";

import { motion, useReducedMotion } from "framer-motion";
import { LeaderboardTable } from "@/components/stats/LeaderboardTable";
import { MonthlyChallengeCard } from "@/components/stats/MonthlyChallengeCard";
import { ScrollReveal } from "@/components/ScrollReveal";
import { PulseTrace } from "@/components/viz/PulseTrace";
import { useLanguage } from "@/components/LanguageProvider";
import { springTransition } from "@/lib/motion";

/**
 * Own nav destination for the leaderboard and monthly challenge, split out
 * of the (since-removed) stats page so they're reachable directly instead
 * of buried at the bottom of a long scroll.
 */
export function RankingPage() {
  const { t } = useLanguage();
  const shouldReduceMotion = useReducedMotion();

  return (
    <main className="flex flex-1 flex-col items-center gap-10 px-4 py-16 sm:px-6">
      <motion.div
        initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0, transition: springTransition }}
        className="flex flex-col items-center gap-3 text-center"
      >
        <PulseTrace size="lg" className="mb-1" />
        <h1 className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
          {t.ranking.heading}
        </h1>
        <p className="max-w-2xl text-balance text-lg text-muted-foreground">
          {t.ranking.subhead}
        </p>
      </motion.div>

      <ScrollReveal className="flex w-full justify-center">
        <LeaderboardTable />
      </ScrollReveal>

      <ScrollReveal className="flex w-full justify-center">
        <MonthlyChallengeCard />
      </ScrollReveal>
    </main>
  );
}
