"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useLanguage } from "@/components/LanguageProvider";
import { ANSWER_FEEDBACK_MS, PER_QUESTION_TIMEOUT_MS, springTransition, tapScale } from "@/lib/motion";
import { now } from "@/lib/timing";
import { shuffle } from "@/lib/random";
import { cn } from "@/lib/utils";
import { contentTier } from "@/lib/scoring";

// Slots stay inset from the viewBox edge by well more than
// radius+jitter (the bare minimum to avoid clipping) so a dot never even
// visually touches the card's border - a dot sitting flush against the edge
// still read as "spilling out" even though nothing was actually clipped.
export const DOT_RADIUS = 3.4;
export const JITTER = 1.5;
export const PADDING = 12;

// Slot grid is sized to the actual count needed (with 40% headroom) instead
// of a fixed pool, so it scales with however high the base range grows and
// two counts never collide into the same rendered dot layout.
export function dotPositions(count: number): { x: number; y: number }[] {
  const gridDim = Math.max(5, Math.ceil(Math.sqrt(count * 1.4)));
  const span = 100 - PADDING * 2;
  const step = span / (gridDim - 1);
  const slots: { x: number; y: number }[] = [];
  for (let row = 0; row < gridDim; row++) {
    for (let col = 0; col < gridDim; col++) {
      slots.push({ x: PADDING + col * step, y: PADDING + row * step });
    }
  }
  return shuffle(slots)
    .slice(0, count)
    .map((s) => ({
      x: s.x + (Math.random() * JITTER * 2 - JITTER),
      y: s.y + (Math.random() * JITTER * 2 - JITTER),
    }));
}

// Per-tier {base count range, winner ratio over the others}. Fixed values
// instead of a formula that shrinks the ratio indefinitely - contentTier is
// capped at 3 ("extreme") now, so hand-tuning 4 steps keeps the winner
// always plainly distinguishable even at max difficulty (confirmed with the
// user: a shrinking-to-1.08 ratio made "extreme" trials look like a coin
// flip, not a harder read).
export const TIERS: { baseRange: [number, number]; ratio: number }[] = [
  { baseRange: [4, 7], ratio: 1.5 },
  { baseRange: [6, 10], ratio: 1.35 },
  { baseRange: [8, 13], ratio: 1.22 },
  { baseRange: [10, 16], ratio: 1.15 },
];

export const BOX_COUNT = 4;

/**
 * Quick approximate-number comparison: 4 dot clusters, click the one with
 * more - a fast subitizing/estimation task (processing speed) rather than
 * Stroop's color/word interference, so it exercises the "speed" domain
 * differently instead of duplicating it. One cluster (randomly placed) is
 * the winner at `base * ratio`; the other 3 sit at `base` with a small
 * jitter so they don't all render as identical patterns, but always stay
 * below the winner.
 */
export function generateTrial(level: number) {
  const tier = Math.min(TIERS.length - 1, contentTier(level));
  const { baseRange, ratio } = TIERS[tier];
  const base = Math.floor(Math.random() * (baseRange[1] - baseRange[0] + 1)) + baseRange[0];
  const winnerCount = Math.max(base + 1, Math.round(base * ratio));

  const winnerIndex = Math.floor(Math.random() * BOX_COUNT);
  const counts = Array.from({ length: BOX_COUNT }, (_, i) =>
    i === winnerIndex ? winnerCount : Math.max(1, base - Math.floor(Math.random() * 2))
  );

  return {
    boxes: counts.map((count) => dotPositions(count)),
    correctIndex: winnerIndex,
  };
}

export function QuickCompareGame({
  level,
  onAnswer,
}: {
  level: number;
  onAnswer: (isCorrect: boolean, responseTimeMs: number) => void;
}) {
  const { t } = useLanguage();
  const trial = useMemo(() => generateTrial(level), [level]);
  const startTimeRef = useRef(now());
  const answeredRef = useRef(false);
  const [selected, setSelected] = useState<number | null>(null);
  const shouldReduceMotion = useReducedMotion();

  function handleChoice(index: number) {
    if (selected !== null || answeredRef.current) return;
    answeredRef.current = true;
    const responseTimeMs = Math.round(now() - startTimeRef.current);
    setSelected(index);
    window.setTimeout(() => onAnswer(index === trial.correctIndex, responseTimeMs), ANSWER_FEEDBACK_MS);
  }

  // 5s to answer from mount (this game has no fixation delay, unlike
  // Stroop - the trial is visible immediately) - running out counts as a
  // miss and auto-advances, same as an explicit wrong tap (decided per
  // game, see PER_QUESTION_TIMEOUT_MS).
  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      if (answeredRef.current) return;
      answeredRef.current = true;
      setSelected(-1);
      window.setTimeout(() => onAnswer(false, PER_QUESTION_TIMEOUT_MS), ANSWER_FEEDBACK_MS);
    }, PER_QUESTION_TIMEOUT_MS);
    return () => window.clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex flex-col items-center gap-6">
      <p className="text-sm text-muted-foreground">{t.quiz.quickCompareInstructions}</p>

      {selected === null && !shouldReduceMotion && (
        <div className="h-1 w-40 overflow-hidden rounded-full bg-surface-hover">
          <motion.div
            className="h-full bg-accent"
            initial={{ width: "100%" }}
            animate={{ width: "0%" }}
            transition={{ duration: PER_QUESTION_TIMEOUT_MS / 1000, ease: "linear" }}
          />
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        {trial.boxes.map((dots, index) => {
          const isCorrectBox = index === trial.correctIndex;
          const isSelectedBox = index === selected;
          return (
            <motion.button
              key={index}
              type="button"
              onClick={() => handleChoice(index)}
              disabled={selected !== null}
              whileHover={selected === null ? { y: -2 } : undefined}
              whileTap={selected === null ? tapScale : undefined}
              animate={selected !== null && isCorrectBox && !shouldReduceMotion ? { scale: [1, 1.08, 1] } : { scale: 1 }}
              transition={springTransition}
              className={cn(
                "flex h-28 w-28 items-center justify-center rounded-card border backdrop-blur-xl focus-visible:outline-none sm:h-32 sm:w-32",
                selected === null
                  ? "border-glass-border bg-glass hover:border-accent/40"
                  : isCorrectBox
                    ? "border-success bg-success/10"
                    : isSelectedBox
                      ? "border-danger bg-danger/10"
                      : "border-glass-border bg-glass opacity-50"
              )}
            >
              <svg viewBox="0 0 100 100" className="h-full w-full text-accent">
                {dots.map((dot, dotIndex) => (
                  <circle key={dotIndex} cx={dot.x} cy={dot.y} r={DOT_RADIUS} fill="currentColor" />
                ))}
              </svg>
            </motion.button>
          );
        })}
      </div>

      {selected === -1 && <p className="text-xs text-danger">{t.quiz.perQuestionTimeoutCaption}</p>}
    </div>
  );
}
