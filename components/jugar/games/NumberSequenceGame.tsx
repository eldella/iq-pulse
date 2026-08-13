"use client";

import { useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useLanguage } from "@/components/LanguageProvider";
import { ANSWER_FEEDBACK_MS, springTransition, tapScale } from "@/lib/motion";
import { now } from "@/lib/timing";
import { shuffle } from "@/lib/random";
import { cn } from "@/lib/utils";
import type { Difficulty } from "@/lib/scoring";

const CONFIG: Record<Difficulty, { length: number; maxStep: number; allowGeometric: boolean }> = {
  easy: { length: 4, maxStep: 5, allowGeometric: false },
  medium: { length: 5, maxStep: 9, allowGeometric: false },
  hard: { length: 5, maxStep: 12, allowGeometric: true },
};

function rand(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Classic IQ-test number sequence (2, 4, 6, 8, ?) rather than the 2x2
 * additive grid PatternMatrixGame already covers - a linear progression
 * (arithmetic, or geometric at "hard") instead of a spatial layout.
 */
function generateSequence(difficulty: Difficulty) {
  const { length, maxStep, allowGeometric } = CONFIG[difficulty];
  const isGeometric = allowGeometric && Math.random() < 0.4;

  let sequence: number[];
  if (isGeometric) {
    const ratio = rand(2, 3);
    const start = rand(1, 5);
    sequence = Array.from({ length }, (_, i) => start * ratio ** i);
  } else {
    const step = rand(1, maxStep) * (Math.random() < 0.5 ? -1 : 1);
    const start = rand(1, 20);
    sequence = Array.from({ length }, (_, i) => start + step * i);
  }

  const answer = sequence[length - 1];
  const shown = sequence.slice(0, length - 1);

  const distractors = new Set<number>();
  const offsetRange = isGeometric ? Math.max(2, Math.round(answer * 0.15)) : Math.max(2, maxStep);
  while (distractors.size < 3) {
    const candidate = answer + rand(1, offsetRange) * (Math.random() < 0.5 ? -1 : 1);
    if (candidate !== answer) distractors.add(candidate);
  }

  const options = shuffle([answer, ...distractors]);
  return { shown, answer, options };
}

export function NumberSequenceGame({
  difficulty,
  onAnswer,
}: {
  difficulty: Difficulty;
  onAnswer: (isCorrect: boolean, responseTimeMs: number) => void;
}) {
  const { t } = useLanguage();
  const puzzle = useMemo(() => generateSequence(difficulty), [difficulty]);
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
      <p className="text-sm text-muted-foreground">{t.quiz.numberSequenceInstructions}</p>

      <div className="flex flex-wrap items-center justify-center gap-2">
        {puzzle.shown.map((value, index) => (
          <div
            key={index}
            className="flex h-14 min-w-14 items-center justify-center rounded-card border border-glass-border bg-glass px-3 text-xl font-semibold tabular-nums text-foreground backdrop-blur-xl"
          >
            {value}
          </div>
        ))}
        <div className="flex h-14 min-w-14 items-center justify-center rounded-card border border-glass-border bg-glass px-3 text-xl font-semibold text-accent backdrop-blur-xl">
          {selected === null ? "?" : <span className="text-success">{puzzle.answer}</span>}
        </div>
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
                "shine-hover flex h-14 w-16 items-center justify-center rounded-control border text-lg font-semibold tabular-nums backdrop-blur-xl focus-visible:outline-none",
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
