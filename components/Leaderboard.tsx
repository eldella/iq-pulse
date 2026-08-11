"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import clsx from "clsx";
import { springTransition } from "@/lib/motion";
import { RankBadge } from "@/components/RankBadge";
import type { LeaderboardEntry, LeaderboardRange } from "@/lib/types";

const RANGE_OPTIONS: { value: LeaderboardRange; label: string }[] = [
  { value: "today", label: "Hoy" },
  { value: "week", label: "Esta Semana" },
  { value: "alltime", label: "Top Histórico" },
];

export function Leaderboard({ highlightId }: { highlightId?: string }) {
  const [range, setRange] = useState<LeaderboardRange>("alltime");
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  // Derived rather than a separate effect-set flag: loading is simply
  // "we haven't finished fetching the currently selected range yet".
  const [loadedRange, setLoadedRange] = useState<LeaderboardRange | null>(null);
  const isLoading = loadedRange !== range;
  const highlightRef = useRef<HTMLLIElement>(null);

  useEffect(() => {
    let cancelled = false;

    fetch(`/api/scores?range=${range}`)
      .then((res) => res.json())
      .then((data: { entries: LeaderboardEntry[] }) => {
        if (cancelled) return;
        setEntries(data.entries);
        setLoadedRange(range);
      })
      .catch(() => {
        if (!cancelled) setLoadedRange(range);
      });

    return () => {
      cancelled = true;
    };
  }, [range]);

  useEffect(() => {
    if (highlightId && highlightRef.current) {
      highlightRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [highlightId, entries]);

  return (
    <div className="w-full max-w-lg">
      <div
        role="tablist"
        aria-label="Filtrar tabla de posiciones"
        className="mb-4 flex gap-1 rounded-full border border-glass-border bg-glass p-1 backdrop-blur-xl"
      >
        {RANGE_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            role="tab"
            aria-selected={range === opt.value}
            onClick={() => setRange(opt.value)}
            className={clsx(
              "h-11 min-w-[44px] flex-1 rounded-full px-3 text-sm font-medium transition-colors focus-visible:outline-none",
              range === opt.value
                ? "bg-accent text-accent-foreground"
                : "text-foreground/60 hover:text-foreground"
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <p className="py-8 text-center text-sm text-foreground/60">Cargando...</p>
      ) : entries.length === 0 ? (
        <p className="py-8 text-center text-sm text-foreground/60">
          Todavía no hay puntajes en este período.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {entries.map((entry, index) => {
            const isHighlighted = entry.id === highlightId;

            return (
              <motion.li
                key={entry.id}
                ref={isHighlighted ? highlightRef : undefined}
                initial={{ opacity: 0, y: 12 }}
                animate={{
                  opacity: 1,
                  y: 0,
                  transition: { ...springTransition, delay: index * 0.04 },
                }}
                className={clsx(
                  "flex items-center gap-3 rounded-card border bg-glass px-4 py-3 backdrop-blur-xl",
                  isHighlighted
                    ? "border-accent ring-2 ring-accent/50"
                    : "border-glass-border"
                )}
              >
                <RankBadge rank={index + 1} />
                <span className="flex-1 truncate font-medium text-foreground">
                  {entry.alias}
                </span>
                {entry.iq !== undefined && (
                  <span className="text-xs text-foreground/50">IQ {entry.iq}</span>
                )}
                <span className="font-semibold text-accent">{entry.score}</span>
              </motion.li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

