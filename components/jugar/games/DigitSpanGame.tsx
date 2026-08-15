"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Check, Delete } from "lucide-react";
import { useLanguage } from "@/components/LanguageProvider";
import { springTransition, tapScale } from "@/lib/motion";
import { now, formatMs } from "@/lib/timing";
import { cn } from "@/lib/utils";
import { contentTier } from "@/lib/scoring";
import type { PracticeLadderStep, PracticeStatCard, SpanRunSummary } from "@/components/jugar/practiceResults";

const MAX_DIGITS = 12;
const ATTEMPTS_PER_LEVEL = 2;
/** How long the side-by-side "you typed vs. it was" reveal stays up before advancing/ending. */
const ROUND_FEEDBACK_MS = 1600;

/** Faster flash as difficulty rises, floored so it's never unreadable. */
function digitIntervalForTier(tier: number): number {
  return Math.max(400, 700 - tier * 100);
}

/** Shorter recall clock as difficulty rises - only ticks during recall, never during memorize. */
function recallMsForTier(tier: number): number {
  return Math.max(11_000, 20_000 - tier * 3_000);
}

function generateSequence(length: number): number[] {
  return Array.from({ length }, () => Math.floor(Math.random() * 10));
}

type Phase = "memorize" | "recall" | "feedback";
type RoundRecord = { digits: number; passed: boolean };

/**
 * Independent memory-span ladder: unlike the other minigames, this doesn't
 * plug into QuizPage's shared 30s/level engine - it runs its own clock,
 * its own lives, and its own escalating digit count, only calling onAnswer
 * once the whole run ends (see QuizPage.tsx's escalation exception list
 * and the `spanSummary` param on onAnswer). `level` from the parent is
 * read exactly once, at mount, only to pick a starting difficulty.
 */
