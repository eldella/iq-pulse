"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/components/LanguageProvider";
import { springTransition, tapScale } from "@/lib/motion";
import { now, formatMs } from "@/lib/timing";
import { shuffle } from "@/lib/random";
import { cn } from "@/lib/utils";
import { contentTier } from "@/lib/scoring";
import { ExposureRing } from "@/components/jugar/games/ExposureRing";
import type {
  PracticeLadderStep,
  PracticeStatCard,
  PracticeRoundLogEntry,
  SpanRunSummary,
} from "@/components/jugar/practiceResults";

const ATTEMPTS_PER_LEVEL = 2;
const STAGGER_MS = 30;
const FEEDBACK_MS = 1400;
const RUN_CLOCK_BASE_MS = 15_000;
const BONUS_PER_LEVEL_MS = 4_000;
const MIN_LADDER_CELLS = 3;
const MAX_LADDER_CELLS = 12;

/** Faster (shorter) exposure as difficulty rises. */
const DIFFICULTY_MULTIPLIER = [1.15, 1, 0.85, 0.7];

/** nivel n -> casillas = n + 2; grid grows in steps as the pattern needs more room. */
function levelConfig(n: number) {
  const cells = n + 2;
  const gridSize = cells <= 4 ? 3 : cells <= 7 ? 4 : cells <= 10 ? 5 : 6;
  return { cells, gridSize };
}

function exposureMsFor(cells: number, tier: number): number {
  return Math.round((700 + cells * 160) * DIFFICULTY_MULTIPLIER[tier]);
}

type Phase = "memorize" | "recall" | "feedback";
type RoundRecord = { cells: number; gridSize: number; passed: boolean; roundTimeMs: number };

/**
 * Independent memory-span ladder, same shape as DigitSpanGame: own clock
 * (a whole-run budget that grows +4s per level cleared, not a per-question
 * timer), own lives, own escalating pattern size - not a question in
 * QuizPage's shared engine (see its escalation exception list). `level`
 * from the parent is read once, at mount, only to pick a difficulty
 * multiplier for exposure time.
 */
