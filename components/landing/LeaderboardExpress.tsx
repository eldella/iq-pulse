"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { springTransition } from "@/lib/motion";
import { RankBadge } from "@/components/RankBadge";
import type { LeaderboardEntry } from "@/lib/types";

const EXPRESS_LIMIT = 5;

/**
 * Reduced Top-5-today leaderboard for the landing page. Fetches the same
 * /api/scores?range=today endpoint the full Leaderboard uses and trims to
 * the top 5 client-side, so the API route's default behavior for existing
 * callers stays unchanged.
 */
export function LeaderboardExpress() {
  const [entries, setEntries] = useState<LeaderboardEntry[] | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetch("/api/scores?range=today")
      .then((res) => res.json())
      .then((data: { entries: LeaderboardEntry[] }) => {
        if (!cancelled) setEntries(data.entries.slice(0, EXPRESS_LIMIT));
      })
      .catch(() => {
        if (!cancelled) setEntries([]);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="w-full max-w-lg">
      <h2 className="mb-4 text-center text-lg font-semibold text-foreground">
        Top 5 de hoy
      </h2>

      {entries === null ? (
        <p className="py-6 text-center text-sm text-foreground/60">Cargando...</p>
      ) : entries.length === 0 ? (
        <p className="py-6 text-center text-sm text-foreground/60">
          Todavía no hay puntajes hoy. ¡Sé el primero!
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {entries.map((entry, index) => (
            <motion.li
              key={entry.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{
                opacity: 1,
                y: 0,
                transition: { ...springTransition, delay: index * 0.04 },
              }}
              className="flex items-center gap-3 rounded-card border border-glass-border bg-glass px-4 py-3 backdrop-blur-xl"
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
          ))}
        </ul>
      )}
    </div>
  );
}
