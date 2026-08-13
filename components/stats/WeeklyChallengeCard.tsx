"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Check, Sparkles, X } from "lucide-react";
import { GlassCard } from "@/components/GlassCard";
import { useLanguage } from "@/components/LanguageProvider";
import { springTransition, tapScale } from "@/lib/motion";
import { epochNow, now } from "@/lib/timing";
import {
  MAX_MISTAKES,
  ROUND_COUNT,
  ROUND_SECONDS,
  generateWeeklyPuzzle,
  getNextWeekStart,
  getWeekKey,
} from "@/lib/weeklyPuzzle";
import { markWeeklyChallengeResult, useWeeklyChallengeStatus } from "@/lib/weeklyChallengeState";

function formatCountdown(ms: number): string {
  const totalMinutes = Math.floor(ms / 60000);
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${Math.max(minutes, 1)}m`;
}

function hexagonPoints(size: number, rotationDeg: number): string {
  const rotationRad = (rotationDeg * Math.PI) / 180;
  const points: string[] = [];
  for (let i = 0; i < 6; i++) {
    const angle = rotationRad + (i * Math.PI) / 3;
    const x = 50 + size * Math.cos(angle);
    const y = 50 + size * Math.sin(angle);
    points.push(`${x.toFixed(2)},${y.toFixed(2)}`);
  }
  return points.join(" ");
}

/**
 * "Reto de la semana" - 3 rounds of spot-the-odd-hexagon, 10 seconds each,
 * seeded by the current ISO week (lib/weeklyPuzzle.ts) so it's identical for
 * everyone this week and rotates automatically next week. Rendered as SVG
 * shapes on purpose, not a written description: there's no text pattern to
 * paste into a text-only AI, solving it means actually looking at the grid.
 *
 * Local-only for now (no Supabase writes) - matches how the Daily Challenge
 * shipped in two stages: get the mechanic right first, wire it to a real
 * points/leaderboard pipeline in a later pass before this counts publicly.
 */
export function WeeklyChallengeCard() {
  const { t } = useLanguage();
  const shouldReduceMotion = useReducedMotion();
  const weekKey = getWeekKey();
  const c = t.stats.leaderboard.challenge;

  const storedStatus = useWeeklyChallengeStatus(weekKey);
  const [playing, setPlaying] = useState(false);
  const [round, setRound] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(ROUND_SECONDS);
  const [wrongIndex, setWrongIndex] = useState<number | null>(null);
  const [msUntilNext, setMsUntilNext] = useState(() => Math.max(0, getNextWeekStart().getTime() - epochNow()));
  const deadlineRef = useRef(0);

  useEffect(() => {
    if (storedStatus === "idle") return;
    const id = window.setInterval(() => {
      setMsUntilNext(Math.max(0, getNextWeekStart().getTime() - epochNow()));
    }, 30_000);
    return () => window.clearInterval(id);
  }, [storedStatus]);

  useEffect(() => {
    if (!playing) return;
    const id = window.setInterval(() => {
      const remainingMs = Math.max(0, deadlineRef.current - now());
      setSecondsLeft(remainingMs / 1000);
      if (remainingMs <= 0) {
        setPlaying(false);
        markWeeklyChallengeResult(weekKey, "failed");
      }
    }, 100);
    return () => window.clearInterval(id);
  }, [playing, weekKey]);

  function startChallenge() {
    setRound(0);
    setMistakes(0);
    deadlineRef.current = now() + ROUND_SECONDS * 1000;
    setSecondsLeft(ROUND_SECONDS);
    setPlaying(true);
  }

  function handleCellClick(index: number, oddIndex: number) {
    if (!playing) return;
    if (index !== oddIndex) {
      setWrongIndex(index);
      window.setTimeout(() => setWrongIndex((current) => (current === index ? null : current)), 300);
      const nextMistakes = mistakes + 1;
      setMistakes(nextMistakes);
      if (nextMistakes >= MAX_MISTAKES) {
        setPlaying(false);
        markWeeklyChallengeResult(weekKey, "failed");
      }
      return;
    }
    if (round + 1 >= ROUND_COUNT) {
      setPlaying(false);
      markWeeklyChallengeResult(weekKey, "success");
      return;
    }
    setRound((r) => r + 1);
    deadlineRef.current = now() + ROUND_SECONDS * 1000;
    setSecondsLeft(ROUND_SECONDS);
  }

  const puzzle = playing ? generateWeeklyPuzzle(weekKey, round) : null;
  const timerPct = Math.max(0, Math.min(100, (secondsLeft / ROUND_SECONDS) * 100));

  return (
    <motion.div whileHover={{ y: -3 }} transition={springTransition} className="w-full max-w-2xl">
      <GlassCard variant="plain" className="flex flex-col items-center gap-4 p-8 text-center shadow-sm transition-shadow hover:shadow-md">
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-accent/10 text-accent">
          <Sparkles className="h-5 w-5" aria-hidden="true" />
        </span>
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-accent">{c.heading}</p>
        <h3 className="text-lg font-semibold text-foreground">{c.title}</h3>

        <AnimatePresence mode="wait">
          {storedStatus === "success" ? (
            <motion.div
              key="success"
              initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={springTransition}
              className="flex flex-col items-center gap-2 py-4"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-success/10 text-success">
                <Check className="h-5 w-5" aria-hidden="true" />
              </span>
              <p className="max-w-md text-sm font-medium text-pretty text-foreground">{c.solvedLabel}</p>
              <p className="tabular-nums text-xs text-muted-foreground">
                {c.nextInLabel} {formatCountdown(msUntilNext)}
              </p>
            </motion.div>
          ) : storedStatus === "failed" ? (
            <motion.div
              key="failed"
              initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={springTransition}
              className="flex flex-col items-center gap-2 py-4"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-danger/10 text-danger">
                <X className="h-5 w-5" aria-hidden="true" />
              </span>
              <p className="max-w-md text-sm font-medium text-pretty text-foreground">{c.failedLabel}</p>
              <p className="tabular-nums text-xs text-muted-foreground">
                {c.nextInLabel} {formatCountdown(msUntilNext)}
              </p>
            </motion.div>
          ) : playing && puzzle ? (
            <motion.div key="playing" className="flex flex-col items-center gap-3">
              <div className="flex w-full max-w-xs items-center justify-between text-xs font-medium text-muted-foreground">
                <span>
                  {c.roundLabel} {round + 1}/{ROUND_COUNT}
                </span>
                <span className="tabular-nums text-danger">
                  {c.mistakesLabel} {mistakes}/{MAX_MISTAKES}
                </span>
                <span className="tabular-nums">{secondsLeft.toFixed(1)}s</span>
              </div>
              <div className="h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-surface-hover">
                <div
                  className={shouldReduceMotion ? "h-full bg-accent" : "h-full bg-accent transition-[width] duration-100 ease-linear"}
                  style={{ width: `${timerPct}%` }}
                />
              </div>
              <div role="group" aria-label={c.title} className="grid grid-cols-5 gap-1 sm:gap-1.5">
                {puzzle.cells.map((cell, index) => (
                  <motion.button
                    key={index}
                    type="button"
                    onClick={() => handleCellClick(index, puzzle.oddIndex)}
                    whileTap={tapScale}
                    animate={
                      shouldReduceMotion || wrongIndex !== index ? undefined : { x: [0, -4, 4, -4, 0] }
                    }
                    transition={{ duration: 0.3 }}
                    aria-label={`${c.cellLabel} ${Math.floor(index / puzzle.gridSize) + 1}-${(index % puzzle.gridSize) + 1}`}
                    className="flex h-11 w-11 items-center justify-center rounded-control text-accent transition-colors hover:bg-surface-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                  >
                    <svg viewBox="0 0 100 100" className="h-8 w-8" aria-hidden="true">
                      <polygon points={hexagonPoints(38, cell.rotationDeg)} fill="none" stroke="currentColor" strokeWidth="6" />
                    </svg>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.div key="idle" className="flex flex-col items-center gap-4">
              <p className="max-w-md text-sm text-pretty leading-relaxed text-muted-foreground">{c.body}</p>
              <motion.button
                type="button"
                onClick={startChallenge}
                whileHover={{ y: -1 }}
                whileTap={tapScale}
                transition={springTransition}
                className="shine-hover flex h-11 items-center rounded-full bg-accent px-6 text-sm font-semibold text-accent-foreground shadow-accent-sm focus-visible:outline-none"
              >
                {c.startCta}
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </GlassCard>
    </motion.div>
  );
}
