"use client";

import { useMemo, useRef, useState } from "react";
import { ArrowDown, ArrowRight, Flag, X } from "lucide-react";
import { motion } from "framer-motion";
import { useLanguage } from "@/components/LanguageProvider";
import { ANSWER_FEEDBACK_MS, springTransition, tapScale } from "@/lib/motion";
import { now } from "@/lib/timing";
import { shuffle } from "@/lib/random";
import { cn } from "@/lib/utils";
import type { Difficulty } from "@/lib/scoring";

type Move = "R" | "D";

// steps=3 only yields 3 distinct paths total, which makes the obstacle
// search below (needs >=1 valid AND >=3 invalid, i.e. more paths than
// exist) mathematically unsatisfiable - it silently fell through to the
// fully-fixed fallback puzzle every single time at "easy", which is why the
// same pathfinder kept repeating. 4 steps (6 distinct paths) gives the
// search room to actually find a real, varied obstacle placement.
const CONFIG: Record<Difficulty, { size: number; steps: number }> = {
  easy: { size: 4, steps: 4 },
  medium: { size: 5, steps: 4 },
  hard: { size: 6, steps: 5 },
};

function permutations(moves: Move[]): Move[][] {
  if (moves.length <= 1) return [moves];
  const seen = new Set<string>();
  const result: Move[][] = [];
  for (let i = 0; i < moves.length; i++) {
    const rest = [...moves.slice(0, i), ...moves.slice(i + 1)];
    for (const perm of permutations(rest)) {
      const candidate = [moves[i], ...perm];
      const key = candidate.join("");
      if (!seen.has(key)) {
        seen.add(key);
        result.push(candidate);
      }
    }
  }
  return result;
}

function pathHitsCell(path: Move[], target: [number, number]): boolean {
  let x = 0;
  let y = 0;
  for (const move of path) {
    if (move === "R") x += 1;
    else y += 1;
    if (x === target[0] && y === target[1]) return true;
  }
  return false;
}

/**
 * Simplified "Pathfinder": instead of free-form path drawing (higher
 * implementation risk), the player picks which of 4 right/down move
 * sequences reaches the goal without crossing the single obstacle cell -
 * same "pick one of ~4 options" interaction as the other 3 games, so it
 * stays consistent with the rest of the engine instead of introducing a
 * whole new drag/build-path interaction pattern.
 */
function generatePuzzle(difficulty: Difficulty) {
  const { size, steps } = CONFIG[difficulty];
  const goalX = Math.ceil(steps / 2);
  const goalY = steps - goalX;
  const moves: Move[] = [...Array(goalX).fill("R"), ...Array(goalY).fill("D")];
  const allPaths = permutations(moves);

  const interiorCells: [number, number][] = [];
  for (let x = 0; x <= goalX; x++) {
    for (let y = 0; y <= goalY; y++) {
      if ((x !== 0 || y !== 0) && (x !== goalX || y !== goalY)) interiorCells.push([x, y]);
    }
  }

  const shuffledCells = shuffle(interiorCells);
  for (const obstacle of shuffledCells) {
    const valid = allPaths.filter((path) => !pathHitsCell(path, obstacle));
    const invalid = allPaths.filter((path) => pathHitsCell(path, obstacle));
    if (valid.length >= 1 && invalid.length >= 3) {
      const correct = valid[Math.floor(Math.random() * valid.length)];
      const distractors = shuffle(invalid).slice(0, 3);
      const options = shuffle([correct, ...distractors]);
      return { size, goal: [goalX, goalY] as [number, number], obstacle, options, correct };
    }
  }

  // Fallback (shouldn't happen given the ranges above, kept randomized
  // anyway so this branch can never freeze into one repeating puzzle):
  // no obstacle, but the "correct" path and option order are still random.
  const correct = allPaths[Math.floor(Math.random() * allPaths.length)];
  const distractors = shuffle(allPaths.filter((path) => path !== correct)).slice(0, 3);
  return {
    size,
    goal: [goalX, goalY] as [number, number],
    obstacle: null as [number, number] | null,
    options: shuffle([correct, ...distractors]),
    correct,
  };
}

