"use client";

import { useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useLanguage } from "@/components/LanguageProvider";
import { ANSWER_FEEDBACK_MS, springTransition, tapScale } from "@/lib/motion";
import { now } from "@/lib/timing";
import { shuffle } from "@/lib/random";
import { cn } from "@/lib/utils";
import { contentTier } from "@/lib/scoring";

const MAX_LENGTH = 8;

function rand(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Classic IQ-test number sequence (2, 4, 6, 8, ?): a linear progression
 * (arithmetic, or geometric from tier 2 on). Length grows with tier but
 * caps at MAX_LENGTH - a row of numbers past that stops being readable at
 * a glance regardless of how high the level multiplier climbs.
 */
function generateSequence(level: number) {
  const tier = contentTier(level);
  const length = Math.min(MAX_LENGTH, 4 + Math.floor(tier / 2));
  const maxStep = 5 + tier * 2;
  const allowGeometric = tier >= 2;
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
  level,
  onAnswer,
}: {
  level: number;
  onAnswer: (isCorrect: boolean, responseTimeMs: number) => void;
}) {
  const { t } = useLanguage();
  const puzzle = useMemo(() => generateSequence(level), [level]);
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

      <div className="flex cursor-default flex-wrap items-center justify-center gap-2">
        {puzzle.shown.map((value, index) => (
          <div key={index} className="flex items-center gap-2">
            <span className="font-mono text-2xl font-semibold tabular-nums text-foreground">{value}</span>
            <span className="text-sm text-muted-foreground" aria-hidden="true">
              ·
            </span>
          </div>
        ))}
        <div
          className={cn(
            "flex h-14 min-w-14 items-center justify-center rounded-card border border-dashed px-3 font-mono text-2xl font-semibold tabular-nums",
            selected === null ? "border-glass-border/70 text-muted-foreground" : "border-success text-success"
          )}
        >
          {selected === null ? "?" : puzzle.answer}
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