export function DigitSpanGame({
  level,
  onAnswer,
}: {
  level: number;
  onAnswer: (isCorrect: boolean, responseTimeMs: number, spanSummary?: SpanRunSummary) => void;
}) {
  const { t } = useLanguage();
  // Only 3 named starting points exist (easy/medium/hard) - extreme reuses
  // hard's starting digit count, the ladder itself is what keeps climbing.
  const startDigits = 3 + Math.min(contentTier(level), 2);
  const tier = Math.min(contentTier(level), 2);

  const [internalLevel, setInternalLevel] = useState(0);
  const [attempt, setAttempt] = useState(1);
  const [phase, setPhase] = useState<Phase>("memorize");
  const [visibleIndex, setVisibleIndex] = useState(0);
  const [input, setInput] = useState<number[]>([]);
  const [lastPassed, setLastPassed] = useState(false);

  const digits = startDigits + internalLevel;
  // `attempt` isn't read inside the callback - it's a deliberate cache-buster
  // so a retry at the same digit count still draws a fresh sequence.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const sequence = useMemo(() => generateSequence(digits), [digits, attempt]);
  const digitIntervalMs = digitIntervalForTier(tier);
  const recallMs = recallMsForTier(tier);

  const recallStartRef = useRef(0);
  const runStartRef = useRef(now());
  const historyRef = useRef<RoundRecord[]>([]);
  const roundTimesRef = useRef<number[]>([]);
  const bestClearedDigitsRef = useRef(0);
  // Bumped on every unmount so in-flight timers from a round the player
  // already left can't fire setState against a stale round.
  const tokenRef = useRef(0);
  const [recallMsLeft, setRecallMsLeft] = useState(recallMs);

  useEffect(() => {
    const myToken = ++tokenRef.current;

    const timers = sequence.map((_, index) =>
      window.setTimeout(() => {
        if (tokenRef.current === myToken) setVisibleIndex(index + 1);
      }, (index + 1) * digitIntervalMs)
    );
    const recallTimer = window.setTimeout(
      () => {
        if (tokenRef.current !== myToken) return;
        setPhase("recall");
        recallStartRef.current = now();
        setRecallMsLeft(recallMs);
      },
      (sequence.length + 1) * digitIntervalMs
    );

    return () => {
      timers.forEach(window.clearTimeout);
      window.clearTimeout(recallTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sequence]);

  useEffect(() => {
    if (phase !== "recall") return;
    const myToken = tokenRef.current;
    const id = window.setInterval(() => {
      if (tokenRef.current !== myToken) return;
      const left = Math.max(0, recallMs - (now() - recallStartRef.current));
      setRecallMsLeft(left);
      if (left <= 0) {
        window.clearInterval(id);
        submitRound([...input]);
      }
    }, 100);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  function finishRun() {
    const history = historyRef.current;
    const clearedAny = history.some((r) => r.passed);
    const span = clearedAny ? bestClearedDigitsRef.current : digits;
    const totalRounds = history.length;
    const correctRounds = history.filter((r) => r.passed).length;
    const accuracy = totalRounds > 0 ? correctRounds / totalRounds : 0;
    const times = roundTimesRef.current;
    const avgResponseMs = times.length > 0 ? Math.round(times.reduce((a, b) => a + b, 0) / times.length) : null;
    const totalTimeMs = Math.round(now() - runStartRef.current);

    const ladder: PracticeLadderStep[] = history.map((r) => ({
      label: `${r.digits} ${t.quiz.digitSpanSpanUnit}`,
      tone: r.passed ? "success" : "danger",
    }));

    const extraStatCards: PracticeStatCard[] = [
      { emoji: "🪜", value: `${correctRounds}`, label: t.quiz.digitSpanLevelsPassedLabel },
      { emoji: "🎯", value: `${Math.round(accuracy * 100)}%`, label: t.quiz.digitSpanAccuracyTileLabel },
      { emoji: "⏱️", value: formatMs(totalTimeMs), label: t.quiz.resultsTimeLabel },
    ];

    const spanSummary: SpanRunSummary = {
      span,
      spanUnitLabel: t.quiz.digitSpanSpanUnit,
      spanNote: clearedAny ? undefined : t.quiz.digitSpanSpanNoteNoLevel,
      accuracy,
      avgResponseMs,
      extraStatCards,
      ladder,
    };

    onAnswer(clearedAny, avgResponseMs ?? totalTimeMs, spanSummary);
  }

  function submitRound(typed: number[]) {
    if (phase === "feedback") return;
    const passed = typed.length === sequence.length && typed.every((d, i) => d === sequence[i]);
    const responseTimeMs = Math.round(now() - recallStartRef.current);
    roundTimesRef.current.push(responseTimeMs);
    historyRef.current.push({ digits, passed });
    if (passed) bestClearedDigitsRef.current = digits;

    setLastPassed(passed);
    setPhase("feedback");

    const isLastAttempt = attempt >= ATTEMPTS_PER_LEVEL;
    window.setTimeout(() => {
      if (passed) {
        setInternalLevel((l) => Math.min(MAX_DIGITS - startDigits, l + 1));
        setAttempt(1);
      } else if (!isLastAttempt) {
        setAttempt((a) => a + 1);
      } else {
        finishRun();
        return;
      }
      setVisibleIndex(0);
      setInput([]);
      setPhase("memorize");
    }, ROUND_FEEDBACK_MS);
  }

  function handleDigit(digit: number) {
    if (phase !== "recall" || input.length >= sequence.length) return;
    setInput((prev) => [...prev, digit]);
  }

  function handleBackspace() {
    if (phase !== "recall") return;
    setInput((prev) => prev.slice(0, -1));
  }

  function handleConfirm() {
    if (phase !== "recall" || input.length !== sequence.length) return;
    submitRound(input);
  }

  useEffect(() => {
    if (phase !== "recall") return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key >= "0" && e.key <= "9") {
        handleDigit(Number(e.key));
      } else if (e.key === "Backspace") {
        handleBackspace();
      } else if (e.key === "Enter") {
        handleConfirm();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, input, sequence.length]);

  const ready = phase === "recall" && input.length === sequence.length;

  return (
    <div className="flex flex-col items-center gap-6">
      {phase === "memorize" && (
        <>
          <p className="text-sm text-muted-foreground">{t.quiz.digitSpanMemorize}</p>
          <div className="relative flex h-24 items-center justify-center">
            {visibleIndex > 0 && (
              <>
                <motion.span
                  aria-hidden="true"
                  className="absolute h-20 w-20 rounded-full bg-accent/20"
                  animate={{ scale: [1, 1.3, 1], opacity: [0.6, 0.1, 0.6] }}
                  transition={{ duration: 0.7, repeat: Infinity, ease: "easeInOut" }}
                />
                <span className="relative text-6xl font-bold text-accent">{sequence[visibleIndex - 1]}</span>
              </>
            )}
          </div>
          <div className="flex items-center gap-1.5" aria-hidden="true">
            {sequence.map((_, i) => (
              <span
                key={i}
                className={cn(
                  "h-1.5 w-1.5 rounded-full",
                  i < visibleIndex ? "bg-accent" : i === visibleIndex ? "bg-accent/60" : "bg-surface-hover"
                )}
              />
            ))}
          </div>
          <LevelSegments count={internalLevel + 1} current={internalLevel} />
        </>
      )}

      {(phase === "recall" || phase === "feedback") && (
        <>
          <div className="flex w-full items-center justify-between text-xs text-muted-foreground">
            <span>{t.quiz.digitSpanRecall}</span>
            {phase === "recall" && (
              <span role="timer" className="tabular-nums">
                {formatMs(recallMsLeft)}
              </span>
            )}
          </div>

          {!(phase === "feedback" && lastPassed) && (
            <span className="text-xs text-muted-foreground">
              {t.quiz.digitSpanAttemptLabel} {attempt}/{ATTEMPTS_PER_LEVEL}
            </span>
          )}

          {phase === "feedback" && !lastPassed ? (
            <div className="flex flex-col items-center gap-2">
              <div className="flex flex-col items-start gap-1">
                <span className="text-[10px] uppercase tracking-wide text-danger">{t.quiz.recallYouTypedLabel}</span>
                <DigitBoxes digits={digits} values={input} colorBy={sequence} />
              </div>
              <div className="flex flex-col items-start gap-1">
                <span className="text-[10px] uppercase tracking-wide text-success">
                  {t.quiz.digitSpanCorrectSequence}
                </span>
                <DigitBoxes digits={digits} values={sequence} tone="success" />
              </div>
            </div>
          ) : (
            <DigitBoxes
              digits={digits}
              values={input}
              tone={phase === "feedback" ? "success" : undefined}
            />
          )}

          <div className="grid grid-cols-3 gap-2">
            {Array.from({ length: 9 }, (_, i) => i + 1).map((digit) => (
              <motion.button
                key={digit}
                type="button"
                onClick={() => handleDigit(digit)}
                disabled={phase !== "recall"}
                whileHover={phase === "recall" ? { y: -1 } : undefined}
                whileTap={phase === "recall" ? tapScale : undefined}
                transition={springTransition}
                className="flex h-12 w-12 items-center justify-center rounded-control border border-glass-border bg-glass text-lg font-medium text-foreground backdrop-blur-xl focus-visible:outline-none disabled:opacity-50"
              >
                {digit}
              </motion.button>
            ))}
            <motion.button
              type="button"
              onClick={handleBackspace}
              disabled={phase !== "recall"}
              whileHover={phase === "recall" ? { y: -1 } : undefined}
              whileTap={phase === "recall" ? tapScale : undefined}
              transition={springTransition}
              aria-label={t.quiz.digitSpanClear}
              className="flex h-12 w-12 items-center justify-center rounded-control border border-glass-border bg-glass text-muted-foreground backdrop-blur-xl focus-visible:outline-none disabled:opacity-50"
            >
              <Delete className="h-4 w-4" aria-hidden="true" />
            </motion.button>
            <motion.button
              type="button"
              onClick={() => handleDigit(0)}
              disabled={phase !== "recall"}
              whileHover={phase === "recall" ? { y: -1 } : undefined}
              whileTap={phase === "recall" ? tapScale : undefined}
              transition={springTransition}
              className="flex h-12 w-12 items-center justify-center rounded-control border border-glass-border bg-glass text-lg font-medium text-foreground backdrop-blur-xl focus-visible:outline-none disabled:opacity-50"
            >
              0
            </motion.button>
            <motion.button
              type="button"
              onClick={handleConfirm}
              disabled={!ready}
              whileHover={ready ? { y: -1 } : undefined}
              whileTap={ready ? tapScale : undefined}
              transition={springTransition}
              aria-label={t.quiz.digitSpanSubmit}
              className={cn(
                "flex h-12 w-12 items-center justify-center rounded-control focus-visible:outline-none",
                ready ? "bg-accent text-accent-foreground shadow-accent-sm" : "bg-accent/30 text-accent-foreground/60"
              )}
            >
              <Check className="h-5 w-5" aria-hidden="true" />
            </motion.button>
          </div>
        </>
      )}
    </div>
  );
}

/** Fixed-width box row - always shows `digits` boxes even before any input, so the target length is visible from the start. */
function DigitBoxes({
  digits,
  values,
  colorBy,
  tone,
}: {
  digits: number;
  values: number[];
  /** When present, colors each filled box green/red by comparing against this sequence instead of `tone`. */
  colorBy?: number[];
  tone?: "success";
}) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-1.5">
      {Array.from({ length: digits }, (_, i) => {
        const filled = i < values.length;
        const isRight = colorBy ? values[i] === colorBy[i] : true;
        return (
          <span
            key={i}
            className={cn(
              "flex h-10 w-8 items-center justify-center rounded-control border text-lg font-semibold backdrop-blur-xl",
              !filled && "border-glass-border bg-glass text-muted-foreground/40",
              filled &&
                (tone === "success"
                  ? "border-success bg-success/15 text-success"
                  : colorBy
                    ? isRight
                      ? "border-success bg-success/15 text-success"
                      : "border-danger bg-danger/15 text-danger"
                    : "border-accent bg-accent/10 text-foreground")
            )}
          >
            {filled ? values[i] : ""}
          </span>
        );
      })}
    </div>
  );
}

/** One segment per level of the ladder played so far in this run - not a continuous progress bar. */
function LevelSegments({ count, current }: { count: number; current: number }) {
  return (
    <div className="flex items-center gap-1" aria-hidden="true">
      {Array.from({ length: count }, (_, i) => (
        <span key={i} className={cn("h-1 w-5 rounded-full", i <= current ? "bg-accent" : "bg-surface-hover")} />
      ))}
    </div>
  );
}
