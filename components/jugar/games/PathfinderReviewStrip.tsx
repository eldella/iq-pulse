"use client";

import { useState } from "react";
import { Flag, X } from "lucide-react";
import { useLanguage } from "@/components/LanguageProvider";
import { cn } from "@/lib/utils";
import type { PathfinderRoundReview } from "@/components/jugar/practiceResults";

function pathCells(moves: ("R" | "D")[]): [number, number][] {
  const cells: [number, number][] = [];
  let x = 0;
  let y = 0;
  for (const move of moves) {
    if (move === "R") x += 1;
    else y += 1;
    cells.push([x, y]);
  }
  return cells;
}

function cellKey([x, y]: [number, number]) {
  return `${x},${y}`;
}

/**
 * Camino Óptimo's results-screen review (spec: terminales/terminal-1-
 * razonamiento.txt, "RESULTADO"): a clickable strip, one chip per round,
 * that swaps a single board preview below it - the correct path traced in
 * green, and on a miss, the player's own path traced in red up to the exact
 * obstacle it walked into. That obstacle is always well-defined: every wrong
 * option has its own dedicated obstacle guaranteed to sit on it (see
 * PathfinderGame.tsx's obstaclesFor), never shared with another option.
 */
export function PathfinderReviewStrip({ rounds }: { rounds: PathfinderRoundReview[] }) {
  const { t } = useLanguage();
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  if (rounds.length === 0) return null;

  const active = openIndex !== null ? rounds[openIndex] : null;
  const correctCellKeys = active ? new Set(pathCells(active.correctPath).map(cellKey)) : null;
  const selectedCells = active && !active.correct ? pathCells(active.selectedPath) : [];
  const crashCell = active
    ? selectedCells.find(([x, y]) => active.obstacles.some(([ox, oy]) => ox === x && oy === y))
    : undefined;
  const crashKey = crashCell ? cellKey(crashCell) : null;

  return (
    <div className="flex w-full flex-col items-center gap-2">
      <p className="text-xs text-muted-foreground">{t.quiz.pathfinderReviewCaption}</p>

      <div className="flex flex-wrap items-center justify-center gap-1.5">
        {rounds.map((round, index) => (
          <button
            key={index}
            type="button"
            onClick={() => setOpenIndex(openIndex === index ? null : index)}
            aria-label={`${t.quiz.pathfinderRoundLabel} ${index + 1}: ${
              round.correct ? t.quiz.pathfinderReviewCorrectStatus : t.quiz.pathfinderReviewIncorrectStatus
            }`}
            aria-pressed={openIndex === index}
            className={cn(
              "flex h-7 w-7 items-center justify-center rounded-control text-xs font-semibold tabular-nums transition-colors focus-visible:outline-none",
              round.correct
                ? "bg-success/15 text-success hover:bg-success/25"
                : "bg-danger/15 text-danger hover:bg-danger/25",
              openIndex === index && "ring-2 ring-accent"
            )}
          >
            {index + 1}
          </button>
        ))}
      </div>

      {active && (
        <div className="flex flex-col items-center gap-2 rounded-card border border-glass-border bg-glass p-3 backdrop-blur-xl">
          <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-foreground" aria-hidden="true" />
              {t.quiz.pathfinderReviewLegendStart}
            </span>
            <span className="flex items-center gap-1">
              <Flag className="h-2.5 w-2.5 text-foreground" aria-hidden="true" />
              {t.quiz.pathfinderReviewLegendGoal}
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-sm bg-success/60" aria-hidden="true" />
              {t.quiz.pathfinderReviewLegendCorrectPath}
            </span>
            {!active.correct && (
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-sm bg-danger/20 ring-2 ring-danger" aria-hidden="true" />
                {t.quiz.pathfinderReviewLegendCrash}
              </span>
            )}
          </div>

          <div className="grid gap-0.5" style={{ gridTemplateColumns: `repeat(${active.size}, minmax(0, 1fr))` }}>
            {Array.from({ length: active.size }, (_, y) =>
              Array.from({ length: active.size }, (_, x) => {
                const key = cellKey([x, y]);
                const isStart = x === 0 && y === 0;
                const isGoal = x === active.goal[0] && y === active.goal[1];
                const isObstacle = active.obstacles.some(([ox, oy]) => ox === x && oy === y);
                const isCrash = key === crashKey;
                const onCorrectPath = correctCellKeys?.has(key) ?? false;
                return (
                  <div
                    key={key}
                    className={cn(
                      "flex h-4 w-4 items-center justify-center rounded-sm sm:h-5 sm:w-5",
                      isObstacle
                        ? "bg-danger/20 text-danger"
                        : onCorrectPath
                          ? "bg-success/25"
                          : "border border-glass-border bg-glass",
                      isCrash && "ring-2 ring-danger"
                    )}
                  >
                    {isStart && <span className="h-1.5 w-1.5 rounded-full bg-foreground" aria-hidden="true" />}
                    {isGoal && <Flag className="h-2.5 w-2.5 text-foreground" aria-hidden="true" />}
                    {isObstacle && <X className="h-2.5 w-2.5" aria-hidden="true" />}
                  </div>
                );
              })
            )}
          </div>
          {!active.correct && <p className="text-xs text-danger">{t.quiz.pathfinderReviewCrashCaption}</p>}
        </div>
      )}
    </div>
  );
}
