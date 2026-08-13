"use client";

import { useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useLanguage } from "@/components/LanguageProvider";
import { ANSWER_FEEDBACK_MS, springTransition, tapScale } from "@/lib/motion";
import { now } from "@/lib/timing";
import { shuffle } from "@/lib/random";
import { cn } from "@/lib/utils";
import { contentTier } from "@/lib/scoring";

// Slot grid is sized to the actual count needed (with 40% headroom) instead
// of a fixed pool, so it scales with however high the base range grows and
// two counts never collide into the same rendered dot layout.
function dotPositions(count: number): { x: number; y: number }[] {
  const gridDim = Math.max(5, Math.ceil(Math.sqrt(count * 1.4)));
  const step = 90 / (gridDim - 1);
  const slots: { x: number; y: number }[] = [];
  for (let row = 0; row < gridDim; row++) {
    for (let col = 0; col < gridDim; col++) {
      slots.push({ x: 5 + col * step, y: 5 + row * step });
    }
  }
  return shuffle(slots)
    .slice(0, count)
    .map((s) => ({ x: s.x + (Math.random() * 4 - 2), y: s.y + (Math.random() * 4 - 2) }));
}

/**
 * Quick approximate-number comparison: two dot clusters, click the side with
 * more - a fast subitizing/estimation task (processing speed) rather than
 * Stroop's color/word interference, so it exercises the "speed" domain
 * differently instead of duplicating it. Base range grows and the ratio
 * between the two counts shrinks (floored at 1.08) with tier, so higher
 * levels mean more dots that are also closer in count - harder to judge at
 * a glance both ways.
 */
function generateTrial(level: number) {
  const tier = contentTier(level);
  const baseRange: [number, number] = [4 + tier, 8 + tier * 3];
  const ratio = Math.max(1.08, 1.6 - tier * 0.08);
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
  level,
  onAnswer,
}: {
  level: number;
  onAnswer: (isCorrect: boolean, responseTimeMs: number) => void;
}) {
  const { t } = useLanguage();
  const trial = useMemo(() => generateTrial(level), [level]);
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
