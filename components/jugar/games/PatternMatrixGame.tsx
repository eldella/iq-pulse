"use client";

import { useMemo, useRef } from "react";
import { motion } from "framer-motion";
import { useLanguage } from "@/components/LanguageProvider";
import { springTransition, tapScale } from "@/lib/motion";
import { now } from "@/lib/timing";
import type { Difficulty } from "@/lib/scoring";

/**
 * Procedurally generated 2x2 additive grid: each cell = base + col*colDelta
 * + row*rowDelta. The bottom-right cell is always the one missing, with 3
 * plausible distractor options alongside the real answer. Difficulty widens
 * the delta ranges (and allows negative deltas at "hard") instead of using
 * a curated question bank - no design tool needed to add more of these.
 */
function generateMatrix(difficulty: Difficulty) {
  const ranges: Record<Difficulty, { base: [number, number]; delta: [number, number] }> = {
    easy: { base: [1, 9], delta: [1, 3] },
    medium: { base: [2, 15], delta: [2, 6] },
    hard: { base: [3, 20], delta: [3, 9] },
  };
  const { base, delta } = ranges[difficulty];
  const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
  const sign = () => (difficulty === "hard" && Math.random() < 0.4 ? -1 : 1);

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

  const options = [answer, ...distractors].sort(() => Math.random() - 0.5);
  return { grid, answer, options };
}

export function PatternMatrixGame({
  difficulty,
  onAnswer,
}: {
  difficulty: Difficulty;
  onAnswer: (isCorrect: boolean, responseTimeMs: number) => void;
}) {
  const { t } = useLanguage();
  const puzzle = useMemo(() => generateMatrix(difficulty), [difficulty]);
  // This component remounts fresh for every question (parent keys it by
  // question index), so a ref seeded once at mount is the start time -
  // no effect needed to "reset" it.
  const startTimeRef = useRef(now());

  function handleChoice(value: number) {
    onAnswer(value === puzzle.answer, Math.round(now() - startTimeRef.current));
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
              className="flex h-20 w-20 items-center justify-center rounded-2xl border border-glass-border bg-glass text-2xl font-semibold text-foreground backdrop-blur-xl sm:h-24 sm:w-24"
            >
              {isMissing ? <span className="text-accent">?</span> : value}
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-4 gap-2">
        {puzzle.options.map((option) => (
          <motion.button
            key={option}
            type="button"
            onClick={() => handleChoice(option)}
            whileHover={{ y: -2 }}
            whileTap={tapScale}
            transition={springTransition}
            className="shine-hover flex h-14 w-16 items-center justify-center rounded-xl border border-glass-border bg-glass text-lg font-semibold text-foreground backdrop-blur-xl hover:border-accent/40 focus-visible:outline-none"
          >
            {option}
          </motion.button>
        ))}
      </div>
    </div>
  );
}