export function PathfinderGame({
  difficulty,
  onAnswer,
}: {
  difficulty: Difficulty;
  onAnswer: (isCorrect: boolean, responseTimeMs: number) => void;
}) {
  const { t } = useLanguage();
  const puzzle = useMemo(() => generatePuzzle(difficulty), [difficulty]);
  const startTimeRef = useRef(now());
  const [selected, setSelected] = useState<Move[] | null>(null);

  function handleChoice(path: Move[]) {
    if (selected) return;
    const responseTimeMs = Math.round(now() - startTimeRef.current);
    setSelected(path);
    window.setTimeout(() => onAnswer(path.join("") === puzzle.correct.join(""), responseTimeMs), ANSWER_FEEDBACK_MS);
  }

  const cells = Array.from({ length: puzzle.size }, (_, y) =>
    Array.from({ length: puzzle.size }, (_, x) => {
      const isStart = x === 0 && y === 0;
      const isGoal = x === puzzle.goal[0] && y === puzzle.goal[1];
      const isObstacle = puzzle.obstacle?.[0] === x && puzzle.obstacle?.[1] === y;
      return { x, y, isStart, isGoal, isObstacle };
    })
  );

  return (
    <div className="flex flex-col items-center gap-6">
      <p className="text-sm text-muted-foreground">{t.quiz.pathfinderInstructions}</p>

      <div
        className="grid gap-1"
        style={{ gridTemplateColumns: `repeat(${puzzle.size}, minmax(0, 1fr))` }}
      >
        {cells.flat().map(({ x, y, isStart, isGoal, isObstacle }) => (
          <div
            key={`${x}-${y}`}
            className={`flex h-8 w-8 items-center justify-center rounded-md text-xs sm:h-9 sm:w-9 ${
              isObstacle
                ? "bg-danger/20 text-danger"
                : "border border-glass-border bg-glass text-muted-foreground"
            }`}
          >
            {isStart && <span className="h-2 w-2 rounded-full bg-accent" />}
            {isGoal && <Flag className="h-4 w-4 text-accent" aria-hidden="true" />}
            {isObstacle && <X className="h-4 w-4" aria-hidden="true" />}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {puzzle.options.map((option, index) => {
          const isCorrectOption = option.join("") === puzzle.correct.join("");
          const isSelectedOption = selected !== null && option.join("") === selected.join("");
          return (
          <motion.button
            key={index}
            type="button"
            onClick={() => handleChoice(option)}
            disabled={selected !== null}
            whileHover={selected === null ? { y: -2 } : undefined}
            whileTap={selected === null ? tapScale : undefined}
            transition={springTransition}
            className={cn(
              "shine-hover flex h-12 items-center justify-center gap-0.5 rounded-control border px-3 backdrop-blur-xl focus-visible:outline-none",
              selected === null
                ? "border-glass-border bg-glass hover:border-accent/40"
                : isCorrectOption
                  ? "border-success bg-success/15"
                  : isSelectedOption
                    ? "border-danger bg-danger/15"
                    : "border-glass-border bg-glass opacity-50"
            )}
          >
            {option.map((move, i) => {
              const arrowClass = cn(
                "h-4 w-4",
                selected !== null && isCorrectOption
                  ? "text-success"
                  : selected !== null && isSelectedOption
                    ? "text-danger"
                    : "text-foreground"
              );
              return move === "R" ? (
                <ArrowRight key={i} className={arrowClass} aria-hidden="true" />
              ) : (
                <ArrowDown key={i} className={arrowClass} aria-hidden="true" />
              );
            })}
          </motion.button>
          );
        })}
      </div>
    </div>
  );
}
