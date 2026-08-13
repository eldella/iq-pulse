"use client";

import { useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useLanguage } from "@/components/LanguageProvider";
import { ANSWER_FEEDBACK_MS, springTransition, tapScale } from "@/lib/motion";
import { now } from "@/lib/timing";
import { shuffle } from "@/lib/random";
import { cn } from "@/lib/utils";
import { contentTier } from "@/lib/scoring";

// Red + standard green is the classic confusion pair for protanopia/
// deuteranopia (the most common color-vision deficiencies), and this is a
// color-perception task by nature (an answer's text label doesn't help
// with the stimulus itself, only with picking a response) - green is
// shifted to a teal to keep all hues distinguishable under common CVD. 8
// colors is the practical ceiling for staying distinguishable at a glance,
// so option-pool growth caps there regardless of how high level climbs.
const COLORS = [
  { key: "red", hex: "#FF3B30", es: "Rojo", en: "Red" },
  { key: "blue", hex: "#0A84FF", es: "Azul", en: "Blue" },
  { key: "teal", hex: "#12B5A6", es: "Turquesa", en: "Teal" },
  { key: "yellow", hex: "#FFD60A", es: "Amarillo", en: "Yellow" },
  { key: "purple", hex: "#AF52DE", es: "Violeta", en: "Purple" },
  { key: "orange", hex: "#FF9F0A", es: "Naranja", en: "Orange" },
  { key: "pink", hex: "#FF375F", es: "Rosa", en: "Pink" },
  { key: "brown", hex: "#8E6E53", es: "Marrón", en: "Brown" },
] as const;

function generateTrial(level: number) {
  const optionCount = Math.min(COLORS.length, 3 + contentTier(level));
  // Shuffled so the option buttons don't sit in the same fixed order every
  // single trial - the word/ink pairing was already random, but the layout
  // wasn't.
  const pool = shuffle(COLORS.slice(0, optionCount));
  const wordIndex = Math.floor(Math.random() * pool.length);
  let inkIndex = Math.floor(Math.random() * pool.length);
  while (inkIndex === wordIndex) {
    inkIndex = Math.floor(Math.random() * pool.length);
  }
  return { pool, word: pool[wordIndex], ink: pool[inkIndex] };
}

export function StroopGame({
  level,
  onAnswer,
}: {
  level: number;
  onAnswer: (isCorrect: boolean, responseTimeMs: number) => void;
}) {
  const { t, lang } = useLanguage();
  const trial = useMemo(() => generateTrial(level), [level]);
  const startTimeRef = useRef(now());
  const [selected, setSelected] = useState<string | null>(null);

  function handleChoice(colorKey: string) {
    if (selected !== null) return;
    const responseTimeMs = Math.round(now() - startTimeRef.current);
    setSelected(colorKey);
    window.setTimeout(() => onAnswer(colorKey === trial.ink.key, responseTimeMs), ANSWER_FEEDBACK_MS);
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
        {trial.pool.map((color) => {
          const isCorrectOption = color.key === trial.ink.key;
          const isSelectedOption = color.key === selected;
          return (
            <motion.button
              key={color.key}
              type="button"
              onClick={() => handleChoice(color.key)}
              disabled={selected !== null}
              whileHover={selected === null ? { y: -2 } : undefined}
              whileTap={selected === null ? tapScale : undefined}
              transition={springTransition}
              className={cn(
                "shine-hover flex h-12 items-center gap-2 rounded-full border px-4 text-sm font-medium backdrop-blur-xl focus-visible:outline-none",
                selected === null
                  ? "border-glass-border bg-glass text-foreground hover:border-accent/40"
                  : isCorrectOption
                    ? "border-success bg-success/15 text-success"
                    : isSelectedOption
                      ? "border-danger bg-danger/15 text-danger"
                      : "border-glass-border bg-glass text-foreground opacity-50"
              )}
            >
              <span
                className="h-4 w-4 rounded-full"
                style={{ backgroundColor: color.hex }}
                aria-hidden="true"
              />
              {lang === "es" ? color.es : color.en}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
