"use client";

import { useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useLanguage } from "@/components/LanguageProvider";
import { ANSWER_FEEDBACK_MS, springTransition, tapScale } from "@/lib/motion";
import { now } from "@/lib/timing";
import { shuffle } from "@/lib/random";
import { cn } from "@/lib/utils";
import { contentTier } from "@/lib/scoring";

/**
 * Procedurally generated 2x2 additive grid: each cell = base + col*colDelta
 * + row*rowDelta. The bottom-right cell is always the one missing, with 3
 * plausible distractor options alongside the real answer. The grid itself
 * stays 2x2 (that's the puzzle's shape), but the number ranges widen with
 * level's contentTier - negative deltas only start appearing from tier 4
 * on, instead of a fixed "hard" check.
 */
function generateMatrix(level: number) {
  const tier = contentTier(level);
  const base: [number, number] = [1 + tier, 9 + tier * 4];
  const delta: [number, number] = [1 + tier, 3 + tier * 2];
  const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
  const sign = () => (tier >= 4 && Math.random() < 0.4 ? -1 : 1);

  const a = rand(base[0], base[1]);
  const colDelta = rand(delta[0], delta[1]) * sign();
  const rowDelta = rand(delta[0], delta[1]) * sign();

  const grid = [
    [a, a + colDelta],
    [a + rowDelta, a + colDelta + rowDelta],
  ];
  const answer = grid[1][1];

  const distractors = new Set<number>();
  while (distractors.size < 3) {
    const offset = rand(1, Math.max(2, delta[1])) * (Math.random() < 0.5 ? -1 : 1);
    const candidate = answer + offset;
    if (candidate !== answer) distractors.add(candidate);
  }

  const options = shuffle([answer, ...distractors]);
  return { grid, answer, options };
}

export function PatternMatrixGame({
  level,
  onAnswer,
}: {
  level: number;
  onAnswer: (isCorrect: boolean, responseTimeMs: number) => void;
}) {
  const { t } = useLanguage();
  const puzzle = useMemo(() => generateMatrix(level), [level]);
  // This component remounts fresh for every question (parent keys it by
  // question index), so a ref seeded once at mount is the start time -
  // no effect needed to "reset" it.
  const startTimeRef = useRef(now());
  const [selected, setSelected] = useState<number | null>(null);

  function handleChoice(value: number) {
    if (selected !== null) return;
    const responseTimeMs = Math.round(now() - startTimeRef.current);
    setSelected(value);
    window.setTimeout(() => onAnswer(value === puzzle.answer, responseTimeMs), ANSWER_FEEDBACK_MS);
  }

  return (
    <div className="flex flex-col items-center gap-6">
      <p className="text-sm text-muted-foreground">{t.quiz.matrixInstructions}</p>

      <div className="grid grid-cols-2 gap-3">
        {puzzle.grid.flat().map((value, index) => {
          const isMissing = index === 3;
          return (
            <div
              key={index}
              className="flex h-20 w-20 items-center justify-center rounded-card border border-glass-border bg-glass text-2xl font-semibold text-foreground backdrop-blur-xl sm:h-24 sm:w-24"
            >
              {isMissing ? (
                <span className={selected === null ? "text-accent" : "text-success"}>
                  {selected === null ? "?" : puzzle.answer}
                </span>
              ) : (
                value
              )}
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-4 gap-2">
        {puzzle.options.map((option) => {
          const isCorrectOption = option === puzzle.answer;
          const isSelectedOption = option === selected;
          return (
            <motion.button
              key={option}
              type="button"
              onClick={() => handleChoice(option)}
              disabled={selected !== null}
              whileHover={selected === null ? { y: -2 } : undefined}
              whileTap={selected === null ? tapScale : undefined}
              transition={springTransition}
              className={cn(
                "shine-hover flex h-14 w-16 items-center justify-center rounded-control border text-lg font-semibold backdrop-blur-xl focus-visible:outline-none",
                selected === null
                  ? "border-glass-border bg-glass text-foreground hover:border-accent/40"
                  : isCorrectOption
                    ? "border-success bg-success/15 text-success"
                    : isSelectedOption
                      ? "border-danger bg-danger/15 text-danger"
                      : "border-glass-border bg-glass text-foreground opacity-50"
              )}
            >
              {option}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
