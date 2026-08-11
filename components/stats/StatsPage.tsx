"use client";

import { MetricsPanel } from "@/components/stats/MetricsPanel";
import { LeaderboardTable } from "@/components/stats/LeaderboardTable";
import { PatronsWall } from "@/components/stats/PatronsWall";
import { ScrollReveal } from "@/components/ScrollReveal";

/**
 * Fully static/mock stats page — metrics panel, leaderboard, and patron
 * wall. No backend in this project, every dataset here is an illustrative
 * constant, clearly commented at its source.
 */
export function StatsPage() {
  return (
    <main className="flex flex-1 flex-col items-center gap-16 px-4 py-16 sm:px-6">
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          Estadísticas
        </h1>
        <p className="max-w-xl text-balance text-foreground/70">
          Un vistazo a los números detrás de IQ.Pulse — todos ilustrativos
          mientras no exista un backend real.
        </p>
      </div>

      <ScrollReveal className="w-full max-w-4xl">
        <MetricsPanel />
      </ScrollReveal>

      <ScrollReveal className="flex w-full justify-center">
        <LeaderboardTable />
      </ScrollReveal>

      <ScrollReveal className="flex w-full justify-center">
        <PatronsWall />
      </ScrollReveal>
    </main>
  );
}
