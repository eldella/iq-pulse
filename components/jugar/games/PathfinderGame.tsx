"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowDown, ArrowRight, Flag, X } from "lucide-react";
import { motion } from "framer-motion";
import { useLanguage } from "@/components/LanguageProvider";
import { ANSWER_FEEDBACK_MS, springTransition, tapScale } from "@/lib/motion";
import { now } from "@/lib/timing";
import { shuffle } from "@/lib/random";
import { cn } from "@/lib/utils";
import { contentTier } from "@/lib/scoring";
import type { PathfinderRoundReview, SpanRunSummary, WordReviewRunSummary } from "@/components/jugar/practiceResults";

export type Move = "R" | "D";
export type Cell = [number, number];

// A single obstacle cell can only ever block 3 of the 4 balanced paths if
// all 3 actually pass through it - and on a monotonic R/D grid, reaching
// cell (x,y) always takes exactly x+y moves, so "blocked at different
// steps" is geometrically impossible for a shared cell regardless of
// construction. What IS achievable, and empirically verified (see
// PathfinderGame.generator.test.ts), is a qualifying obstacle existing at
// all - but only from steps=6 up: at steps 4-5 zero balanced quads (out of
// 2000 sampled each) had one, so those sizes literally can't support this
// mechanic. 10 caps it because C(10,5) = 252 distinct paths keeps
// generation cheap regardless of how high level climbs.
const MIN_STEPS = 6;
const MAX_STEPS = 10;
const MAX_SIZE = 10;

export function configForLevel(level: number) {
  const steps = Math.min(MAX_STEPS, MIN_STEPS + contentTier(level));
  const size = Math.min(MAX_SIZE, steps + 2);
  return { size, steps };
}

/**
 * All distinct R/D sequences of length `totalSteps` with exactly `rCount`
 * R's, generated directly as combinations - O(C(n,k) * n) work, not the
 * O(n!) a naive "generate every permutation, dedupe with a Set" approach
 * would do.
 */
export function distinctPaths(totalSteps: number, rCount: number): Move[][] {
  const results: Move[][] = [];
  const current: Move[] = [];

  function backtrack(pos: number, rRemaining: number) {
    if (pos === totalSteps) {
      results.push([...current]);
      return;
    }
    if (rRemaining > 0) {
      current.push("R");
      backtrack(pos + 1, rRemaining - 1);
      current.pop();
    }
    if (totalSteps - pos > rRemaining) {
      current.push("D");
      backtrack(pos + 1, rRemaining);
      current.pop();
    }
  }

  backtrack(0, rCount);
  return results;
}

/**
 * Every subset of the 4 rows with size 0, 2 or 4 - i.e. every "who moves R
 * this column" split EXCEPT 1-3 or 3-1. Those two are exactly the shapes
 * that make one option "the only one that goes right/down here", which is
 * the exploit this whole generator exists to close: a player scanning only
 * the arrow columns (never the board) can spot a lone outlier in ~O(1)
 * glances. Restricting every column to this pattern set makes that
 * impossible by construction - there is no column, anywhere in the
 * sequence, with a minority of one.
 */
const COLUMN_PATTERNS: readonly number[][] = [
  [],
  [0, 1],
  [0, 2],
  [0, 3],
  [1, 2],
  [1, 3],
  [2, 3],
  [0, 1, 2, 3],
];

const BACKTRACK_NODE_BUDGET = 200_000;

/**
 * Builds 4 distinct R/D sequences of length `steps` that all reach the same
 * goal (`rCount` R's each) such that no column ever has a lone outlier (see
 * COLUMN_PATTERNS). Randomized DFS with feasibility pruning on the
 * remaining-R budget per row; returns null if the node budget runs out or
 * no such assignment exists for this (steps, rCount).
 */
export function buildBalancedQuadPaths(steps: number, rCount: number): Move[][] | null {
  const rows: Move[][] = [[], [], [], []];
  const rUsed = [0, 0, 0, 0];
  let nodesVisited = 0;

  function backtrack(col: number): boolean {
    if (col === steps) {
      return new Set(rows.map((row) => row.join(""))).size === 4;
    }
    const colsLeft = steps - col - 1;
    for (const pattern of shuffle(COLUMN_PATTERNS)) {
      if (++nodesVisited > BACKTRACK_NODE_BUDGET) return false;

      let feasible = true;
      for (let r = 0; r < 4; r++) {
        const next = rUsed[r] + (pattern.includes(r) ? 1 : 0);
        if (next > rCount || next + colsLeft < rCount) {
          feasible = false;
          break;
        }
      }
      if (!feasible) continue;

      for (let r = 0; r < 4; r++) {
        const isR = pattern.includes(r);
        rows[r].push(isR ? "R" : "D");
        if (isR) rUsed[r] += 1;
      }
      if (backtrack(col + 1)) return true;
      for (let r = 0; r < 4; r++) {
        if (pattern.includes(r)) rUsed[r] -= 1;
        rows[r].pop();
      }
    }
    return false;
  }

  return backtrack(0) ? rows.map((row) => [...row]) : null;
}

