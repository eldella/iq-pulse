"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useLanguage } from "@/components/LanguageProvider";
import { ANSWER_FEEDBACK_MS, springTransition, tapScale } from "@/lib/motion";
import { now } from "@/lib/timing";
import { shuffle } from "@/lib/random";
import { cn } from "@/lib/utils";
import type { Difficulty } from "@/lib/scoring";

const CONFIG: Record<Difficulty, { gridSize: number; count: number }> = {
  easy: { gridSize: 3, count: 3 },
  medium: { gridSize: 3, count: 4 },
  hard: { gridSize: 4, count: 5 },
};
const FLASH_MS = 1800;

function generateRound(difficulty: Difficulty) {
  const { gridSize, count } = CONFIG[difficulty];
  const cells = shuffle(Array.from({ length: gridSize * gridSize }, (_, i) => i)).slice(0, count);
  return { gridSize, cells: new Set(cells) };
}

/**
 * Spatial memory: several grid cells flash at once (not one at a time), then
 * click back the same set - order doesn't matter, unlike the weekly
 * challenge's "sequence" game. Complements DigitSpanGame (numbers) and
 * WordBurstGame (words) with a purely visual/positional recall task.
 */
export function SpatialMemoryGame({
  difficulty,
  onAnswer,
}: {
  difficulty: Difficulty;
  onAnswer: (isCorrect: boolean, responseTimeMs: number) => void;
}) {
  const { t } = useLanguage();
  const round = useMemo(() => generateRound(difficulty), [difficulty]);
  const [phase, setPhase] = useState<"memorize" | "recall">("memorize");
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [submitted, setSubmitted] = useState<{ isCorrect: boolean } | null>(null);
  const recallStartRef = useRef(0);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setPhase("recall");
      recallStartRef.current = now();
    }, FLASH_MS);
    return () => window.clearTimeout(timer);
  }, [round]);

  function toggleCell(index: number) {
    if (submitted || phase !== "recall") return;
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }

  function handleSubmit() {
    if (submitted) return;
    const isCorrect =
      selected.size === round.cells.size && [...selected].every((cell) => round.cells.has(cell));
    const responseTimeMs = Math.round(now() - recallStartRef.current);
    setSubmitted({ isCorrect });
    window.setTimeout(() => onAnswer(isCorrect, responseTimeMs), ANSWER_FEEDBACK_MS);
  }

  return (
    <div className="flex flex-col items-center gap-6">
      <p className="text-sm text-muted-foreground">
        {phase === "memorize" ? t.quiz.spatialMemoryMemorize : t.quiz.spatialMemoryRecall}
      </p>

      <div
        role="group"
        aria-label={t.quiz.spatialMemoryTitle}
        className="grid gap-1.5"
        style={{ gridTemplateColumns: `repeat(${round.gridSize}, minmax(0, 1fr))` }}
      >
        {Array.from({ length: round.gridSize * round.gridSize }, (_, index) => {
          const isLit = phase === "memorize" && round.cells.has(index);
          const isSelected = selected.has(index);
          const isTarget = round.cells.has(index);
          const showResult = submitted !== null;
          return (
            <motion.button
              key={index}
              type="button"
              onClick={() => toggleCell(index)}
              disabled={phase !== "recall" || submitted !== null}
              whileTap={phase === "recall" && !submitted ? tapScale : undefined}
              transition={springTransition}
              className={cn(
                "h-12 w-12 rounded-control border transition-colors sm:h-14 sm:w-14",
                isLit
                  ? "border-accent bg-accent/70"
                  : showResult
                    ? isTarget
                      ? "border-success bg-success/20"
                      : isSelected
                        ? "border-danger bg-danger/20"
                        : "border-glass-border bg-glass"
                    : isSelected
                      ? "border-accent bg-accent/15"
                      : "border-glass-border bg-glass hover:bg-surface-hover"
              )}
            />
          );
        })}
      </div>

      {phase === "recall" && !submitted && (
        <motion.button
          type="button"
          onClick={handleSubmit}
          disabled={selected.size === 0}
          whileHover={selected.size > 0 ? { y: -1 } : undefined}
          whileTap={selected.size > 0 ? tapScale : undefined}
          transition={springTransition}
          className="shine-hover inline-flex h-11 items-center rounded-full bg-accent px-6 text-sm font-semibold text-accent-foreground shadow-accent-md disabled:opacity-30 focus-visible:outline-none"
        >
          {t.quiz.digitSpanSubmit}
        </motion.button>
      )}
    </div>
  );
}
