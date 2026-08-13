"use client";

import { LeaderboardTable } from "@/components/stats/LeaderboardTable";
import { MonthlyChallengeCard } from "@/components/stats/MonthlyChallengeCard";
import { ScrollReveal } from "@/components/ScrollReveal";
import { PulseTrace } from "@/components/viz/PulseTrace";
import { useLanguage } from "@/components/LanguageProvider";

/**
 * Own nav destination for the leaderboard and monthly challenge, split out
 * of the (since-removed) stats page so they're reachable directly instead
 * of buried at the bottom of a long scroll.
 */
export function RankingPage() {
  const { t } = useLanguage();

  return (
    <main className="flex flex-1 flex-col items-center gap-10 px-4 py-16 sm:px-6">
      <div className="flex flex-col items-center gap-3 text-center">
        <PulseTrace size="lg" className="mb-1" />
        <h1 className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
          {t.ranking.heading}
        </h1>
        <p className="max-w-2xl text-balance text-lg text-muted-foreground">
          {t.ranking.subhead}
        </p>
      </div>

      <ScrollReveal className="flex w-full justify-center">
        <LeaderboardTable />
      </ScrollReveal>

      <ScrollReveal className="flex w-full justify-center">
        <MonthlyChallengeCard />
      </ScrollReveal>
    </main>
  );
}
