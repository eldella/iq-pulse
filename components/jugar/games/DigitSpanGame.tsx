"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Check, Delete } from "lucide-react";
import { useLanguage } from "@/components/LanguageProvider";
import { ANSWER_FEEDBACK_MS, springTransition, tapScale } from "@/lib/motion";
import { now } from "@/lib/timing";
import { cn } from "@/lib/utils";
import { contentTier } from "@/lib/scoring";

const MAX_SEQUENCE_LENGTH = 12;
const DIGIT_INTERVAL_MS = 700;

function generateSequence(length: number): number[] {
  return Array.from({ length }, () => Math.floor(Math.random() * 10));
}

export function DigitSpanGame({
  level,
  onAnswer,
}: {
  level: number;
  onAnswer: (isCorrect: boolean, responseTimeMs: number) => void;
}) {
  const { t } = useLanguage();
  const sequenceLength = Math.min(MAX_SEQUENCE_LENGTH, 4 + contentTier(level));
  const sequence = useMemo(() => generateSequence(sequenceLength), [sequenceLength]);
  // Initial state, not a reset-on-change effect: this component remounts
  // fresh for every question (parent keys it by question index), so plain
  // useState defaults already cover "new sequence" - the effect below only
  // schedules the playback timers, it doesn't need to re-initialize state.
  const [phase, setPhase] = useState<"memorize" | "recall">("memorize");
  const [visibleIndex, setVisibleIndex] = useState(0);
  const [input, setInput] = useState<number[]>([]);
  const [submitted, setSubmitted] = useState<{ isCorrect: boolean } | null>(null);
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
    if (submitted || input.length >= sequence.length) return;
    setInput((prev) => [...prev, digit]);
  }

  function handleSubmit() {
    if (submitted) return;
    const isCorrect = input.length === sequence.length && input.every((d, i) => d === sequence[i]);
    const responseTimeMs = Math.round(now() - recallStartRef.current);
    setSubmitted({ isCorrect });
    window.setTimeout(() => onAnswer(isCorrect, responseTimeMs), ANSWER_FEEDBACK_MS);
  }

  return (
    <div className="flex flex-col items-center gap-6">
      {phase === "memorize" ? (
        <>
          <p className="text-sm text-muted-foreground">{t.quiz.digitSpanMemorize}</p>
          <div className="flex h-20 items-center gap-2">
            {visibleIndex > 0 && (
              <span className="text-5xl font-bold text-accent">{sequence[visibleIndex - 1]}</span>
            )}
          </div>
        </>
      ) : (
        <>
          <p className="text-sm text-muted-foreground">{t.quiz.digitSpanRecall}</p>
          <div
            className={cn(
              "flex h-12 min-w-[8rem] items-center justify-center gap-2 rounded-control border px-4 backdrop-blur-xl",
              submitted === null
                ? "border-glass-border bg-glass"
                : submitted.isCorrect
                  ? "border-success bg-success/15"
                  : "border-danger bg-danger/15"
            )}
          >
            {input.length === 0 ? (
              <span className="text-muted-foreground/50">—</span>
            ) : (
              input.map((digit, index) => (
                <span
                  key={index}
                  className={cn(
                    "text-xl font-semibold",
                    submitted === null ? "text-foreground" : submitted.isCorrect ? "text-success" : "text-danger"
                  )}
                >
                  {digit}
                </span>
              ))
            )}
          </div>
          {submitted && !submitted.isCorrect && (
            <p className="text-xs text-success">
              {t.quiz.digitSpanCorrectSequence} {sequence.join(" ")}
            </p>
          )}

          <div className="grid grid-cols-3 gap-2">
            {Array.from({ length: 9 }, (_, i) => i + 1).map((digit) => (
              <motion.button
                key={digit}
                type="button"
                onClick={() => handleDigit(digit)}
                disabled={submitted !== null}
                whileHover={submitted === null ? { y: -1 } : undefined}
                whileTap={submitted === null ? tapScale : undefined}
                transition={springTransition}
                className="flex h-12 w-12 items-center justify-center rounded-control border border-glass-border bg-glass text-lg font-medium text-foreground backdrop-blur-xl focus-visible:outline-none disabled:opacity-50"
              >
                {digit}
              </motion.button>
            ))}
            <motion.button
              type="button"
              onClick={() => setInput((prev) => prev.slice(0, -1))}
              disabled={submitted !== null}
              whileHover={submitted === null ? { y: -1 } : undefined}
              whileTap={submitted === null ? tapScale : undefined}
              transition={springTransition}
              aria-label={t.quiz.digitSpanClear}
              className="flex h-12 w-12 items-center justify-center rounded-control border border-glass-border bg-glass text-muted-foreground backdrop-blur-xl focus-visible:outline-none disabled:opacity-50"
            >
              <Delete className="h-4 w-4" aria-hidden="true" />
            </motion.button>
            <motion.button
              type="button"
              onClick={() => handleDigit(0)}
              disabled={submitted !== null}
              whileHover={submitted === null ? { y: -1 } : undefined}
              whileTap={submitted === null ? tapScale : undefined}
              transition={springTransition}
              className="flex h-12 w-12 items-center justify-center rounded-control border border-glass-border bg-glass text-lg font-medium text-foreground backdrop-blur-xl focus-visible:outline-none disabled:opacity-50"
            >
              0
            </motion.button>
            <motion.button
              type="button"
              onClick={handleSubmit}
              disabled={submitted !== null || input.length !== sequence.length}
              whileHover={submitted === null && input.length === sequence.length ? { y: -1 } : undefined}
              whileTap={submitted === null && input.length === sequence.length ? tapScale : undefined}
              transition={springTransition}
              aria-label={t.quiz.digitSpanSubmit}
              className="flex h-12 w-12 items-center justify-center rounded-control bg-accent text-accent-foreground disabled:opacity-30 focus-visible:outline-none"
            >
              <Check className="h-5 w-5" aria-hidden="true" />
            </motion.button>
          </div>
        </>
      )}
    </div>
  );
}
