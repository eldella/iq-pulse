"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Flame, Loader2 } from "lucide-react";
import { RankBadge } from "@/components/RankBadge";
import { fadeSlideUp, staggerContainer } from "@/components/landing/motionVariants";
import { useLanguage } from "@/components/LanguageProvider";
import { springTransition, tapScale } from "@/lib/motion";
import { cn } from "@/lib/utils";
import {
  getGeneralLeaderboard,
  getPercentilesLeaderboard,
  getStreaksLeaderboard,
  getTimesLeaderboard,
} from "@/lib/supabase/leaderboard";

type LeaderboardTab = "general" | "times" | "percentiles" | "streaks";
type Entry = { deviceId: string; alias: string; display: string };

export function LeaderboardTable() {
  const [tab, setTab] = useState<LeaderboardTab>("general");
  const [cache, setCache] = useState<Partial<Record<LeaderboardTab, Entry[]>>>({});
  const { t } = useLanguage();
  const shouldReduceMotion = useReducedMotion();
  const lb = t.stats.leaderboard;

  useEffect(() => {
    if (cache[tab]) return;
    let cancelled = false;

    const load = async (): Promise<Entry[]> => {
      if (tab === "general") {
        const rows = await getGeneralLeaderboard();
        return rows.map((r) => ({ deviceId: r.deviceId, alias: r.alias, display: `${r.points} ${lb.pointsUnit}` }));
      }
      if (tab === "times") {
        const rows = await getTimesLeaderboard();
        return rows.map((r) => ({ deviceId: r.deviceId, alias: r.alias, display: `${r.seconds.toFixed(1)} ${lb.timeUnit}` }));
      }
      if (tab === "percentiles") {
        const rows = await getPercentilesLeaderboard();
        return rows.map((r) => ({ deviceId: r.deviceId, alias: r.alias, display: `P${Math.round(r.percentile)}` }));
      }
      const rows = await getStreaksLeaderboard();
      return rows.map((r) => ({ deviceId: r.deviceId, alias: r.alias, display: `${r.streak} ${lb.streakUnit}` }));
    };

    load()
      .then((entries) => {
        if (!cancelled) setCache((prev) => ({ ...prev, [tab]: entries }));
      })
      .catch(() => {
        if (!cancelled) setCache((prev) => ({ ...prev, [tab]: [] }));
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  const entries = cache[tab] ?? [];
  const loading = cache[tab] === undefined;
  const tabs: { id: LeaderboardTab; label: string }[] = [
    { id: "general", label: lb.tabGeneral },
    { id: "times", label: lb.tabTimes },
    { id: "percentiles", label: lb.tabPercentiles },
    { id: "streaks", label: lb.tabStreaks },
  ];

  return (
    <div className="w-full max-w-3xl">
      <h2 className="mb-4 text-center text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
        {lb.heading}
      </h2>

      <div role="tablist" aria-label={lb.filterAriaLabel} className="mb-4 flex flex-wrap justify-center gap-2">
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
                ? "shine-hover bg-accent text-accent-foreground shadow-accent-sm"
                : "border border-glass-border bg-glass text-muted-foreground backdrop-blur-xl hover:border-accent/30 hover:text-foreground"
            )}
          >
            {label}
          </motion.button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-10 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          <span>{lb.loading}</span>
        </div>
      ) : entries.length === 0 ? (
        <p className="py-10 text-center text-muted-foreground">{lb.empty}</p>
      ) : (
        <motion.ul
          key={tab}
          variants={staggerContainer}
          initial={shouldReduceMotion ? false : "hidden"}
          animate="show"
          className="flex flex-col gap-3"
        >
          {entries.map((entry, index) => (
            <motion.li
              key={entry.deviceId}
              variants={fadeSlideUp}
              className="theme-transition flex items-center gap-4 rounded-card border border-glass-border bg-glass px-6 py-5 backdrop-blur-xl"
            >
              <RankBadge rank={index + 1} />
              <span className="min-w-0 flex-1 truncate text-lg font-medium text-foreground">{entry.alias}</span>
              <span className="flex items-center gap-1.5 text-xl font-semibold text-accent">
                {tab === "streaks" && <Flame className="h-4 w-4" aria-hidden="true" />}
                <span className="tabular-nums">{entry.display}</span>
              </span>
            </motion.li>
          ))}
        </motion.ul>
      )}
    </div>
  );
}
