"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useLanguage } from "@/components/LanguageProvider";
import { springTransition, tapScale } from "@/lib/motion";
import { now } from "@/lib/timing";
import { shuffle } from "@/lib/random";
import type { Difficulty } from "@/lib/scoring";

const WORD_COUNT: Record<Difficulty, number> = { easy: 3, medium: 4, hard: 5 };
const OPTION_COUNT: Record<Difficulty, number> = { easy: 6, medium: 8, hard: 10 };
const WORD_INTERVAL_MS = 900;

const WORD_BANK: readonly { es: string; en: string }[] = [
  { es: "gato", en: "cat" },
  { es: "silla", en: "chair" },
  { es: "puente", en: "bridge" },
  { es: "nube", en: "cloud" },
  { es: "río", en: "river" },
  { es: "llave", en: "key" },
  { es: "montaña", en: "mountain" },
  { es: "espejo", en: "mirror" },
  { es: "fuego", en: "fire" },
  { es: "papel", en: "paper" },
  { es: "reloj", en: "clock" },
  { es: "camino", en: "road" },
  { es: "ventana", en: "window" },
  { es: "botella", en: "bottle" },
  { es: "estrella", en: "star" },
  { es: "barco", en: "boat" },
  { es: "jardín", en: "garden" },
  { es: "lámpara", en: "lamp" },
  { es: "puerta", en: "door" },
  { es: "árbol", en: "tree" },
];

function generateRound(difficulty: Difficulty, lang: "es" | "en") {
  const pool = shuffle(WORD_BANK);
  const shownCount = WORD_COUNT[difficulty];
  const optionCount = OPTION_COUNT[difficulty];
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
  difficulty,
  onAnswer,
}: {
  difficulty: Difficulty;
  onAnswer: (isCorrect: boolean, responseTimeMs: number) => void;
}) {
  const { t, lang } = useLanguage();
  const round = useMemo(() => generateRound(difficulty, lang), [difficulty, lang]);
  const [phase, setPhase] = useState<"memorize" | "recall">("memorize");
  const [visibleIndex, setVisibleIndex] = useState(0);
  const [selected, setSelected] = useState<string[]>([]);
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
    setSelected((prev) => (prev.includes(word) ? prev.filter((w) => w !== word) : [...prev, word]));
  }

  function handleSubmit() {
    const shownSet = new Set(round.shown);
    const selectedSet = new Set(selected);
    const isCorrect =
      shownSet.size === selectedSet.size && [...shownSet].every((word) => selectedSet.has(word));
    onAnswer(isCorrect, Math.round(now() - recallStartRef.current));
  }

  return (
    <div className="flex flex-col items-center gap-6">
      {phase === "memorize" ? (
        <>
          <p className="text-sm text-muted-foreground">{t.quiz.wordBurstMemorize}</p>
          <div className="flex h-20 items-center">
            <AnimatePresence mode="wait">
              {visibleIndex > 0 && (
                <motion.span
                  key={visibleIndex}
                  initial={{ opacity: 0, scale: 0.7 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={springTransition}
                  className="text-3xl font-bold text-accent"
                >
                  {round.shown[visibleIndex - 1]}
                </motion.span>
              )}
            </AnimatePresence>
          </div>
        </>
      ) : (
        <>
          <p className="text-sm text-muted-foreground">{t.quiz.wordBurstRecall}</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {round.options.map((word) => {
              const isSelected = selected.includes(word);
              return (
                <motion.button
                  key={word}
                  type="button"
                  onClick={() => toggleWord(word)}
                  whileHover={{ y: -1 }}
                  whileTap={tapScale}
                  transition={springTransition}
                  className={`flex h-11 items-center justify-center rounded-control border px-3 text-sm font-medium backdrop-blur-xl focus-visible:outline-none ${
                    isSelected
                      ? "border-accent bg-accent/15 text-accent"
                      : "border-glass-border bg-glass text-foreground"
                  }`}
                >
                  {word}
                </motion.button>
              );
            })}
          </div>

          <motion.button
            type="button"
            onClick={handleSubmit}
            disabled={selected.length === 0}
            whileHover={selected.length > 0 ? { y: -1 } : undefined}
            whileTap={selected.length > 0 ? tapScale : undefined}
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