/**
 * The cell `other` reaches at the exact move where it first differs from
 * `candidate` - i.e. its first step off the candidate's route. On a
 * monotonic R/D grid this cell is GUARANTEED to never appear on candidate's
 * own route: reaching any cell (x,y) always takes exactly x+y moves no
 * matter which path gets there, so at that shared step count the candidate
 * is provably somewhere else (it took the other move). No search needed -
 * this always exists for any two distinct paths of equal length.
 */
function firstDivergenceCell(candidate: Move[], other: Move[]): Cell {
  let x = 0;
  let y = 0;
  let i = 0;
  while (i < candidate.length && candidate[i] === other[i]) {
    if (candidate[i] === "R") x += 1;
    else y += 1;
    i += 1;
  }
  return other[i] === "R" ? [x + 1, y] : [x, y + 1];
}

/**
 * One obstacle per OTHER path (deduped - two others can diverge from the
 * candidate at the same cell), each guaranteed to sit on that other path
 * and never on the candidate's. Unlike the single-shared-obstacle version
 * this replaced, this always succeeds for any candidate regardless of its
 * shape (see firstDivergenceCell) - the earlier "one obstacle blocks all 3"
 * version required a rare geometric coincidence that, empirically,
 * happened far more often for straight/simple paths than zigzagging ones,
 * so the correct answer ended up statistically "the straight one" (a real
 * leak the cheating-bot test caught: ~65% win rate for a "fewest turns"
 * bot). Obstacles-per-wrong-path removes that correlation entirely - every
 * candidate is equally likely to be chosen as correct because every
 * candidate is equally capable of blocking the other 3.
 */
export function obstaclesFor(candidateIndex: number, paths: Move[][]): Cell[] {
  const candidate = paths[candidateIndex];
  const cells = paths
    .filter((_, i) => i !== candidateIndex)
    .map((other) => firstDivergenceCell(candidate, other));
  const seen = new Set<string>();
  const deduped: Cell[] = [];
  for (const cell of cells) {
    const key = `${cell[0]},${cell[1]}`;
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(cell);
  }
  return deduped;
}

export type ResolvedPuzzle = { goalX: number; goalY: number; paths: Move[][]; correctIndex: number; obstacles: Cell[] };

/**
 * Builds one full, ready-to-serve puzzle: 4 balanced paths and a uniformly
 * random correct index. Unlike a single shared obstacle, obstaclesFor
 * always succeeds, so there's no rejection step left to bias which shape
 * ends up correct - see obstaclesFor's doc comment.
 */
export function buildValidPuzzle(steps: number, goalX: number, goalY: number): ResolvedPuzzle | null {
  const paths = buildBalancedQuadPaths(steps, goalX);
  if (!paths) return null;

  const correctIndex = Math.floor(Math.random() * 4);
  return { goalX, goalY, paths, correctIndex, obstacles: obstaclesFor(correctIndex, paths) };
}

const PUZZLE_POOL_TARGET = 16;
const PUZZLE_POOL_MAX_ATTEMPTS = 40;

/** Cached per `steps` (which fully determines goalX/goalY via configForLevel) so the backtracking search in buildBalancedQuadPaths doesn't repeat on every round. */
const puzzlePools = new Map<number, ResolvedPuzzle[]>();

function refillPuzzlePool(steps: number, goalX: number, goalY: number): ResolvedPuzzle[] {
  const pool: ResolvedPuzzle[] = [];
  for (let attempt = 0; attempt < PUZZLE_POOL_MAX_ATTEMPTS && pool.length < PUZZLE_POOL_TARGET; attempt++) {
    const puzzle = buildValidPuzzle(steps, goalX, goalY);
    if (puzzle) pool.push(puzzle);
  }
  return pool;
}

function takeResolvedPuzzle(steps: number, goalX: number, goalY: number): ResolvedPuzzle | null {
  let pool = puzzlePools.get(steps);
  if (!pool || pool.length === 0) {
    pool = refillPuzzlePool(steps, goalX, goalY);
    puzzlePools.set(steps, pool);
  }
  return pool.pop() ?? null;
}

