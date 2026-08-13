"use client";

import { useMemo, useRef } from "react";
import { ArrowDown, ArrowRight, Flag, X } from "lucide-react";
import { motion } from "framer-motion";
import { useLanguage } from "@/components/LanguageProvider";
import { springTransition, tapScale } from "@/lib/motion";
import { now } from "@/lib/timing";
import { shuffle } from "@/lib/random";
import type { Difficulty } from "@/lib/scoring";

type Move = "R" | "D";

const CONFIG: Record<Difficulty, { size: number; steps: number }> = {
  easy: { size: 4, steps: 3 },
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

  // Fallback (shouldn't happen given the ranges above): no obstacle, first path is "correct".
  return {
    size,
    goal: [goalX, goalY] as [number, number],
    obstacle: null as [number, number] | null,
    options: allPaths.slice(0, 4),
    correct: allPaths[0],
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

  function handleChoice(path: Move[]) {
    onAnswer(path.join("") === puzzle.correct.join(""), Math.round(now() - startTimeRef.current));
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
        {puzzle.options.map((option, index) => (
          <motion.button
            key={index}
            type="button"
            onClick={() => handleChoice(option)}
            whileHover={{ y: -2 }}
            whileTap={tapScale}
            transition={springTransition}
            className="shine-hover flex h-12 items-center justify-center gap-0.5 rounded-control border border-glass-border bg-glass px-3 backdrop-blur-xl hover:border-accent/40 focus-visible:outline-none"
          >
            {option.map((move, i) =>
              move === "R" ? (
                <ArrowRight key={i} className="h-4 w-4 text-foreground" aria-hidden="true" />
              ) : (
                <ArrowDown key={i} className="h-4 w-4 text-foreground" aria-hidden="true" />
              )
            )}
          </motion.button>
        ))}
      </div>
    </div>
  );
}
