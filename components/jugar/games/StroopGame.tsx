"use client";

import { useMemo, useRef } from "react";
import { motion } from "framer-motion";
import { useLanguage } from "@/components/LanguageProvider";
import { springTransition, tapScale } from "@/lib/motion";
import { now } from "@/lib/timing";
import type { Difficulty } from "@/lib/scoring";

const COLORS = [
  { key: "red", hex: "#FF3B30", es: "Rojo", en: "Red" },
  { key: "blue", hex: "#0A84FF", es: "Azul", en: "Blue" },
  { key: "green", hex: "#34C759", es: "Verde", en: "Green" },
  { key: "yellow", hex: "#FFD60A", es: "Amarillo", en: "Yellow" },
  { key: "purple", hex: "#AF52DE", es: "Violeta", en: "Purple" },
] as const;

const OPTION_COUNT: Record<Difficulty, number> = { easy: 3, medium: 4, hard: 5 };

function generateTrial(difficulty: Difficulty) {
  const pool = COLORS.slice(0, OPTION_COUNT[difficulty]);
  const wordIndex = Math.floor(Math.random() * pool.length);
  let inkIndex = Math.floor(Math.random() * pool.length);
  while (inkIndex === wordIndex) {
    inkIndex = Math.floor(Math.random() * pool.length);
  }
  return { pool, word: pool[wordIndex], ink: pool[inkIndex] };
}

export function StroopGame({
  difficulty,
  onAnswer,
}: {
  difficulty: Difficulty;
  onAnswer: (isCorrect: boolean, responseTimeMs: number) => void;
}) {
  const { t, lang } = useLanguage();
  const trial = useMemo(() => generateTrial(difficulty), [difficulty]);
  const startTimeRef = useRef(now());

  function handleChoice(colorKey: string) {
    onAnswer(colorKey === trial.ink.key, Math.round(now() - startTimeRef.current));
  }

  return (
    <div className="flex flex-col items-center gap-8">
      <p className="text-sm text-muted-foreground">{t.quiz.stroopInstructions}</p>

      <p
        className="text-5xl font-bold sm:text-6xl"
        style={{ color: trial.ink.hex }}
      >
        {lang === "es" ? trial.word.es : trial.word.en}
      </p>

      <div className="flex flex-wrap justify-center gap-2">
        {trial.pool.map((color) => (
          <motion.button
            key={color.key}
            type="button"
            onClick={() => handleChoice(color.key)}
            whileHover={{ y: -2 }}
            whileTap={tapScale}
            transition={springTransition}
            className="shine-hover flex h-12 items-center gap-2 rounded-full border border-glass-border bg-glass px-4 text-sm font-medium text-foreground backdrop-blur-xl hover:border-accent/40 focus-visible:outline-none"
          >
            <span
              className="h-4 w-4 rounded-full"
              style={{ backgroundColor: color.hex }}
              aria-hidden="true"
            />
            {lang === "es" ? color.es : color.en}
          </motion.button>
        ))}
      </div>
    </div>
  );
}
