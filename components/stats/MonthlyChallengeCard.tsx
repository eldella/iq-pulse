"use client";

import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Check, Sparkles } from "lucide-react";
import { GlassCard } from "@/components/GlassCard";
import { useLanguage } from "@/components/LanguageProvider";
import { springTransition, tapScale } from "@/lib/motion";
import { generateMonthlyPuzzle, getMonthKey } from "@/lib/monthlyPuzzle";
import { markMonthlyChallengeSolved, useMonthlyChallengeSolved } from "@/lib/monthlyChallengeState";

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
 * "Reto del mes" - spot the odd hexagon in a grid seeded by the current
 * year-month (lib/monthlyPuzzle.ts), so it's identical for everyone this
 * month and rotates automatically next month. Rendered as SVG shapes on
 * purpose, not a written description: there's no text pattern to paste into
 * a text-only AI, solving it means actually looking at the grid.
 */
export function MonthlyChallengeCard() {
  const { t } = useLanguage();
  const shouldReduceMotion = useReducedMotion();
  const monthKey = getMonthKey();
  const puzzle = generateMonthlyPuzzle(monthKey);
  const c = t.stats.leaderboard.challenge;

  const solved = useMonthlyChallengeSolved(monthKey);
  const [wrongIndex, setWrongIndex] = useState<number | null>(null);

  function handleCellClick(index: number) {
    if (solved) return;
    if (index === puzzle.oddIndex) {
      markMonthlyChallengeSolved(monthKey);
      return;
    }
    setWrongIndex(index);
    window.setTimeout(() => setWrongIndex((current) => (current === index ? null : current)), 400);
  }

  return (
    <motion.div whileHover={{ y: -3 }} transition={springTransition} className="w-full max-w-2xl">
      <GlassCard variant="plain" className="flex flex-col items-center gap-4 p-8 text-center shadow-sm transition-shadow hover:shadow-md">
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-accent/10 text-accent">
          <Sparkles className="h-5 w-5" aria-hidden="true" />
        </span>
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-accent">{c.heading}</p>
        <h3 className="text-lg font-semibold text-foreground">{c.title}</h3>

        <AnimatePresence mode="wait">
          {solved ? (
            <motion.div
              key="solved"
              initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={springTransition}
              className="flex flex-col items-center gap-2 py-4"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-success/10 text-success">
                <Check className="h-5 w-5" aria-hidden="true" />
              </span>
              <p className="max-w-md text-sm font-medium text-pretty text-foreground">{c.solvedLabel}</p>
            </motion.div>
          ) : (
            <motion.div key="puzzle" className="flex flex-col items-center gap-4">
              <p className="max-w-md text-sm text-pretty leading-relaxed text-muted-foreground">{c.body}</p>
              <div
                role="group"
                aria-label={c.title}
                className="grid grid-cols-5 gap-1 sm:gap-1.5"
              >
                {puzzle.cells.map((cell, index) => (
                  <motion.button
                    key={index}
                    type="button"
                    onClick={() => handleCellClick(index)}
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
          )}
        </AnimatePresence>
      </GlassCard>
    </motion.div>
  );
}