export function SpatialMemoryGame({
  level,
  onAnswer,
}: {
  level: number;
  onAnswer: (isCorrect: boolean, responseTimeMs: number, spanSummary?: SpanRunSummary) => void;
}) {
  const { t } = useLanguage();
  const tier = contentTier(level);

  const [internalLevel, setInternalLevel] = useState(1);
  const [attempt, setAttempt] = useState(1);
  const [phase, setPhase] = useState<Phase>("memorize");
  const [revealedCount, setRevealedCount] = useState(0);
  const [exposing, setExposing] = useState(false);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [runClockMsLeft, setRunClockMsLeft] = useState(RUN_CLOCK_BASE_MS);
  const [bonusFlash, setBonusFlash] = useState(false);

  const { cells, gridSize } = levelConfig(internalLevel);
  const totalCellCount = gridSize * gridSize;
  const exposureMs = exposureMsFor(cells, tier);

  const pattern = useMemo(
    () => new Set(shuffle(Array.from({ length: totalCellCount }, (_, i) => i)).slice(0, cells)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [cells, totalCellCount, attempt]
  );
  const patternList = useMemo(() => [...pattern], [pattern]);

  const recallStartRef = useRef(0);
  const runStartRef = useRef(now());
  const historyRef = useRef<RoundRecord[]>([]);
  const roundStartRef = useRef(now());
  const bestClearedCellsRef = useRef(0);
  const tokenRef = useRef(0);
  const finishedRef = useRef(false);

  useEffect(() => {
    const myToken = ++tokenRef.current;
    roundStartRef.current = now();

    const revealTimers = patternList.map((_, index) =>
      window.setTimeout(() => {
        if (tokenRef.current === myToken) setRevealedCount(index + 1);
      }, index * STAGGER_MS)
    );
    const exposureStartDelay = patternList.length * STAGGER_MS;
    const exposeTimer = window.setTimeout(() => {
      if (tokenRef.current === myToken) setExposing(true);
    }, exposureStartDelay);
    const recallTimer = window.setTimeout(
      () => {
        if (tokenRef.current !== myToken) return;
        setExposing(false);
        setPhase("recall");
        recallStartRef.current = now();
      },
      exposureStartDelay + exposureMs
    );

    return () => {
      revealTimers.forEach(window.clearTimeout);
      window.clearTimeout(exposeTimer);
      window.clearTimeout(recallTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pattern]);

  useEffect(() => {
    const id = window.setInterval(() => {
      setRunClockMsLeft((prev) => {
        const next = prev - 200;
        if (next <= 0 && !finishedRef.current) {
          window.clearInterval(id);
          finishRun();
          return 0;
        }
        return next;
      });
    }, 200);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function finishRun() {
    if (finishedRef.current) return;
    finishedRef.current = true;

    const history = historyRef.current;
    const clearedAny = history.some((r) => r.passed);
    const span = clearedAny ? bestClearedCellsRef.current : cells;
    const totalRounds = history.length;
    const correctRounds = history.filter((r) => r.passed).length;
    const accuracy = totalRounds > 0 ? correctRounds / totalRounds : 0;
    const avgResponseMs =
      totalRounds > 0 ? Math.round(history.reduce((sum, r) => sum + r.roundTimeMs, 0) / totalRounds) : null;
    const totalTimeMs = Math.round(now() - runStartRef.current);

    const ladder: PracticeLadderStep[] = [];
    for (let c = MIN_LADDER_CELLS; c <= MAX_LADDER_CELLS; c++) {
      const roundsForCells = history.filter((r) => r.cells === c);
      const tone =
        roundsForCells.length === 0 ? "off" : roundsForCells.some((r) => r.passed) ? "success" : "danger";
      ladder.push({ label: `${c} ${t.quiz.spatialMemoryCellsLabel}`, tone });
    }

    const extraStatCards: PracticeStatCard[] = [
      { emoji: "🧠", value: `${span}`, label: t.quiz.practiceRecordLabel },
      { emoji: "⚡", value: avgResponseMs !== null ? formatMs(avgResponseMs) : "—", label: t.quiz.spatialMemoryAvgSpeedLabel },
    ];

    const roundLog: PracticeRoundLogEntry[] = history.map((r, i) => ({
      label: `${t.quiz.spatialMemoryLevelLabel} ${i + 1}`,
      value: `${r.cells} ${t.quiz.spatialMemoryCellsLabel} · ${r.gridSize}x${r.gridSize} · ${formatMs(r.roundTimeMs)}`,
    }));

    const spanSummary: SpanRunSummary = {
      span,
      spanUnitLabel: t.quiz.spatialMemoryCellsLabel,
      accuracy,
      avgResponseMs,
      extraStatCards,
      ladder,
      roundLog,
    };

    onAnswer(clearedAny, avgResponseMs ?? totalTimeMs, spanSummary);
  }

  function toggleCell(index: number) {
    if (phase !== "recall") return;
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else if (next.size < cells) {
        next.add(index);
      }
      return next;
    });
  }

  function handleSubmit() {
    if (phase !== "recall" || selected.size === 0) return;
    const passed = selected.size === pattern.size && [...selected].every((c) => pattern.has(c));
    const roundTimeMs = Math.round(now() - recallStartRef.current);
    historyRef.current.push({ cells, gridSize, passed, roundTimeMs });
    if (passed) bestClearedCellsRef.current = cells;

    setPhase("feedback");

    const isLastAttempt = attempt >= ATTEMPTS_PER_LEVEL;
    window.setTimeout(() => {
      if (passed) {
        setInternalLevel((l) => l + 1);
        setAttempt(1);
        setRunClockMsLeft((ms) => ms + BONUS_PER_LEVEL_MS);
        setBonusFlash(true);
        window.setTimeout(() => setBonusFlash(false), 1200);
      } else if (!isLastAttempt) {
        setAttempt((a) => a + 1);
      } else {
        finishRun();
        return;
      }
      setRevealedCount(0);
      setExposing(false);
      setSelected(new Set());
      setPhase("memorize");
    }, FEEDBACK_MS);
  }

  const ready = phase === "recall" && selected.size === cells;

  return (
    <div className="flex flex-col items-center gap-5">
      <div className="flex w-full items-center justify-between text-xs text-muted-foreground">
        <span className="tabular-nums">
          {t.quiz.spatialMemoryLevelLabel} {internalLevel} · {cells} {t.quiz.spatialMemoryCellsLabel}
        </span>
        <span className="flex items-center gap-2">
          <AnimatePresence>
            {bonusFlash && (
              <motion.span
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="font-semibold text-success"
              >
                +4s
              </motion.span>
            )}
          </AnimatePresence>
          <span role="timer" className="tabular-nums">
            {formatMs(Math.max(0, runClockMsLeft))}
          </span>
        </span>
      </div>

      <div className="h-1 w-full max-w-xs overflow-hidden rounded-full bg-surface-hover">
        <div
          className="h-full bg-accent transition-[width] duration-200 ease-linear"
          style={{ width: `${Math.max(0, Math.min(100, (runClockMsLeft / RUN_CLOCK_BASE_MS) * 100))}%` }}
        />
      </div>

      <span className="text-xs text-muted-foreground">
        {t.quiz.spatialMemoryLifeLabel} {attempt}/{ATTEMPTS_PER_LEVEL}
      </span>

      <p className="text-sm text-muted-foreground">
        {phase === "memorize" ? t.quiz.spatialMemoryMemorize : t.quiz.spatialMemoryRecall}
      </p>

      <div className="relative p-3">
        <ExposureRing durationMs={exposureMs} active={exposing} />
        <div
          role="group"
          aria-label={t.quiz.spatialMemoryTitle}
          className="grid"
          style={{
            width: "min(300px, calc(100vw - 56px))",
            height: "min(300px, calc(100vw - 56px))",
            gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
            gridTemplateRows: `repeat(${gridSize}, 1fr)`,
            gap: gridSize <= 3 ? 6 : gridSize === 4 ? 5 : gridSize === 5 ? 4 : 3,
          }}
        >
          {Array.from({ length: totalCellCount }, (_, index) => {
            const isLit = phase === "memorize" && pattern.has(index) && patternList.indexOf(index) < revealedCount;
            const isSelected = selected.has(index);
            const isTarget = pattern.has(index);
            const showResult = phase === "feedback";
            return (
              <motion.button
                key={index}
                type="button"
                onClick={() => toggleCell(index)}
                disabled={phase !== "recall"}
                whileTap={phase === "recall" ? tapScale : undefined}
                transition={springTransition}
                className={cn(
                  "rounded-control border transition-colors",
                  isLit
                    ? "border-accent bg-accent/70"
                    : showResult
                      ? isTarget && isSelected
                        ? "border-success bg-success/20"
                        : isSelected
                          ? "border-danger bg-danger/20"
                          : isTarget
                            ? "border-2 border-dashed border-accent bg-transparent"
                            : "border-glass-border bg-glass"
                      : isSelected
                        ? "border-accent bg-accent/15"
                        : "border-glass-border bg-glass hover:bg-surface-hover"
                )}
              />
            );
          })}
        </div>
      </div>

      {phase === "recall" && (
        <>
          <div className="flex items-center gap-1.5" aria-hidden="true">
            {Array.from({ length: cells }, (_, i) => (
              <span
                key={i}
                className={cn("h-1.5 w-1.5 rounded-full", i < selected.size ? "bg-accent" : "bg-surface-hover")}
              />
            ))}
          </div>
          <motion.button
            type="button"
            onClick={handleSubmit}
            disabled={!ready}
            whileHover={ready ? { y: -1 } : undefined}
            whileTap={ready ? tapScale : undefined}
            transition={springTransition}
            className={cn(
              "shine-hover inline-flex h-11 items-center rounded-full px-6 text-sm font-semibold text-accent-foreground focus-visible:outline-none",
              ready ? "bg-accent shadow-accent-md" : "bg-accent/30"
            )}
          >
            {t.quiz.digitSpanSubmit}
          </motion.button>
        </>
      )}
    </div>
  );
}