/**
 * Simplified "Pathfinder": instead of free-form path drawing (higher
 * implementation risk), the player picks which of 4 right/down move
 * sequences reaches the goal without crossing any obstacle cell - same
 * "pick one of ~4 options" interaction as the other games.
 *
 * The generator is anti-shortcut by construction, not by patching after the
 * fact: buildBalancedQuadPaths guarantees no arrow column ever has a lone
 * outlier, and obstaclesFor guarantees a valid block for whichever path is
 * drawn as correct - no rejection sampling, so nothing about the draw can
 * correlate with path shape. Verified by the cheating-bot test in
 * PathfinderGame.generator.test.ts.
 */
export function generatePuzzle(level: number) {
  const { size, steps } = configForLevel(level);
  const goalX = Math.ceil(steps / 2);
  const goalY = steps - goalX;
  const puzzle = takeResolvedPuzzle(steps, goalX, goalY);

  if (puzzle) {
    return {
      size,
      goal: [goalX, goalY] as Cell,
      obstacles: puzzle.obstacles,
      options: shuffle(puzzle.paths),
      correct: puzzle.paths[puzzle.correctIndex],
    };
  }

  // Fallback for the (shouldn't-happen) case the constrained search can't
  // find a qualifying puzzle - no obstacles, but the "correct" path and
  // option order are still fully randomized so this branch can never freeze
  // into one repeating puzzle.
  const allPaths = distinctPaths(steps, goalX);
  const correct = allPaths[Math.floor(Math.random() * allPaths.length)];
  const distractors = shuffle(allPaths.filter((path) => path !== correct)).slice(0, 3);
  return {
    size,
    goal: [goalX, goalY] as Cell,
    obstacles: [] as Cell[],
    options: shuffle([correct, ...distractors]),
    correct,
  };
}

/** 7 arrows already reads as busy; 8+ needs to shrink or it overflows the option chip. */
function arrowSizeClass(sequenceLength: number) {
  if (sequenceLength >= 8) return "h-3 w-3";
  if (sequenceLength === 7) return "h-3.5 w-3.5";
  return "h-4 w-4";
}

export function PathfinderGame({
  level,
  onAnswer,
}: {
  level: number;
  // spanSummary/wordReview are never actually passed by this game - declared
  // here only so this matches GameDef's onAnswer signature positionally
  // (pathReview is the 5th param there too, see QuizPage.tsx).
  onAnswer: (
    isCorrect: boolean,
    responseTimeMs: number,
    spanSummary?: SpanRunSummary,
    wordReview?: WordReviewRunSummary,
    pathReview?: PathfinderRoundReview
  ) => void;
}) {
  const { t } = useLanguage();
  const puzzle = useMemo(() => generatePuzzle(level), [level]);
  const startTimeRef = useRef(now());
  const [selected, setSelected] = useState<Move[] | null>(null);

  function handleChoice(path: Move[]) {
    if (selected) return;
    const responseTimeMs = Math.round(now() - startTimeRef.current);
    setSelected(path);
    const isCorrect = path.join("") === puzzle.correct.join("");
    // See "RESULTADO" in terminales/terminal-1-razonamiento.txt - the results
    // screen's per-round review needs this round's whole board state, not
    // just isCorrect/ms, to trace the correct path and (on a miss) show
    // exactly where the player's choice ran into an obstacle.
    const pathReview: PathfinderRoundReview = {
      correct: isCorrect,
      size: puzzle.size,
      goal: puzzle.goal,
      obstacles: puzzle.obstacles,
      correctPath: puzzle.correct,
      selectedPath: path,
    };
    window.setTimeout(() => onAnswer(isCorrect, responseTimeMs, undefined, undefined, pathReview), ANSWER_FEEDBACK_MS);
  }

  // Keyboard 1-4 answers the option in that display position (options are
  // already shuffled, so "1" isn't tied to any particular path).
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const index = Number(e.key) - 1;
      if (index < 0 || index > 3 || index >= puzzle.options.length) return;
      handleChoice(puzzle.options[index]);
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [puzzle, selected]);

  const cells = Array.from({ length: puzzle.size }, (_, y) =>
    Array.from({ length: puzzle.size }, (_, x) => {
      const isStart = x === 0 && y === 0;
      const isGoal = x === puzzle.goal[0] && y === puzzle.goal[1];
      const isObstacle = puzzle.obstacles.some(([ox, oy]) => ox === x && oy === y);
      return { x, y, isStart, isGoal, isObstacle };
    })
  );

  const arrowSize = arrowSizeClass(puzzle.correct.length);

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
                arrowSize,
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
