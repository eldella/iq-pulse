"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useLanguage } from "@/components/LanguageProvider";
import { ANSWER_FEEDBACK_MS, springTransition, tapScale } from "@/lib/motion";
import { now } from "@/lib/timing";
import { shuffle } from "@/lib/random";
import { cn } from "@/lib/utils";
import { WORD_BANK } from "@/lib/wordBank";
import type { Difficulty } from "@/lib/scoring";

const LETTER_INTERVAL_MS: Record<Difficulty, number> = { easy: 550, medium: 450, hard: 350 };

function pickWord(difficulty: Difficulty, lang: "es" | "en"): string {
  const pool = WORD_BANK.filter((w) => {
    const len = w[lang].length;
    if (difficulty === "easy") return len <= 5;
    if (difficulty === "medium") return len >= 5 && len <= 7;
    return len >= 6;
  });
  const candidates = pool.length > 0 ? pool : WORD_BANK;
  return shuffle(candidates)[0][lang];
}

/**
 * Letters of a word flash one at a time (fast, no whole word ever shown at
 * once), then the player types the reconstructed word in one go - a
 * different memory shape than WordBurstGame (pick words from a grid) or
 * DigitSpanGame (numeric keypad): free-text recall via the keyboard.
 */
export function WordTypingGame({
  difficulty,
  onAnswer,
}: {
  difficulty: Difficulty;
  onAnswer: (isCorrect: boolean, responseTimeMs: number) => void;
}) {
  const { t, lang } = useLanguage();
  const word = useMemo(() => pickWord(difficulty, lang), [difficulty, lang]);
  const [phase, setPhase] = useState<"flash" | "recall">("flash");
  const [visibleIndex, setVisibleIndex] = useState(0);
  const [typed, setTyped] = useState("");
  const [submitted, setSubmitted] = useState<{ isCorrect: boolean } | null>(null);
  const recallStartRef = useRef(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const interval = LETTER_INTERVAL_MS[difficulty];
    const letters = word.split("");
    const timers = letters.map((_, index) =>
      window.setTimeout(() => setVisibleIndex(index + 1), (index + 1) * interval)
    );
    const recallTimer = window.setTimeout(() => {
      setPhase("recall");
      recallStartRef.current = now();
    }, (letters.length + 1) * interval);

    return () => {
      timers.forEach(window.clearTimeout);
      window.clearTimeout(recallTimer);
    };
  }, [word, difficulty]);

  useEffect(() => {
    if (phase === "recall") inputRef.current?.focus();
  }, [phase]);

  function handleSubmit() {
    if (submitted || typed.trim().length === 0) return;
    const isCorrect = typed.trim().toLowerCase() === word.toLowerCase();
    const responseTimeMs = Math.round(now() - recallStartRef.current);
    setSubmitted({ isCorrect });
    window.setTimeout(() => onAnswer(isCorrect, responseTimeMs), ANSWER_FEEDBACK_MS);
  }

  return (
    <div className="flex flex-col items-center gap-6">
      {phase === "flash" ? (
        <>
          <p className="text-sm text-muted-foreground">{t.quiz.wordTypingFlash}</p>
          <div className="flex h-20 items-center">
            <AnimatePresence mode="wait">
              {visibleIndex > 0 && (
                <motion.span
                  key={visibleIndex}
                  initial={{ opacity: 0, scale: 0.7 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={springTransition}
                  className="text-6xl font-bold uppercase text-accent"
                >
                  {word[visibleIndex - 1]}
                </motion.span>
              )}
            </AnimatePresence>
          </div>
        </>
      ) : (
        <>
          <p className="text-sm text-muted-foreground">{t.quiz.wordTypingRecall}</p>
          <input
            ref={inputRef}
            type="text"
            value={typed}
            disabled={submitted !== null}
            onChange={(e) => setTyped(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSubmit();
            }}
            autoComplete="off"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            aria-label={t.quiz.wordTypingRecall}
            className={cn(
              "h-12 w-48 rounded-control border px-4 text-center text-lg font-semibold backdrop-blur-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
              submitted === null
                ? "border-glass-border bg-glass text-foreground"
                : submitted.isCorrect
                  ? "border-success bg-success/15 text-success"
                  : "border-danger bg-danger/15 text-danger"
            )}
          />
          {submitted && !submitted.isCorrect && (
            <p className="text-xs text-success">
              {t.quiz.wordTypingCorrectWord} {word}
            </p>
          )}
          <motion.button
            type="button"
            onClick={handleSubmit}
            disabled={submitted !== null || typed.trim().length === 0}
            whileHover={submitted === null && typed.trim().length > 0 ? { y: -1 } : undefined}
            whileTap={submitted === null && typed.trim().length > 0 ? tapScale : undefined}
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
