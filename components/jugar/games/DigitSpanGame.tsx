"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Delete } from "lucide-react";
import { useLanguage } from "@/components/LanguageProvider";
import { springTransition, tapScale } from "@/lib/motion";
import { now } from "@/lib/timing";
import type { Difficulty } from "@/lib/scoring";

const SEQUENCE_LENGTH: Record<Difficulty, number> = { easy: 4, medium: 5, hard: 6 };
const DIGIT_INTERVAL_MS = 700;

function generateSequence(length: number): number[] {
  return Array.from({ length }, () => Math.floor(Math.random() * 10));
}

export function DigitSpanGame({
  difficulty,
  onAnswer,
}: {
  difficulty: Difficulty;
  onAnswer: (isCorrect: boolean, responseTimeMs: number) => void;
}) {
  const { t } = useLanguage();
  const sequence = useMemo(() => generateSequence(SEQUENCE_LENGTH[difficulty]), [difficulty]);
  // Initial state, not a reset-on-change effect: this component remounts
  // fresh for every question (parent keys it by question index), so plain
  // useState defaults already cover "new sequence" - the effect below only
  // schedules the playback timers, it doesn't need to re-initialize state.
  const [phase, setPhase] = useState<"memorize" | "recall">("memorize");
  const [visibleIndex, setVisibleIndex] = useState(0);
  const [input, setInput] = useState<number[]>([]);
  const recallStartRef = useRef(0);

  useEffect(() => {
    const timers = sequence.map((_, index) =>
      setTimeout(() => setVisibleIndex(index + 1), (index + 1) * DIGIT_INTERVAL_MS)
    );
    const recallTimer = setTimeout(() => {
      setPhase("recall");
      recallStartRef.current = now();
    }, (sequence.length + 1) * DIGIT_INTERVAL_MS);

    return () => {
      timers.forEach(clearTimeout);
      clearTimeout(recallTimer);
    };
  }, [sequence]);

  function handleDigit(digit: number) {
    if (input.length >= sequence.length) return;
    setInput((prev) => [...prev, digit]);
  }

  function handleSubmit() {
    const isCorrect = input.length === sequence.length && input.every((d, i) => d === sequence[i]);
    onAnswer(isCorrect, Math.round(now() - recallStartRef.current));
  }

  return (
    <div className="flex flex-col items-center gap-6">
      {phase === "memorize" ? (
        <>
          <p className="text-sm text-muted-foreground">{t.quiz.digitSpanMemorize}</p>
          <div className="flex h-20 items-center gap-2">
            <AnimatePresence mode="wait">
              {visibleIndex > 0 && (
                <motion.span
                  key={visibleIndex}
                  initial={{ opacity: 0, scale: 0.7 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={springTransition}
                  className="text-5xl font-bold text-accent"
                >
                  {sequence[visibleIndex - 1]}
                </motion.span>
              )}
            </AnimatePresence>
          </div>
        </>
      ) : (
        <>
          <p className="text-sm text-muted-foreground">{t.quiz.digitSpanRecall}</p>
          <div className="flex h-12 min-w-[8rem] items-center justify-center gap-2 rounded-xl border border-glass-border bg-glass px-4 backdrop-blur-xl">
            {input.length === 0 ? (
              <span className="text-muted-foreground/50">—</span>
            ) : (
              input.map((digit, index) => (
                <span key={index} className="text-xl font-semibold text-foreground">
                  {digit}
                </span>
              ))
            )}
          </div>

          <div className="grid grid-cols-3 gap-2">
            {Array.from({ length: 9 }, (_, i) => i + 1).map((digit) => (
              <motion.button
                key={digit}
                type="button"
                onClick={() => handleDigit(digit)}
                whileHover={{ y: -1 }}
                whileTap={tapScale}
                transition={springTransition}
                className="flex h-12 w-12 items-center justify-center rounded-xl border border-glass-border bg-glass text-lg font-medium text-foreground backdrop-blur-xl focus-visible:outline-none"
              >
                {digit}
              </motion.button>
            ))}
            <motion.button
              type="button"
              onClick={() => setInput((prev) => prev.slice(0, -1))}
              whileHover={{ y: -1 }}
              whileTap={tapScale}
              transition={springTransition}
              aria-label={t.quiz.digitSpanClear}
              className="flex h-12 w-12 items-center justify-center rounded-xl border border-glass-border bg-glass text-muted-foreground backdrop-blur-xl focus-visible:outline-none"
            >
              <Delete className="h-4 w-4" aria-hidden="true" />
            </motion.button>
            <motion.button
              type="button"
              onClick={() => handleDigit(0)}
              whileHover={{ y: -1 }}
              whileTap={tapScale}
              transition={springTransition}
              className="flex h-12 w-12 items-center justify-center rounded-xl border border-glass-border bg-glass text-lg font-medium text-foreground backdrop-blur-xl focus-visible:outline-none"
            >
              0
            </motion.button>
            <motion.button
              type="button"
              onClick={handleSubmit}
              disabled={input.length !== sequence.length}
              whileHover={input.length === sequence.length ? { y: -1 } : undefined}
              whileTap={input.length === sequence.length ? tapScale : undefined}
              transition={springTransition}
              className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent text-sm font-semibold text-accent-foreground disabled:opacity-30 focus-visible:outline-none"
            >
              {t.quiz.digitSpanSubmit.slice(0, 2)}
            </motion.button>
          </div>
        </>
      )}
    </div>
  );
}
