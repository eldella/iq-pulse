"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { RankBadge } from "@/components/RankBadge";
import { useLanguage } from "@/components/LanguageProvider";
import { springTransition, tapScale } from "@/lib/motion";
import { cn } from "@/lib/utils";

type LeaderboardTab = "general" | "times" | "percentiles";

/**
 * Illustrative mock leaderboard datasets — there is no backend/ranking API
 * in this build, this is fully static like the rest of this page. Aliases
 * only, never real names.
 */
const GENERAL_ENTRIES = [
  { alias: "neutrino_84", display: "987 pts" },
  { alias: "sofia.codes", display: "942 pts" },
  { alias: "quickdraw", display: "918 pts" },
  { alias: "mentat_ok", display: "875 pts" },
  { alias: "lu_reflex", display: "861 pts" },
] as const;

const TIME_ENTRIES = [
  { alias: "sparkfox", display: "182 ms" },
  { alias: "quickdraw", display: "196 ms" },
  { alias: "night_owl", display: "203 ms" },
  { alias: "neutrino_84", display: "211 ms" },
  { alias: "reflexo_9", display: "219 ms" },
] as const;

const PERCENTILE_ENTRIES = [
  { alias: "mentat_ok", display: "P99" },
  { alias: "sofia.codes", display: "P98" },
  { alias: "quiet.thinker", display: "P97" },
  { alias: "lu_reflex", display: "P96" },
  { alias: "neutrino_84", display: "P95" },
] as const;

const DATASETS: Record<LeaderboardTab, readonly { alias: string; display: string }[]> = {
  general: GENERAL_ENTRIES,
  times: TIME_ENTRIES,
  percentiles: PERCENTILE_ENTRIES,
};

export function LeaderboardTable() {
  const [tab, setTab] = useState<LeaderboardTab>("general");
  const { t } = useLanguage();
  const entries = DATASETS[tab];
  const tabs: { id: LeaderboardTab; label: string }[] = [
    { id: "general", label: t.stats.leaderboard.tabGeneral },
    { id: "times", label: t.stats.leaderboard.tabTimes },
    { id: "percentiles", label: t.stats.leaderboard.tabPercentiles },
  ];

  return (
    <div className="w-full max-w-3xl">
      <h2 className="mb-4 text-center text-2xl font-semibold text-foreground sm:text-3xl">
        {t.stats.leaderboard.heading}
      </h2>

      <div role="tablist" aria-label={t.stats.leaderboard.filterAriaLabel} className="mb-4 flex flex-wrap justify-center gap-2">
        {tabs.map(({ id, label }) => (
          <motion.button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
            whileHover={{ y: -1 }}
            whileTap={tapScale}
            transition={springTransition}
            className={cn(
              "flex h-11 items-center rounded-full px-4 text-sm font-medium transition-all duration-300 focus-visible:outline-none",
              tab === id
                ? "shine-hover bg-accent text-accent-foreground shadow-md shadow-accent/40"
                : "border border-glass-border bg-glass text-muted-foreground backdrop-blur-xl hover:border-accent/30 hover:text-foreground"
            )}
          >
            {label}
          </motion.button>
        ))}
      </div>

      <ul className="flex flex-col gap-3">
        {entries.map((entry, index) => (
          <li
            key={entry.alias}
            className="flex items-center gap-4 rounded-2xl border border-glass-border bg-glass px-6 py-5 backdrop-blur-xl"
          >
            <RankBadge rank={index + 1} />
            <span className="flex-1 truncate text-lg font-medium text-foreground">{entry.alias}</span>
            <span className="text-xl font-semibold text-accent">{entry.display}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
