"use client";

import { useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useLanguage } from "@/components/LanguageProvider";
import { ANSWER_FEEDBACK_MS, springTransition, tapScale } from "@/lib/motion";
import { now } from "@/lib/timing";
import { shuffle } from "@/lib/random";
import { cn } from "@/lib/utils";
import type { Difficulty } from "@/lib/scoring";

// Lower ratio = the two dot counts are closer together = harder to judge at a glance.
const CONFIG: Record<Difficulty, { baseRange: [number, number]; ratio: number }> = {
  easy: { baseRange: [4, 8], ratio: 1.6 },
  medium: { baseRange: [6, 12], ratio: 1.35 },
  hard: { baseRange: [8, 16], ratio: 1.15 },
};

// 5x5 = 25 slots, comfortable headroom above the highest possible count
// (hard: up to 16 base * 1.15 ratio ≈ 19) so two counts never collide into
// the same rendered dot layout.
function dotPositions(count: number): { x: number; y: number }[] {
  const slots: { x: number; y: number }[] = [];
  for (let row = 0; row < 5; row++) {
    for (let col = 0; col < 5; col++) {
      slots.push({ x: 5 + col * 22.5, y: 5 + row * 22.5 });
    }
  }
  return shuffle(slots)
    .slice(0, count)
    .map((s) => ({ x: s.x + (Math.random() * 5 - 2.5), y: s.y + (Math.random() * 5 - 2.5) }));
}

/**
 * Quick approximate-number comparison: two dot clusters, click the side with
 * more - a fast subitizing/estimation task (processing speed) rather than
 * Stroop's color/word interference, so it exercises the "speed" domain
 * differently instead of duplicating it.
 */
function generateTrial(difficulty: Difficulty) {
  const { baseRange, ratio } = CONFIG[difficulty];
  const base = Math.floor(Math.random() * (baseRange[1] - baseRange[0] + 1)) + baseRange[0];
  const other = Math.max(base + 1, Math.round(base * ratio));
  const baseIsLeft = Math.random() < 0.5;
  const leftCount = baseIsLeft ? base : other;
  const rightCount = baseIsLeft ? other : base;
  return {
    left: dotPositions(leftCount),
    right: dotPositions(rightCount),
    correctSide: leftCount > rightCount ? ("left" as const) : ("right" as const),
  };
}

export function QuickCompareGame({
  difficulty,
  onAnswer,
}: {
  difficulty: Difficulty;
  onAnswer: (isCorrect: boolean, responseTimeMs: number) => void;
}) {
  const { t } = useLanguage();
  const trial = useMemo(() => generateTrial(difficulty), [difficulty]);
  const startTimeRef = useRef(now());
  const [selected, setSelected] = useState<"left" | "right" | null>(null);

  function handleChoice(side: "left" | "right") {
    if (selected !== null) return;
    const responseTimeMs = Math.round(now() - startTimeRef.current);
    setSelected(side);
    window.setTimeout(() => onAnswer(side === trial.correctSide, responseTimeMs), ANSWER_FEEDBACK_MS);
  }

  return (
    <div className="flex flex-col items-center gap-6">
      <p className="text-sm text-muted-foreground">{t.quiz.quickCompareInstructions}</p>

      <div className="flex items-center gap-3">
        {(["left", "right"] as const).map((side) => {
          const isCorrectSide = side === trial.correctSide;
          const isSelectedSide = side === selected;
          return (
            <motion.button
              key={side}
              type="button"
              onClick={() => handleChoice(side)}
              disabled={selected !== null}
              whileHover={selected === null ? { y: -2 } : undefined}
              whileTap={selected === null ? tapScale : undefined}
              transition={springTransition}
              className={cn(
                "flex h-36 w-36 items-center justify-center rounded-card border backdrop-blur-xl focus-visible:outline-none sm:h-40 sm:w-40",
                selected === null
                  ? "border-glass-border bg-glass hover:border-accent/40"
                  : isCorrectSide
                    ? "border-success bg-success/10"
                    : isSelectedSide
                      ? "border-danger bg-danger/10"
                      : "border-glass-border bg-glass opacity-50"
              )}
            >
              <svg viewBox="0 0 100 100" className="h-full w-full text-accent">
                {trial[side].map((dot, index) => (
                  <circle key={index} cx={dot.x} cy={dot.y} r={3.4} fill="currentColor" />
                ))}
              </svg>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
