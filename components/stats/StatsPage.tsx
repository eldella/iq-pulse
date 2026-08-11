"use client";

import { MetricsPanel } from "@/components/stats/MetricsPanel";
import { LeaderboardTable } from "@/components/stats/LeaderboardTable";
import { PatronsWall } from "@/components/stats/PatronsWall";
import { ScrollReveal } from "@/components/ScrollReveal";
import { Emoji3D } from "@/components/Emoji3D";
import { useLanguage } from "@/components/LanguageProvider";

/**
 * Fully static/mock stats page — metrics panel, leaderboard, and patron
 * wall. No backend in this project, every dataset here is an illustrative
 * constant, clearly commented at its source.
 *
 * `<main>` itself carries no horizontal padding: `MetricsPanel` needs its
 * own full-bleed section background (edge-to-edge, no page gutters), so
 * every OTHER section manages its own `px-4 sm:px-6` internally instead of
 * inheriting it from this wrapper.
 */
export function StatsPage() {
  const { t } = useLanguage();

  return (
    <main className="flex flex-1 flex-col items-center gap-20 overflow-x-hidden py-16">
      <div className="relative flex flex-col items-center gap-3 px-4 text-center sm:px-6">
        <Emoji3D emoji="📊" size="lg" className="mb-1" />
        <h1 className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
          {t.stats.heading}
        </h1>
        <p className="max-w-2xl text-balance text-lg text-muted-foreground">
          {t.stats.subhead}
        </p>
      </div>

      <ScrollReveal className="w-full">
        <MetricsPanel />
      </ScrollReveal>

      <ScrollReveal className="flex w-full justify-center px-4 sm:px-6">
        <LeaderboardTable />
      </ScrollReveal>

      <ScrollReveal className="flex w-full justify-center px-4 sm:px-6">
        <PatronsWall />
      </ScrollReveal>

      <p className="px-4 text-center text-[11px] text-muted-foreground sm:px-6">
        {t.stats.footnote}
      </p>
    </main>
  );
}
