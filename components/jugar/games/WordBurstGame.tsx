"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useLanguage } from "@/components/LanguageProvider";
import { ANSWER_FEEDBACK_MS, springTransition, tapScale } from "@/lib/motion";
import { now } from "@/lib/timing";
import { shuffle } from "@/lib/random";
import { cn } from "@/lib/utils";
import { WORD_BANK } from "@/lib/wordBank";
import { contentTier } from "@/lib/scoring";

const WORD_INTERVAL_MS = 900;
const MAX_SHOWN = 8;

/** Both counts grow with tier; optionCount caps at WORD_BANK.length - can't offer more options than words that exist. */
function generateRound(level: number, lang: "es" | "en") {
  const tier = contentTier(level);
  const shownCount = Math.min(MAX_SHOWN, 3 + tier);
  const optionCount = Math.min(WORD_BANK.length, 6 + tier * 2);
  const pool = shuffle(WORD_BANK);
  const shown = pool.slice(0, shownCount).map((w) => w[lang]);
  const options = shuffle(pool.slice(0, optionCount).map((w) => w[lang]));
  return { shown, options };
}

/**
 * "Memory Burst": words flash one at a time, then the player must tap
 * exactly the words they saw out of a larger grid. Same remount-per-question
 * pattern as the other games (parent keys this by question index).
 */
export function WordBurstGame({
  level,
  onAnswer,
}: {
  level: number;
  onAnswer: (isCorrect: boolean, responseTimeMs: number) => void;
}) {
  const { t, lang } = useLanguage();
  const round = useMemo(() => generateRound(level, lang), [level, lang]);
  const [phase, setPhase] = useState<"memorize" | "recall">("memorize");
  const [visibleIndex, setVisibleIndex] = useState(0);
  const [selected, setSelected] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const recallStartRef = useRef(0);

  useEffect(() => {
    const timers = round.shown.map((_, index) =>
      setTimeout(() => setVisibleIndex(index + 1), (index + 1) * WORD_INTERVAL_MS)
    );
    const recallTimer = setTimeout(() => {
      setPhase("recall");
      recallStartRef.current = now();
    }, (round.shown.length + 1) * WORD_INTERVAL_MS);

    return () => {
      timers.forEach(clearTimeout);
      clearTimeout(recallTimer);
    };
  }, [round]);

  function toggleWord(word: string) {
    if (submitted) return;
    setSelected((prev) => (prev.includes(word) ? prev.filter((w) => w !== word) : [...prev, word]));
  }

  function handleSubmit() {
    if (submitted) return;
    const shownSet = new Set(round.shown);
    const selectedSet = new Set(selected);
    const isCorrect =
      shownSet.size === selectedSet.size && [...shownSet].every((word) => selectedSet.has(word));
    const responseTimeMs = Math.round(now() - recallStartRef.current);
    setSubmitted(true);
    window.setTimeout(() => onAnswer(isCorrect, responseTimeMs), ANSWER_FEEDBACK_MS);
  }

  return (
    <div className="flex flex-col items-center gap-6">
      {phase === "memorize" ? (
        <>
          <p className="text-sm text-muted-foreground">{t.quiz.wordBurstMemorize}</p>
          <div className="flex h-20 items-center">
            {visibleIndex > 0 && (
              <span className="text-3xl font-bold text-accent">{round.shown[visibleIndex - 1]}</span>
            )}
          </div>
        </>
      ) : (
        <>
          <p className="text-sm text-muted-foreground">{t.quiz.wordBurstRecall}</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {round.options.map((word) => {
              const isSelected = selected.includes(word);
              const isShownWord = round.shown.includes(word);
              return (
                <motion.button
                  key={word}
                  type="button"
                  onClick={() => toggleWord(word)}
                  disabled={submitted}
                  whileHover={!submitted ? { y: -1 } : undefined}
                  whileTap={!submitted ? tapScale : undefined}
                  transition={springTransition}
                  className={cn(
                    "flex h-11 items-center justify-center rounded-control border px-3 text-sm font-medium backdrop-blur-xl focus-visible:outline-none",
                    submitted
                      ? isShownWord
                        ? "border-success bg-success/15 text-success"
                        : isSelected
                          ? "border-danger bg-danger/15 text-danger"
                          : "border-glass-border bg-glass text-muted-foreground opacity-50"
                      : isSelected
                        ? "border-accent bg-accent/15 text-accent"
                        : "border-glass-border bg-glass text-foreground"
                  )}
                >
                  {word}
                </motion.button>
              );
            })}
          </div>

          <motion.button
            type="button"
            onClick={handleSubmit}
            disabled={submitted || selected.length === 0}
            whileHover={!submitted && selected.length > 0 ? { y: -1 } : undefined}
            whileTap={!submitted && selected.length > 0 ? tapScale : undefined}
            transition={springTransition}
            className="shine-hover inline-flex h-11 items-center rounded-full bg-accent px-6 text-sm font-semibold text-accent-foreground shadow-accent-md disabled:opacity-30 focus-visible:outline-none"
          >
            {t.quiz.digitSpanSubmit}
          </motion.button>
        </>
      )}
    </div>
  );
}
